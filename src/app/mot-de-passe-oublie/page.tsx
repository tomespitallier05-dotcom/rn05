"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { requestPasswordReset } from "./actions"

export default function MotDePasseOubliePage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null)

  return (
    <div className="container-app flex flex-1 flex-col items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-[10px] border border-bordure bg-surface p-6 shadow-[var(--shadow-panel)]">
        <h1 className="text-[24px] font-semibold text-texte">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-texte-2">
          Recevez un email pour réinitialiser votre mot de passe.
        </p>

        <form action={formAction} className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state?.success && (
            <Alert>
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Envoi..." : "Envoyer le lien de réinitialisation"}
          </Button>
        </form>

        <Link
          href="/connexion"
          className="mt-4 block text-center text-sm text-bleu-primaire hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
