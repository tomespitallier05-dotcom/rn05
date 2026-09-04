import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingWizard } from "./onboarding-wizard"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/connexion")
  }

  const [{ data: profile }, { data: contact }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "prenom, nom, commune, fonction_rn, profession, secteur, bio, photo_url"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("profiles_contact")
      .select("telephone")
      .eq("profile_id", user.id)
      .single(),
  ])

  let initialStep: 1 | 2 | 3 = 1
  if (profile?.prenom && profile?.nom) initialStep = 2
  if (profile?.commune && profile?.fonction_rn) initialStep = 3

  let photoUrl: string | null = null
  if (profile?.photo_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.photo_url, 60 * 60)
    photoUrl = signed?.signedUrl ?? null
  }

  return (
    <div className="container-app flex flex-1 flex-col items-center justify-center py-12">
      <OnboardingWizard
        initialStep={initialStep}
        defaultValues={{
          prenom: profile?.prenom ?? "",
          nom: profile?.nom ?? "",
          telephone: contact?.telephone ?? "",
          commune: profile?.commune ?? "",
          fonction_rn: profile?.fonction_rn ?? "",
          profession: profile?.profession ?? "",
          secteur: profile?.secteur ?? "",
          bio: profile?.bio ?? "",
          photoUrl,
        }}
      />
    </div>
  )
}
