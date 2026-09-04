"use client"

import { Suspense, useActionState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { signInWithPassword, signInWithMagicLink } from "./actions"

function PasswordForm({ redirectPath }: { redirectPath: string }) {
  const [state, formAction, pending] = useActionState(signInWithPassword, null)

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="redirect" value={redirectPath} />
      <div className="grid gap-1.5">
        <Label htmlFor="password-email">Email</Label>
        <Input
          id="password-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password-password">Mot de passe</Label>
          <Link
            href="/mot-de-passe-oublie"
            className="text-sm text-bleu-primaire hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <Input
          id="password-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  )
}

function MagicLinkForm({ redirectPath }: { redirectPath: string }) {
  const [state, formAction, pending] = useActionState(signInWithMagicLink, null)

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="redirect" value={redirectPath} />
      <div className="grid gap-1.5">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
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
        {pending ? "Envoi..." : "Recevoir un lien de connexion"}
      </Button>
    </form>
  )
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionForm />
    </Suspense>
  )
}

function ConnexionForm() {
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get("redirect")
  const redirectPath =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/tableau-de-bord"
  const lienInvalide = searchParams.get("erreur") === "lien_invalide"

  return (
    <div className="container-app flex flex-1 flex-col items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-[10px] border border-bordure bg-surface p-6 shadow-[var(--shadow-panel)]">
        <h1 className="text-[24px] font-semibold text-texte">Connexion</h1>
        <p className="mt-1 text-sm text-texte-2">
          Fédération RN des Hautes-Alpes — accès réservé aux adhérents invités.
        </p>

        {lienInvalide && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              Ce lien de connexion est invalide ou a expiré. Redemandez-en un
              nouveau.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="password" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="password" className="flex-1">
              Mot de passe
            </TabsTrigger>
            <TabsTrigger value="magic" className="flex-1">
              Lien magique
            </TabsTrigger>
          </TabsList>
          <TabsContent value="password" className="mt-4">
            <PasswordForm redirectPath={redirectPath} />
          </TabsContent>
          <TabsContent value="magic" className="mt-4">
            <MagicLinkForm redirectPath={redirectPath} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
