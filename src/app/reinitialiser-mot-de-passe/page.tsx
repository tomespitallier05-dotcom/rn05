"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updatePassword } from "./actions"

export default function ReinitialiserMotDePassePage() {
  const [state, formAction, pending] = useActionState(updatePassword, null)

  return (
    <div className="container-app flex flex-1 flex-col items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-[10px] border border-bordure bg-surface p-6 shadow-[var(--shadow-panel)]">
        <h1 className="text-[24px] font-semibold text-texte">
          Choisir un mot de passe
        </h1>
        <p className="mt-1 text-sm text-texte-2">12 caractères minimum.</p>

        <form action={formAction} className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
            <Input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
            />
          </div>
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Enregistrement..." : "Enregistrer le mot de passe"}
          </Button>
        </form>
      </div>
    </div>
  )
}
