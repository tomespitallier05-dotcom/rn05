import { createClient } from "@/lib/supabase/server"
import { AnnuaireView } from "./annuaire-view"

export default async function AnnuairePage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, prenom, nom, commune, fonction_rn, role, photo_url")
    .is("deleted_at", null)
    .eq("statut", "actif")
    .eq("onboarding_complete", true)
    .order("nom", { ascending: true })

  const photoPaths = (profiles ?? [])
    .map((p) => p.photo_url)
    .filter((p): p is string => !!p)

  let signedByPath = new Map<string, string>()
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrls(photoPaths, 60 * 60)
    signedByPath = new Map(
      (signed ?? [])
        .filter((s): s is typeof s & { signedUrl: string } => !!s.signedUrl)
        .map((s) => [s.path ?? "", s.signedUrl])
    )
  }

  const membres = (profiles ?? []).map((p) => ({
    id: p.id,
    prenom: p.prenom,
    nom: p.nom,
    commune: p.commune,
    fonction_rn: p.fonction_rn,
    role: p.role,
    photoUrl: p.photo_url ? (signedByPath.get(p.photo_url) ?? null) : null,
  }))

  return <AnnuaireView membres={membres} />
}
