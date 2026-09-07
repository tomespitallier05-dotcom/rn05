"use client"

import { useEffect, useRef } from "react"
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  MonitorUpIcon,
  PhoneOffIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "cn"
import { useCall } from "./call-provider"
import type { QualiteConnexion } from "./types"

function initiales(prenom?: string | null, nom?: string | null) {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?"
}

const QUALITE_LABEL: Record<Exclude<QualiteConnexion, null>, string> = {
  bon: "Bonne connexion",
  degrade: "Connexion dégradée",
  instable: "Connexion instable",
}

const QUALITE_COULEUR: Record<Exclude<QualiteConnexion, null>, string> = {
  bon: "var(--succes)",
  degrade: "var(--alerte)",
  instable: "var(--erreur)",
}

// Fenêtre d'appel en cours (3, interface) : vidéo distante en grand, vidéo
// locale en incrustation, contrôles ≥44px, raccrocher visuellement distinct.
export function InCallWindow() {
  const {
    etat,
    localStream,
    remoteStream,
    erreurPermission,
    erreurAppel,
    raccrocher,
    toggleMic,
    toggleCamera,
    togglePartageEcran,
    effacerErreurPermission,
  } = useCall()

  const videoDistanteRef = useRef<HTMLVideoElement>(null)
  const videoLocaleRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoDistanteRef.current) videoDistanteRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (videoLocaleRef.current) videoLocaleRef.current.srcObject = localStream
  }, [localStream])

  if (!etat || etat.phase !== "connecte") return null
  const { correspondant, type, micActif, cameraActive, partageEcran, qualite, replieAudio } = etat
  const videoVisible = type === "video" && !replieAudio

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bleu-nuit text-white">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {videoVisible ? (
          <video
            ref={videoDistanteRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Avatar size="lg" className="size-24">
              <AvatarImage src={correspondant.photoUrl ?? undefined} alt="" />
              <AvatarFallback className="text-2xl">
                {initiales(correspondant.prenom, correspondant.nom)}
              </AvatarFallback>
            </Avatar>
            <p className="text-lg font-semibold">
              {correspondant.prenom} {correspondant.nom}
            </p>
            {replieAudio && (
              <p className="text-sm text-white/70">
                Repli en audio seul — la connexion ne permettait plus la vidéo.
              </p>
            )}
          </div>
        )}

        {videoVisible && (
          <video
            ref={videoLocaleRef}
            autoPlay
            playsInline
            muted
            className="absolute right-4 bottom-4 h-32 w-24 rounded-md object-cover shadow-[var(--shadow-panel)] sm:h-40 sm:w-28"
          />
        )}

        {qualite && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: QUALITE_COULEUR[qualite] }}
            />
            {QUALITE_LABEL[qualite]}
          </div>
        )}

        {(erreurPermission || erreurAppel) && (
          <div className="absolute inset-x-4 top-16 mx-auto max-w-md">
            <Alert variant="destructive">
              <AlertDescription>{erreurPermission ?? erreurAppel}</AlertDescription>
            </Alert>
            {erreurPermission && (
              <button
                type="button"
                onClick={effacerErreurPermission}
                className="mt-1 text-xs text-white/70 underline"
              >
                Masquer
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-bleu-nuit px-4 py-4">
        <Button
          type="button"
          variant="secondary"
          size="icon-lg"
          className={cn("size-14 rounded-full", !micActif && "bg-erreur/80 text-white hover:bg-erreur")}
          aria-label={micActif ? "Couper le micro" : "Réactiver le micro"}
          aria-pressed={!micActif}
          onClick={toggleMic}
        >
          {micActif ? <MicIcon className="size-6" /> : <MicOffIcon className="size-6" />}
        </Button>

        {type === "video" && (
          <Button
            type="button"
            variant="secondary"
            size="icon-lg"
            className={cn(
              "size-14 rounded-full",
              !cameraActive && "bg-erreur/80 text-white hover:bg-erreur"
            )}
            aria-label={cameraActive ? "Couper la caméra" : "Réactiver la caméra"}
            aria-pressed={!cameraActive}
            onClick={toggleCamera}
          >
            {cameraActive ? <VideoIcon className="size-6" /> : <VideoOffIcon className="size-6" />}
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          size="icon-lg"
          className={cn("size-14 rounded-full", partageEcran && "bg-bleu-primaire text-white")}
          aria-label={partageEcran ? "Arrêter le partage d'écran" : "Partager l'écran"}
          aria-pressed={partageEcran}
          onClick={() => togglePartageEcran()}
        >
          <MonitorUpIcon className="size-6" />
        </Button>

        <Button
          type="button"
          size="icon-lg"
          className="size-14 rounded-full bg-erreur text-white hover:bg-erreur/90"
          aria-label="Raccrocher"
          onClick={raccrocher}
        >
          <PhoneOffIcon className="size-6" />
        </Button>
      </div>
    </div>
  )
}
