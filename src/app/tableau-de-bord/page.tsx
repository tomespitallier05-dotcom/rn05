import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { signOut } from "./actions"

// Placeholder de vérification pour l'étape 3 (authentification/middleware).
// Sera remplacé par le vrai tableau de bord (1.4) à l'étape 4.
export default async function TableauDeBordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="container-app flex flex-1 flex-col gap-4 py-12">
      <h1 className="text-[24px] font-semibold text-texte">Tableau de bord</h1>
      <p className="text-sm text-texte-2">
        Route protégée : accessible uniquement avec une session active. Connecté
        en tant que <strong>{user?.email}</strong>.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Se déconnecter
        </Button>
      </form>
    </div>
  )
}
