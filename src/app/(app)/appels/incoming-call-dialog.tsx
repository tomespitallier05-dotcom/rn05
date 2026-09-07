"use client"

import { PhoneIcon, PhoneOffIcon, VideoIcon } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCall } from "./call-provider"

function initiales(prenom?: string | null, nom?: string | null) {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?"
}

// Fenêtre d'appel entrant (3, interface) : nom, type d'appel, accepter/
// refuser. Ne se ferme pas au clic extérieur ni à Échap — un appel entrant
// se traite explicitement, il ne se rate pas par un clic à côté.
export function IncomingCallDialog() {
  const { etat, accepterAppel, refuserAppel } = useCall()

  if (!etat || etat.phase !== "sonne_entrant") return null
  const { correspondant, type } = etat

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="text-center"
      >
        <DialogTitle className="sr-only">Appel entrant</DialogTitle>
        <DialogDescription className="sr-only">
          Appel {type === "video" ? "vidéo" : "audio"} entrant de{" "}
          {correspondant.prenom} {correspondant.nom}
        </DialogDescription>

        <div className="grid gap-4 py-2">
          <Avatar size="lg" className="mx-auto size-20">
            <AvatarImage src={correspondant.photoUrl ?? undefined} alt="" />
            <AvatarFallback className="text-lg">
              {initiales(correspondant.prenom, correspondant.nom)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold text-texte">
              {correspondant.prenom} {correspondant.nom}
            </p>
            <p className="flex items-center justify-center gap-1.5 text-sm text-texte-2">
              {type === "video" ? <VideoIcon className="size-4" /> : <PhoneIcon className="size-4" />}
              Appel {type === "video" ? "vidéo" : "audio"} entrant
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Refuser"
              className="size-14 rounded-full border-erreur text-erreur hover:bg-erreur/10"
              onClick={refuserAppel}
            >
              <PhoneOffIcon className="size-6" />
            </Button>
            <Button
              type="button"
              size="icon-lg"
              aria-label="Accepter"
              className="size-14 rounded-full bg-succes text-white hover:bg-succes/90"
              onClick={accepterAppel}
            >
              <PhoneIcon className="size-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
