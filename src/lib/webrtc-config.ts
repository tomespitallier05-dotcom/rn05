// TURN obligatoire en production (voir cahier des charges lot 2, partie A) :
// sans lui, ~15-20% des connexions échouent (pare-feux d'entreprise, NAT
// symétriques) et le problème est invisible en développement local où deux
// onglets du même navigateur se connectent toujours directement. Les
// identifiants doivent être NEXT_PUBLIC_ : RTCPeerConnection tourne dans le
// navigateur, ils lui sont nécessairement visibles (c'est le fonctionnement
// normal de WebRTC, pas une fuite) — voir le README pour la recommandation
// de identifiants à courte durée de vie en usage réel.
export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ]

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl.split(",").map((u) => u.trim()),
      username: turnUsername,
      credential: turnCredential,
    })
  }

  return servers
}

export function turnConfigure(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TURN_URL &&
      process.env.NEXT_PUBLIC_TURN_USERNAME &&
      process.env.NEXT_PUBLIC_TURN_CREDENTIAL
  )
}

export const DELAI_SONNERIE_MS = 45_000
export const DELAI_GRACE_DECONNEXION_MS = 5_000
