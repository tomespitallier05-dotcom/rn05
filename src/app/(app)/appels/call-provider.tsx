"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getIceServers, DELAI_SONNERIE_MS, DELAI_GRACE_DECONNEXION_MS } from "@/lib/webrtc-config"
import type { TablesUpdate } from "@/lib/supabase/database.types"
import type { Correspondant, EtatAppel, MessageSignalisation, QualiteConnexion, TypeAppel } from "./types"

type PatchAppel = TablesUpdate<"appels">

const CLE_SONNERIE_COUPEE = "rn05-sonnerie-coupee"

export const MESSAGE_PERMISSION_REFUSEE =
  "Micro (ou caméra) refusé par le navigateur. Pour réactiver : cliquez sur l'icône de cadenas ou de caméra barrée dans la barre d'adresse, autorisez le micro/la caméra pour ce site, puis réessayez."

export function sonnerieCoupeePreference(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(CLE_SONNERIE_COUPEE) === "true"
}

export function definirSonnerieCoupee(coupee: boolean) {
  if (typeof window === "undefined") return
  localStorage.setItem(CLE_SONNERIE_COUPEE, coupee ? "true" : "false")
}

type CallContextValue = {
  etat: EtatAppel | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  erreurPermission: string | null
  erreurAppel: string | null
  estEnLigne: (userId: string) => boolean
  demarrerAppel: (correspondant: Correspondant, type: TypeAppel) => Promise<void>
  accepterAppel: () => Promise<void>
  refuserAppel: () => void
  raccrocher: () => void
  toggleMic: () => void
  toggleCamera: () => void
  togglePartageEcran: () => Promise<void>
  effacerErreurPermission: () => void
}

const CallContext = createContext<CallContextValue | null>(null)

export function useCall() {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error("useCall doit être utilisé sous CallProvider.")
  return ctx
}

function subscribePrive(channel: RealtimeChannel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve()
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        reject(new Error(status))
      }
    })
  })
}

async function ouvrirMedia(type: TypeAppel): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    })
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === "NotAllowedError" || e.name === "PermissionDeniedError")
    ) {
      throw new Error("PERMISSION_REFUSEE")
    }
    throw e
  }
}

// Sonnerie synthétisée (pas de fichier audio à embarquer) : quelques bips
// répétés, coupables depuis les préférences (case à cocher, cf. header).
let sonnerieCtx: AudioContext | null = null
let sonnerieTimer: ReturnType<typeof setInterval> | null = null

function jouerSonnerie() {
  if (typeof window === "undefined" || sonnerieCoupeePreference()) return
  arreterSonnerie()
  const AudioCtor = window.AudioContext
  if (!AudioCtor) return
  const ctx = new AudioCtor()
  sonnerieCtx = ctx
  const bip = () => {
    if (ctx.state === "closed") return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  }
  bip()
  sonnerieTimer = setInterval(bip, 1200)
}

function arreterSonnerie() {
  if (sonnerieTimer) {
    clearInterval(sonnerieTimer)
    sonnerieTimer = null
  }
  if (sonnerieCtx) {
    sonnerieCtx.close().catch(() => {})
    sonnerieCtx = null
  }
}

