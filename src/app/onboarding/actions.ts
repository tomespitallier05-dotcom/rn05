"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/connexion")
  }
  return { supabase, user }
}

const identiteSchema = z.object({
  prenom: z.string().trim().min(1, "Le prénom est obligatoire."),
  nom: z.string().trim().min(1, "Le nom est obligatoire."),
  telephone: z.string().trim().optional(),
})

export async function saveIdentite(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = identiteSchema.safeParse({
    prenom: formData.get("prenom"),
    nom: formData.get("nom"),
    telephone: formData.get("telephone") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." }
  }

  const { supabase, user } = await requireUser()

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ prenom: parsed.data.prenom, nom: parsed.data.nom })
    .eq("id", user.id)
  if (profileError) {
    return { error: "L'enregistrement a échoué. Réessayez." }
  }

  if (parsed.data.telephone) {
    const { error: contactError } = await supabase
      .from("profiles_contact")
      .update({ telephone: parsed.data.telephone })
      .eq("profile_id", user.id)
    if (contactError) {
      return { error: "L'enregistrement du téléphone a échoué. Réessayez." }
    }
  }

  revalidatePath("/onboarding")
  return {}
}

const rattachementSchema = z.object({
  commune: z.string().trim().min(1, "La commune est obligatoire."),
  fonction_rn: z.string().trim().min(1, "La fonction est obligatoire."),
  profession: z.string().trim().optional(),
  secteur: z.string().trim().optional(),
})

export async function saveRattachement(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = rattachementSchema.safeParse({
    commune: formData.get("commune"),
    fonction_rn: formData.get("fonction_rn"),
    profession: formData.get("profession") || undefined,
    secteur: formData.get("secteur") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." }
  }

  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from("profiles")
    .update({
      commune: parsed.data.commune,
      fonction_rn: parsed.data.fonction_rn,
      profession: parsed.data.profession ?? null,
      secteur: parsed.data.secteur ?? null,
    })
    .eq("id", user.id)

  if (error) {
    return { error: "L'enregistrement a échoué. Réessayez." }
  }

  revalidatePath("/onboarding")
  return {}
}

const presentationSchema = z.object({
  bio: z.string().trim().optional(),
})

export async function savePresentation(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = presentationSchema.safeParse({
    bio: formData.get("bio") || undefined,
  })

  if (!parsed.success) {
    return { error: "Champs invalides." }
  }

  if (formData.get("consentement") !== "on") {
    return {
      error:
        "Le consentement au traitement des données est obligatoire pour continuer.",
    }
  }

  const { supabase, user } = await requireUser()

  // Un profil incomplet (prenom/nom/commune/fonction_rn manquants) ne peut
  // pas passer onboarding_complete à true : contrainte vérifiée aussi côté
  // base (check onboarding_requiert_identite), défense en profondeur.
  const { data: profile } = await supabase
    .from("profiles")
    .select("prenom, nom, commune, fonction_rn")
    .eq("id", user.id)
    .single()

  if (!profile?.prenom || !profile?.nom || !profile?.commune || !profile?.fonction_rn) {
    return {
      error: "Merci de compléter d'abord les étapes précédentes.",
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      bio: parsed.data.bio ?? null,
      consentement_traitement_le: new Date().toISOString(),
      onboarding_complete: true,
    })
    .eq("id", user.id)

  if (error) {
    return { error: "L'enregistrement a échoué. Réessayez." }
  }

  redirect("/tableau-de-bord")
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5 Mo
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function uploadAvatar(
  _prevState: { error?: string; photoUrl?: string } | null,
  formData: FormData
): Promise<{ error?: string; photoUrl?: string }> {
  const file = formData.get("photo")

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Aucun fichier sélectionné." }
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { error: "Format non pris en charge (JPEG, PNG ou WebP uniquement)." }
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { error: "Le fichier dépasse la taille maximale de 5 Mo." }
  }

  const { supabase, user } = await requireUser()

  const extension = file.name.split(".").pop() ?? "jpg"
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return { error: "L'envoi de la photo a échoué. Réessayez." }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ photo_url: path })
    .eq("id", user.id)

  if (updateError) {
    return { error: "L'enregistrement de la photo a échoué. Réessayez." }
  }

  const { data: signed } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, 60 * 60)

  revalidatePath("/onboarding")
  return { photoUrl: signed?.signedUrl }
}
