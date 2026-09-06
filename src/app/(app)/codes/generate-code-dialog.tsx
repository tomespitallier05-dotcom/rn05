"use client"

import { useActionState, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLES, ROLE_LABEL, STATUTS, STATUT_LABEL } from "@/lib/roles"
import { genererCodeAction } from "./actions"

export function GenerateCodeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [state, formAction, pending] = useActionState(genererCodeAction, null)
  const [copie, setCopie] = useState(false)

  // Le code généré n'est plus accessible une fois la fenêtre fermée
  // (useActionState garde son state tant que le composant reste monté,
  // mais on force un formulaire vierge à la prochaine ouverture).
  function fermer(ouvert: boolean) {
    if (!ouvert) setCopie(false)
    onOpenChange(ouvert)
  }

  async function copier() {
    if (!state?.code) return
    await navigator.clipboard.writeText(state.code)
    setCopie(true)
  }

  return (
    <Dialog open={open} onOpenChange={fermer}>
      <DialogContent>
        {state?.code ? (
          <>
            <DialogHeader>
              <DialogTitle>Code généré</DialogTitle>
              <DialogDescription>
                Communiquez-le vous-même (SMS, papier, réunion) : il ne sera
                plus jamais affiché après la fermeture de cette fenêtre.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-md border border-bordure bg-fond px-3 py-2.5">
              <code className="flex-1 font-mono text-base tracking-wide text-texte">
                {state.code}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-icon="inline-start"
                onClick={copier}
              >
                {copie ? <CheckIcon /> : <CopyIcon />}
                {copie ? "Copié" : "Copier"}
              </Button>
            </div>
            <Alert variant="destructive">
              <AlertDescription>
                Ce code ne sera plus jamais réaffiché, y compris à
                vous-même. S&apos;il est perdu, révoquez-le et générez-en un
                nouveau.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button type="button" onClick={() => fermer(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Générer un code</DialogTitle>
              <DialogDescription>
                Le rôle et le statut choisis ici sont ceux du compte créé —
                l&apos;inscrit ne les choisit pas.
              </DialogDescription>
            </DialogHeader>
            <form action={formAction} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="libelle">Libellé</Label>
                <Input
                  id="libelle"
                  name="libelle"
                  placeholder="Ex. Réunion de section du 12 mars"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="role">Rôle attribué</Label>
                  <Select name="role" defaultValue="membre">
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="statut">Statut initial</Label>
                  <Select name="statut" defaultValue="actif">
                    <SelectTrigger id="statut" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUT_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="usagesMax">Nombre d&apos;usages</Label>
                  <Input
                    id="usagesMax"
                    name="usagesMax"
                    type="number"
                    min={1}
                    max={1000}
                    defaultValue={1}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dureeJours">Validité (jours)</Label>
                  <Input
                    id="dureeJours"
                    name="dureeJours"
                    type="number"
                    min={1}
                    max={365}
                    defaultValue={7}
                    required
                  />
                </div>
              </div>
              {state?.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={pending}>
                {pending ? "Génération..." : "Générer le code"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
