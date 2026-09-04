"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import {
  saveIdentite,
  saveRattachement,
  savePresentation,
  uploadAvatar,
} from "./actions"

type DefaultValues = {
  prenom: string
  nom: string
  telephone: string
  commune: string
  fonction_rn: string
  profession: string
  secteur: string
  bio: string
  photoUrl: string | null
}

const ETAPES = [
  { numero: 1, label: "Identité" },
  { numero: 2, label: "Rattachement" },
  { numero: 3, label: "Présentation" },
] as const

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="flex gap-2">
        {ETAPES.map((etape) => (
          <div
            key={etape.numero}
            className={`h-1.5 flex-1 rounded-full ${
              etape.numero <= step ? "bg-bleu-primaire" : "bg-bleu-clair"
            }`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-texte-2">
        {ETAPES.map((etape) => (
          <span
            key={etape.numero}
            className={etape.numero === step ? "font-medium text-texte" : undefined}
          >
            {etape.numero}. {etape.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function IdentiteStep({
  defaultValues,
  onDone,
}: {
  defaultValues: DefaultValues
  onDone: () => void
}) {
  const [state, formAction, pending] = useActionState(
    async (prevState: { error?: string } | null, formData: FormData) => {
      const result = await saveIdentite(prevState, formData)
      if (!result.error) onDone()
      return result
    },
    null
  )

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="prenom">Prénom *</Label>
        <Input id="prenom" name="prenom" required defaultValue={defaultValues.prenom} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="nom">Nom *</Label>
        <Input id="nom" name="nom" required defaultValue={defaultValues.nom} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="telephone">Téléphone</Label>
        <Input
          id="telephone"
          name="telephone"
          type="tel"
          defaultValue={defaultValues.telephone}
        />
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enregistrement..." : "Suivant"}
      </Button>
    </form>
  )
}

function RattachementStep({
  defaultValues,
  onDone,
  onBack,
}: {
  defaultValues: DefaultValues
  onDone: () => void
  onBack: () => void
}) {
  const [state, formAction, pending] = useActionState(
    async (prevState: { error?: string } | null, formData: FormData) => {
      const result = await saveRattachement(prevState, formData)
      if (!result.error) onDone()
      return result
    },
    null
  )

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="commune">Commune *</Label>
        <Input id="commune" name="commune" required defaultValue={defaultValues.commune} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="fonction_rn">Fonction *</Label>
        <Input
          id="fonction_rn"
          name="fonction_rn"
          required
          defaultValue={defaultValues.fonction_rn}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="profession">Profession</Label>
        <Input id="profession" name="profession" defaultValue={defaultValues.profession} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="secteur">Secteur</Label>
        <Input id="secteur" name="secteur" defaultValue={defaultValues.secteur} />
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Précédent
        </Button>
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Enregistrement..." : "Suivant"}
        </Button>
      </div>
    </form>
  )
}

function AvatarUploader({ initialUrl }: { initialUrl: string | null }) {
  const [state, formAction, pending] = useActionState(uploadAvatar, null)
  const currentUrl = state?.photoUrl ?? initialUrl

  return (
    <form action={formAction} className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={currentUrl ?? undefined} alt="Photo de profil" />
        <AvatarFallback>Photo</AvatarFallback>
      </Avatar>
      <div className="grid gap-1.5">
        <Label htmlFor="photo">Photo (facultatif)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="max-w-64"
          />
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? "Envoi..." : "Téléverser"}
          </Button>
        </div>
        {state?.error && <p className="text-sm text-erreur">{state.error}</p>}
      </div>
    </form>
  )
}

function PresentationStep({
  defaultValues,
  onBack,
}: {
  defaultValues: DefaultValues
  onBack: () => void
}) {
  const [state, formAction, pending] = useActionState(savePresentation, null)

  return (
    <div className="grid gap-4">
      <AvatarUploader initialUrl={defaultValues.photoUrl} />
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="bio">Biographie</Label>
          <Textarea id="bio" name="bio" defaultValue={defaultValues.bio} />
        </div>
        <div className="flex items-start gap-2">
          <Checkbox id="consentement" name="consentement" required className="mt-0.5" />
          <Label htmlFor="consentement" className="text-sm font-normal text-texte-2">
            J&apos;accepte que mes données soient traitées par la fédération
            conformément à la{" "}
            <Link
              href="/politique-de-confidentialite"
              target="_blank"
              className="text-bleu-primaire hover:underline"
            >
              politique de confidentialité
            </Link>
            . *
          </Label>
        </div>
        {state?.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Précédent
          </Button>
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Enregistrement..." : "Terminer"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function OnboardingWizard({
  initialStep,
  defaultValues,
}: {
  initialStep: 1 | 2 | 3
  defaultValues: DefaultValues
}) {
  const [step, setStep] = useState(initialStep)

  return (
    <div className="w-full max-w-md rounded-[10px] border border-bordure bg-surface p-6 shadow-[var(--shadow-panel)]">
      <h1 className="text-[24px] font-semibold text-texte">
        Bienvenue sur la plateforme
      </h1>
      <p className="mt-1 text-sm text-texte-2">
        Complétez votre profil pour continuer.
      </p>

      <ProgressBar step={step} />

      {step === 1 && (
        <IdentiteStep
          defaultValues={defaultValues}
          onDone={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <RattachementStep
          defaultValues={defaultValues}
          onDone={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <PresentationStep defaultValues={defaultValues} onBack={() => setStep(2)} />
      )}
    </div>
  )
}
