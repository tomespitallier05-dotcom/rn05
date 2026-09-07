export type TypeAppel = "audio" | "video"
export type StatutAppel = "sonne" | "en_cours" | "termine" | "manque" | "refuse"

export type Correspondant = {
  id: string
  prenom: string | null
  nom: string | null
  photoUrl: string | null
}

// Messages échangés sur le canal privé 'appel:<id>' (voir la migration
// appels : RLS Realtime réservée aux deux participants). "hangup" et
// "refuse" servent à fermer l'UI de l'autre côté sans attendre la
// réplication Postgres Changes de la ligne `appels`, plus lente.
export type MessageSignalisation =
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit }
  | { type: "refuse" }
  | { type: "hangup" }
  | { type: "cancel" }

export type QualiteConnexion = "bon" | "degrade" | "instable" | null

export type EtatAppel =
  | { phase: "sonne_sortant"; appelId: string; correspondant: Correspondant; type: TypeAppel }
  | { phase: "sonne_entrant"; appelId: string; correspondant: Correspondant; type: TypeAppel }
  | {
      phase: "connecte"
      appelId: string
      correspondant: Correspondant
      type: TypeAppel
      micActif: boolean
      cameraActive: boolean
      partageEcran: boolean
      qualite: QualiteConnexion
      replieAudio: boolean
    }
