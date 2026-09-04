"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export type MemberDetail = {
  id: string
  prenom: string | null
  nom: string | null
  commune: string | null
  fonction_rn: string | null
  profession: string | null
  secteur: string | null
  bio: string | null
  role: string
  photoUrl: string | null
  telephone: string | null
  peutVoirCoordonnees: boolean
}

async function clientIp() {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  return forwarded ? forwarded.split(",")[0]!.trim() : (h.get("x-real-ip") ?? null)
}

// Récupère la fiche complète d'un membre (y compris téléphone si le rôle de
// l'appelant l'y autorise — profiles_contact reste de toute façon filtré
// par RLS) et journalise la consultation quand ce n'est pas sa propre
// fiche (1.6 : "chaque consultation d'une fiche est enregistrée").
export async function getMemberDetail(profileId: string): Promise<MemberDetail | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, prenom, nom, commune, fonction_rn, profession, secteur, bio, role, photo_url")
    .eq("id", profileId)
    .single()

  if (!profile) return null

  const { data: contact } = await supabase
    .from("profiles_contact")
    .select("telephone")
    .eq("profile_id", profileId)
    .maybeSingle()

  let photoUrl: string | null = null
  if (profile.photo_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.photo_url, 60 * 60)
    photoUrl = signed?.signedUrl ?? null
  }

  if (profileId !== user.id) {
    const h = await headers()
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "consultation_fiche",
      table_cible: "profiles",
      id_cible: profileId,
      ip: await clientIp(),
      user_agent: h.get("user-agent"),
    })
  }

  return {
    id: profile.id,
    prenom: profile.prenom,
    nom: profile.nom,
    commune: profile.commune,
    fonction_rn: profile.fonction_rn,
    profession: profile.profession,
    secteur: profile.secteur,
    bio: profile.bio,
    role: profile.role,
    photoUrl,
    // null signifie "non chargé" : soit pas de contact, soit RLS a filtré
    // (profileId différent de l'appelant et rôle non autorisé).
    telephone: contact?.telephone ?? null,
    peutVoirCoordonnees: contact !== null,
  }
}