export function CallProvider({
  userId,
  children,
}: {
  userId: string
  children: React.ReactNode
}) {
  const [supabase] = useState(() => createClient())
  const [etat, setEtat] = useState<EtatAppel | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [enLigneIds, setEnLigneIds] = useState<Set<string>>(new Set())
  const [erreurPermission, setErreurPermission] = useState<string | null>(null)
  const [erreurAppel, setErreurAppel] = useState<string | null>(null)

  const etatRef = useRef<EtatAppel | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([])
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const disconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const offerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)

  useEffect(() => {
    etatRef.current = etat
  }, [etat])

  const nettoyerAppel = useCallback(() => {
    arreterSonnerie()
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current)
      ringTimeoutRef.current = null
    }
    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current)
      disconnectTimeoutRef.current = null
    }
    if (offerIntervalRef.current) {
      clearInterval(offerIntervalRef.current)
      offerIntervalRef.current = null
    }
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    pendingIceRef.current = []
    pendingOfferRef.current = null
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
  }, [supabase])

  const marquerStatut = useCallback(
    async (appelId: string, patch: PatchAppel) => {
      await supabase.from("appels").update(patch).eq("id", appelId)
    },
    [supabase]
  )

  const envoyerSignal = useCallback((msg: MessageSignalisation) => {
    channelRef.current?.send({ type: "broadcast", event: "signal", payload: msg })
  }, [])

  const flushIce = useCallback(async () => {
    const pc = pcRef.current
    if (!pc) return
    const candidats = pendingIceRef.current
    pendingIceRef.current = []
    for (const c of candidats) {
      try {
        await pc.addIceCandidate(c)
      } catch {
        // candidat obsolète : sans conséquence, ICE en essaiera d'autres.
      }
    }
  }, [])

  const raccrocher = useCallback(() => {
    const e = etatRef.current
    if (!e) return
    if (e.phase === "connecte") {
      marquerStatut(e.appelId, { statut: "termine", termine_le: new Date().toISOString() })
      envoyerSignal({ type: "hangup" })
    } else if (e.phase === "sonne_sortant") {
      marquerStatut(e.appelId, { statut: "termine", termine_le: new Date().toISOString() })
      envoyerSignal({ type: "cancel" })
    }
    nettoyerAppel()
    setEtat(null)
  }, [marquerStatut, envoyerSignal, nettoyerAppel])
  const raccrocherRef = useRef(raccrocher)
  useEffect(() => {
    raccrocherRef.current = raccrocher
  }, [raccrocher])

  const creerPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: getIceServers() })
    pc.onicecandidate = (e) => {
      if (e.candidate) envoyerSignal({ type: "ice-candidate", candidate: e.candidate.toJSON() })
    }
    pc.ontrack = (e) => setRemoteStream(e.streams[0] ?? null)
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      if (state === "failed") {
        raccrocherRef.current()
      } else if (state === "disconnected") {
        if (disconnectTimeoutRef.current) clearTimeout(disconnectTimeoutRef.current)
        disconnectTimeoutRef.current = setTimeout(() => {
          if (pcRef.current?.iceConnectionState === "disconnected") raccrocherRef.current()
        }, DELAI_GRACE_DECONNEXION_MS)
      } else if (state === "connected" || state === "completed") {
        if (disconnectTimeoutRef.current) {
          clearTimeout(disconnectTimeoutRef.current)
          disconnectTimeoutRef.current = null
        }
      }
    }
    return pc
  }, [envoyerSignal])

  const handleSignal = useCallback(
    (msg: MessageSignalisation) => {
      switch (msg.type) {
        case "offer":
          pendingOfferRef.current = msg.sdp
          break
        case "answer": {
          const pc = pcRef.current
          if (pc && pc.signalingState !== "stable") {
            pc.setRemoteDescription(msg.sdp).then(flushIce)
          }
          if (ringTimeoutRef.current) {
            clearTimeout(ringTimeoutRef.current)
            ringTimeoutRef.current = null
          }
          if (offerIntervalRef.current) {
            clearInterval(offerIntervalRef.current)
            offerIntervalRef.current = null
          }
          const e = etatRef.current
          if (e && e.phase === "sonne_sortant") {
            marquerStatut(e.appelId, { statut: "en_cours", demarre_le: new Date().toISOString() })
            setEtat({
              phase: "connecte",
              appelId: e.appelId,
              correspondant: e.correspondant,
              type: e.type,
              micActif: true,
              cameraActive: e.type === "video",
              partageEcran: false,
              qualite: null,
              replieAudio: false,
            })
          }
          break
        }
        case "ice-candidate": {
          const pc = pcRef.current
          if (pc && pc.remoteDescription) {
            pc.addIceCandidate(msg.candidate).catch(() => {})
          } else {
            pendingIceRef.current.push(msg.candidate)
          }
          break
        }
        case "refuse":
        case "hangup":
        case "cancel":
          nettoyerAppel()
          setEtat(null)
          break
      }
    },
    [flushIce, marquerStatut, nettoyerAppel]
  )

  const demarrerAppel = useCallback(
    async (correspondant: Correspondant, type: TypeAppel) => {
      if (etatRef.current) return
      setErreurPermission(null)
      setErreurAppel(null)

      let stream: MediaStream
      try {
        stream = await ouvrirMedia(type)
      } catch (e) {
        if (e instanceof Error && e.message === "PERMISSION_REFUSEE") {
          setErreurPermission(MESSAGE_PERMISSION_REFUSEE)
          return
        }
        throw e
      }

      const { data: appel, error } = await supabase
        .from("appels")
        .insert({ appelant_id: userId, appele_id: correspondant.id, type })
        .select("id")
        .single()

      if (error || !appel) {
        stream.getTracks().forEach((t) => t.stop())
        setErreurAppel(
          "L'appel n'a pas pu être lancé (préférences de la personne appelée, ou erreur réseau)."
        )
        return
      }

      localStreamRef.current = stream
      setLocalStream(stream)

      const channel = supabase.channel(`appel:${appel.id}`, {
        config: { private: true, broadcast: { self: false } },
      })
      channelRef.current = channel
      channel.on("broadcast", { event: "signal" }, ({ payload }) =>
        handleSignal(payload as MessageSignalisation)
      )
      await subscribePrive(channel)

      const pc = creerPeerConnection()
      pcRef.current = pc
      stream.getTracks().forEach((t) => pc.addTrack(t, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Le canal Broadcast ne rejoue rien : si l'appelé n'a pas fini de s'y
      // abonner (latence de la notification Postgres Changes) au moment de
      // l'envoi, il rate l'offre pour toujours. On la renvoie donc jusqu'à
      // réception de la réponse (ou fin de la sonnerie).
      envoyerSignal({ type: "offer", sdp: offer })
      offerIntervalRef.current = setInterval(() => {
        envoyerSignal({ type: "offer", sdp: offer })
      }, 1000)

      setEtat({ phase: "sonne_sortant", appelId: appel.id, correspondant, type })

      ringTimeoutRef.current = setTimeout(async () => {
        await marquerStatut(appel.id, { statut: "manque" })
        envoyerSignal({ type: "cancel" })
        nettoyerAppel()
        setEtat(null)
      }, DELAI_SONNERIE_MS)
    },
    [userId, supabase, creerPeerConnection, handleSignal, envoyerSignal, marquerStatut, nettoyerAppel]
  )

  const accepterAppel = useCallback(async () => {
    const e = etatRef.current
    if (!e || e.phase !== "sonne_entrant") return
    arreterSonnerie()
    setErreurPermission(null)

    let stream: MediaStream
    try {
      stream = await ouvrirMedia(e.type)
    } catch (err) {
      if (err instanceof Error && err.message === "PERMISSION_REFUSEE") {
        setErreurPermission(MESSAGE_PERMISSION_REFUSEE)
        return
      }
      throw err
    }

    localStreamRef.current = stream
    setLocalStream(stream)

    const pc = creerPeerConnection()
    pcRef.current = pc
    stream.getTracks().forEach((t) => pc.addTrack(t, stream))

    const offer = pendingOfferRef.current
    if (offer) {
      await pc.setRemoteDescription(offer)
      await flushIce()
    }
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    envoyerSignal({ type: "answer", sdp: answer })

    await marquerStatut(e.appelId, { statut: "en_cours", demarre_le: new Date().toISOString() })

    setEtat({
      phase: "connecte",
      appelId: e.appelId,
      correspondant: e.correspondant,
      type: e.type,
      micActif: true,
      cameraActive: e.type === "video",
      partageEcran: false,
      qualite: null,
      replieAudio: false,
    })
  }, [creerPeerConnection, flushIce, envoyerSignal, marquerStatut])

  const refuserAppel = useCallback(() => {
    const e = etatRef.current
    if (!e || e.phase !== "sonne_entrant") return
    marquerStatut(e.appelId, { statut: "refuse" })
    envoyerSignal({ type: "refuse" })
    nettoyerAppel()
    setEtat(null)
  }, [marquerStatut, envoyerSignal, nettoyerAppel])

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setEtat((prev) => (prev && prev.phase === "connecte" ? { ...prev, micActif: track.enabled } : prev))
  }, [])

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setEtat((prev) => (prev && prev.phase === "connecte" ? { ...prev, cameraActive: track.enabled } : prev))
  }, [])

  const togglePartageEcran = useCallback(async () => {
    const e = etatRef.current
    const pc = pcRef.current
    if (!e || e.phase !== "connecte" || !pc) return
    const sender = pc.getSenders().find((s) => s.track?.kind === "video")

    if (e.partageEcran) {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true })
      const camTrack = camStream.getVideoTracks()[0]
      if (camTrack && sender) await sender.replaceTrack(camTrack)
      const ancienneVideo = localStreamRef.current?.getVideoTracks()[0]
      ancienneVideo?.stop()
      if (localStreamRef.current && camTrack) {
        if (ancienneVideo) localStreamRef.current.removeTrack(ancienneVideo)
        localStreamRef.current.addTrack(camTrack)
      }
      setEtat((prev) => (prev && prev.phase === "connecte" ? { ...prev, partageEcran: false } : prev))
    } else {
      let ecranStream: MediaStream
      try {
        ecranStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      } catch {
        return
      }
      const ecranTrack = ecranStream.getVideoTracks()[0]
      if (ecranTrack && sender) await sender.replaceTrack(ecranTrack)
      const ancienneVideo = localStreamRef.current?.getVideoTracks()[0]
      ancienneVideo?.stop()
      if (localStreamRef.current && ecranTrack) {
        if (ancienneVideo) localStreamRef.current.removeTrack(ancienneVideo)
        localStreamRef.current.addTrack(ecranTrack)
      }
      if (ecranTrack) {
        ecranTrack.onended = () => togglePartageEcranRef.current()
      }
      setEtat((prev) => (prev && prev.phase === "connecte" ? { ...prev, partageEcran: true } : prev))
    }
  }, [])
  const togglePartageEcranRef = useRef(togglePartageEcran)
  useEffect(() => {
    togglePartageEcranRef.current = togglePartageEcran
  }, [togglePartageEcran])

  // Écoute des appels entrants : Postgres Changes sur `appels`, déjà
  // filtré par la RLS (appels_select) — aucun événement pour un appel
  // dont cet utilisateur n'est pas le destinataire.
  useEffect(() => {
    const channel = supabase
      .channel("appels-entrants")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appels", filter: `appele_id=eq.${userId}` },
        async (payload) => {
          const row = payload.new as {
            id: string
            appelant_id: string
            type: TypeAppel
            statut: string
          }
          if (row.statut !== "sonne") return

          if (etatRef.current) {
            // Déjà en appel : occupé, pas de sonnerie.
            await supabase.from("appels").update({ statut: "refuse" }).eq("id", row.id)
            return
          }

          const { data: profil } = await supabase
            .from("profiles")
            .select("id, prenom, nom, photo_url")
            .eq("id", row.appelant_id)
            .single()

          let photoUrl: string | null = null
          if (profil?.photo_url) {
            const { data: signed } = await supabase.storage
              .from("avatars")
              .createSignedUrl(profil.photo_url, 3600)
            photoUrl = signed?.signedUrl ?? null
          }

          const correspondant: Correspondant = {
            id: row.appelant_id,
            prenom: profil?.prenom ?? null,
            nom: profil?.nom ?? null,
            photoUrl,
          }

          const callChannel = supabase.channel(`appel:${row.id}`, {
            config: { private: true, broadcast: { self: false } },
          })
          channelRef.current = callChannel
          callChannel.on("broadcast", { event: "signal" }, ({ payload: p }) =>
            handleSignal(p as MessageSignalisation)
          )
          await subscribePrive(callChannel)

          setEtat({ phase: "sonne_entrant", appelId: row.id, correspondant, type: row.type })
          jouerSonnerie()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, handleSignal])

  // Présence : "en ligne" sert au bouton d'appel (jamais last_seen_at).
  useEffect(() => {
    const channel = supabase.channel("presence:membres", {
      config: { presence: { key: userId } },
    })
    channel.on("presence", { event: "sync" }, () => {
      setEnLigneIds(new Set(Object.keys(channel.presenceState())))
    })
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ en_ligne_depuis: new Date().toISOString() })
      }
    })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Wake Lock pendant un appel connecté (mobile : empêche la mise en veille).
  useEffect(() => {
    if (etat?.phase !== "connecte") return
    let annule = false
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> }
    }
    nav.wakeLock
      ?.request("screen")
      .then((sentinel) => {
        if (annule) {
          sentinel.release().catch(() => {})
          return
        }
        wakeLockRef.current = sentinel
      })
      .catch(() => {
        // Non bloquant : indisponible sur certains navigateurs/contextes.
      })
    return () => {
      annule = true
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [etat?.phase])

  // Qualité de connexion + repli audio automatique si elle se dégrade trop.
  useEffect(() => {
    if (etat?.phase !== "connecte") return
    const interval = setInterval(async () => {
      const pc = pcRef.current
      if (!pc) return
      const stats = await pc.getStats()
      let rtt: number | null = null
      let packetsLost = 0
      let packetsReceived = 0
      // RTCStatsReport.forEach expose des rapports au format libre (varie
      // selon le type de rapport) : non typable finement, d'où ce record.
      stats.forEach((report: Record<string, unknown>) => {
        if (report.type === "candidate-pair" && report.state === "succeeded") {
          const v = report.currentRoundTripTime
          if (typeof v === "number") rtt = v
        }
        if (report.type === "inbound-rtp") {
          const lost = report.packetsLost
          const received = report.packetsReceived
          if (typeof lost === "number") packetsLost += lost
          if (typeof received === "number") packetsReceived += received
        }
      })
      const perte = packetsReceived > 0 ? packetsLost / (packetsLost + packetsReceived) : 0
      let qualite: QualiteConnexion = "bon"
      if (perte > 0.08 || (rtt !== null && rtt > 0.4)) qualite = "instable"
      else if (perte > 0.02 || (rtt !== null && rtt > 0.2)) qualite = "degrade"

      setEtat((prev) => {
        if (!prev || prev.phase !== "connecte") return prev
        if (qualite === "instable" && prev.type === "video" && !prev.replieAudio) {
          const videoTrack = localStreamRef.current?.getVideoTracks()[0]
          if (videoTrack) videoTrack.enabled = false
          return { ...prev, qualite, replieAudio: true }
        }
        return { ...prev, qualite }
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [etat?.phase])

  useEffect(() => {
    return () => nettoyerAppel()
  }, [nettoyerAppel])

  const estEnLigne = useCallback((id: string) => enLigneIds.has(id), [enLigneIds])
  const effacerErreurPermission = useCallback(() => setErreurPermission(null), [])

  return (
    <CallContext.Provider
      value={{
        etat,
        localStream,
        remoteStream,
        erreurPermission,
        erreurAppel,
        estEnLigne,
        demarrerAppel,
        accepterAppel,
        refuserAppel,
        raccrocher,
        toggleMic,
        toggleCamera,
        togglePartageEcran,
        effacerErreurPermission,
      }}
    >
      {children}
    </CallContext.Provider>
  )
}
