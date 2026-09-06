"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { creerCompte, type CreerCompteState } from "./actions"

const MOT_DE_PASSE_MIN = 12

export function CreerUnCompteForm() {
  const [state, formAction, pending] = useActionState<CreerCompteState | null, FormData>(
    creerCompte,
    null
  )
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [motDePasse, setMotDePasse] = useState("")
  const [consentement, setConsentement] = useState(false)

  const complet =
    code.trim() !== "" && email.trim() !== "" && motDePasse !== "" && consentement
  const caracteresManquants = Math.max(0, MOT_DE_PASSE_MIN - motDePasse.length)

  if (state?.success) {
    return (
      <div className="w-full max-w-sm rounded-[10px] border border-bordure bg-surface p-6 text-center shadow-[var(--shadow-panel)]">
        <h1 className="text-[24px] font-semibold text-texte">Compte créé</h1>
        <p className="mt-2 text-sm text-texte-2">
          Votre compte a été créé. Vous pouvez maintenant vous connecter.
        </p>
        <Link
          href="/connexion"
          className="mt-6 inline-block text-sm font-medium text-bleu-primaire hover:underline"
        >
          Aller à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm rounded-[10px] border border-bordure bg-surface p-6 shadow-[var(--shadow-panel)]">
      <h1 className="text-[24px] font-semibold text-texte">Créer un compte</h1>
      <p className="mt-1 text-sm text-texte-2">
        Utilisez le code d&apos;adhérent qui vous a été communiqué.
      </p>

      <form action={formAction} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="code">Code d&apos;adhérent</Label>
          <Input
            id="code"
            name="code"
            placeholder="RN05-XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={!!state?.errors?.code}
            required
          />
          {state?.errors?.code && (
            <p className="text-sm text-erreur">{state.errors.code}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!state?.errors?.email}
            required
          />
          {state?.errors?.email && (
            <p className="text-sm text-erreur">{state.errors.email}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="motDePasse">Mot de passe</Label>
          <Input
            id="motDePasse"
            name="motDePasse"
            type="password"
            autoComplete="new-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            aria-invalid={!!state?.errors?.motDePasse}
            required
          />
          <p className="text-xs text-texte-2">
            {caracteresManquants > 0
              ? `Encore ${caracteresManquants} caractère${caracteresManquants > 1 ? "s" : ""} minimum.`
              : "Longueur suffisante."}
          </p>
          {state?.errors?.motDePasse && (
            <p className="text-sm text-erreur">{state.errors.motDePasse}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-start gap-2">
            <Checkbox
              id="consentement"
              name="consentement"
              checked={consentement}
              onCheckedChange={(v) => setConsentement(v === true)}
              aria-invalid={!!state?.errors?.consentement}
              className="mt-0.5"
            />
            <Label htmlFor="consentement" className="text-sm font-normal text-texte-2">
              J&apos;accepte le traitement de mes données personnelles conformément à
              la{" "}
              <Link
                href="/politique-de-confidentialite"
                className="text-bleu-primaire hover:underline"
              >
                politique de confidentialité
              </Link>
              .
            </Label>
          </div>
          {state?.errors?.consentement && (
            <p className="text-sm text-erreur">{state.errors.consentement}</p>
          )}
        </div>

        {state?.errors?.general && (
          <Alert variant="destructive">
            <AlertDescription>{state.errors.general}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={!complet || pending} className="w-full">
          {pending ? "Création..." : "Créer mon compte"}
        </Button>
      </form>

      <Link
        href="/connexion"
        className="mt-4 block text-center text-sm text-bleu-primaire hover:underline"
      >
        J&apos;ai déjà un compte
      </Link>
    </div>
  )
}
