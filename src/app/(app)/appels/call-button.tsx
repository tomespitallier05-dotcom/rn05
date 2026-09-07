"use client"

import { PhoneIcon, VideoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCall } from "./call-provider"
import type { Correspondant } from "./types"

// Visible uniquement si la personne est connectée (présence Realtime, pas
// last_seen_at — 3, interface) : appelé depuis la fiche membre.
export function CallButton({ correspondant }: { correspondant: Correspondant }) {
  const { estEnLigne, demarrerAppel, etat } = useCall()

  if (!estEnLigne(correspondant.id)) return null

  const disabled = etat !== null

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-icon="inline-start"
        disabled={disabled}
        onClick={() => demarrerAppel(correspondant, "audio")}
      >
        <PhoneIcon />
        Appeler
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-icon="inline-start"
        disabled={disabled}
        onClick={() => demarrerAppel(correspondant, "video")}
      >
        <VideoIcon />
        Vidéo
      </Button>
    </div>
  )
}
