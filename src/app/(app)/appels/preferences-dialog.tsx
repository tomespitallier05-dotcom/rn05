"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { sonnerieCoupeePreference, definirSonnerieCoupee } from "./call-provider"
import { definirPreferencesAppel } from "./preferences-actions"

export function PreferencesAppelDialog({
  open,
  onOpenChange,
  nePasDerangerInitial,
  appelsDesactivesInitial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nePasDerangerInitial: boolean
  appelsDesactivesInitial: boolean
}) {
  const [nePasDeranger, setNePasDeranger] = useState(nePasDerangerInitial)
  const [appelsDesactives, setAppelsDesactives] = useState(appelsDesactivesInitial)
  const [sonnerieCoupee, setSonnerieCoupee] = useState(() => sonnerieCoupeePreference())
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function enregistrer() {
    setPending(true)
    setErreur(null)
    definirSonnerieCoupee(sonnerieCoupee)
    const result = await definirPreferencesAppel({ nePasDeranger, appelsDesactives })
    setPending(false)
    if (result.error) setErreur(result.error)
    else onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Préférences d&apos;appel</DialogTitle>
          <DialogDescription>
            S&apos;appliquent uniquement à l&apos;appel 1↔1 intégré, pas aux réunions
            visio de l&apos;agenda.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="ne-pas-deranger"
              checked={nePasDeranger}
              onCheckedChange={(v) => setNePasDeranger(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="ne-pas-deranger" className="font-normal">
              Ne pas me déranger — aucun appel ne pourra être lancé vers moi tant que
              c&apos;est activé.
            </Label>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="appels-desactives"
              checked={appelsDesactives}
              onCheckedChange={(v) => setAppelsDesactives(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="appels-desactives" className="font-normal">
              Désactiver entièrement la réception d&apos;appels.
            </Label>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="sonnerie-coupee"
              checked={sonnerieCoupee}
              onCheckedChange={(v) => setSonnerieCoupee(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="sonnerie-coupee" className="font-normal">
              Couper la sonnerie d&apos;appel entrant (préférence locale à cet appareil).
            </Label>
          </div>

          {erreur && (
            <Alert variant="destructive">
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" onClick={enregistrer} disabled={pending}>
            {pending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
