import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppHeader } from "./app-header"

// Coquille commune à tous les écrans authentifiés (le middleware garantit
// déjà la présence d'une session et un onboarding complet avant d'arriver
// ici, cette double vérification reste une défense en profondeur légère).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/connexion")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("prenom, nom, photo_url")
    .eq("id", user.id)
    .single()

  let photoUrl: string | null = null
  if (profile?.photo_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.photo_url, 60 * 60)
    photoUrl = signed?.signedUrl ?? null
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        email={user.email ?? ""}
        prenom={profile?.prenom}
        nom={profile?.nom}
        photoUrl={photoUrl}
      />
      <main className="flex flex-1 flex-col bg-fond">{children}</main>
    </div>
  )
}
