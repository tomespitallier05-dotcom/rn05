"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/announcement-categories"

const schema = z.object({
  titre: z.string().trim().min(1, "Le titre est obligatoire."),
  corps: z.string().trim().min(1, "Le contenu est obligatoire."),
  categorie: z.enum(ANNOUNCEMENT_CATEGORIES),
  epingle: z.boolean(),
})

function parseForm(formData: FormData) {
  return schema.safeParse({
    titre: formData.get("titre"),
    corps: formData.get("corps"),
    categorie: formData.get("categorie"),
    epingle: formData.get("epingle") === "on",
  })
}

export async function createAnnouncement(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Session expirée." }

  const { error } = await supabase.from("announcements").insert({
    titre: parsed.data.titre,
    corps: parsed.data.corps,
    categorie: parsed.data.categorie,
    epingle: parsed.data.epingle,
    auteur_id: user.id,
  })

  if (error) return { error: "La publication a échoué." }

  revalidatePath("/annonces")
  return {}
}

export async function updateAnnouncement(
  announcementId: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("announcements")
    .update({
      titre: parsed.data.titre,
      corps: parsed.data.corps,
      categorie: parsed.data.categorie,
      epingle: parsed.data.epingle,
    })
    .eq("id", announcementId)

  if (error) return { error: "La modification a échoué." }

  revalidatePath("/annonces")
  return {}
}

export async function deleteAnnouncement(announcementId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("announcements").delete().eq("id", announcementId)
  if (error) return { error: "La suppression a échoué." }

  revalidatePath("/annonces")
  return {}
}
