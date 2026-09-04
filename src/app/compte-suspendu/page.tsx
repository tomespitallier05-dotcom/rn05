import { Button } from "@/components/ui/button"
import { signOut } from "./actions"

export default function CompteSuspenduPage() {
  return (
    <div className="container-app flex flex-1 flex-col items-center justify-center py-12 text-center">
      <div className="w-full max-w-sm rounded-[10px] border border-bordure bg-surface p-6 shadow-[var(--shadow-panel)]">
        <h1 className="text-[24px] font-semibold text-texte">Accès suspendu</h1>
        <p className="mt-2 text-sm text-texte-2">
          Votre compte n&apos;est plus actif sur la plateforme. Contactez un
          administrateur de la fédération si vous pensez qu&apos;il s&apos;agit
          d&apos;une erreur.
        </p>
        <form action={signOut} className="mt-6">
          <Button type="submit" variant="outline" className="w-full">
            Se déconnecter
          </Button>
        </form>
      </div>
    </div>
  )
}
