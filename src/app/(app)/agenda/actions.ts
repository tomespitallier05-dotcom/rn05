"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { CATEGORIES } from "@/lib/agenda-categories"

const eventSchema = z
  .object({
    titre: z.string().trim().min(1, "Le titre est obligatoire."),
    description: z.string().trim().optional(),
    debut: z.string().min(1, "La date de début est obligatoire."),
    fin: z.string().min(1, "La date de fin est obligatoire."),
    lieu: z.string().trim().optional(),
    categorie: z.enum(CATEGORIES),
    visibilite: z.enum(["tous", "bureau", "role"]),
  })
  .refine((data) => new Date(data.fin) >= new Date(data.debut), {
    message: "La fin doit être postérieure au début.",
    path: ["fin"],
  })

export async function createEvent(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = eventSchema.safeParse({
    titre: formData.get("titre"),
    description: formData.get("description") || undefined,
    debut: formData.get("debut"),
    fin: formData.get("fin"),
    lieu: formData.get("lieu") || undefined,
    categorie: formData.get("categorie"),
    visibilite: formData.get("visibilite"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Session expirée." }
  }

  const { error } = await supabase.from("events").insert({
    titre: parsed.data.titre,
    description: parsed.data.description ?? null,
    debut: new Date(parsed.data.debut).toISOString(),
    fin: new Date(parsed.data.fin).toISOString(),
    lieu: parsed.data.lieu ?? null,
    categorie: parsed.data.categorie,
    visibilite: parsed.data.visibilite,
    created_by: user.id,
    organisateur_id: user.id,
  })

  if (error) {
    return { error: "La création a échoué. Réessayez." }
  }

  revalidatePath("/agenda")
  return {}
}

export async function updateEvent(
  eventId: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = eventSchema.safeParse({
    titre: formData.get("titre"),
    description: formData.get("description") || undefined,
    debut: formData.get("debut"),
    fin: formData.get("fin"),
    lieu: formData.get("lieu") || undefined,
    categorie: formData.get("categorie"),
    visibilite: formData.get("visibilite"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("events")
    .update({
      titre: parsed.data.titre,
      description: parsed.data.description ?? null,
      debut: new Date(parsed.data.debut).toISOString(),
      fin: new Date(parsed.data.fin).toISOString(),
      lieu: parsed.data.lieu ?? null,
      categorie: parsed.data.categorie,
      visibilite: parsed.data.visibilite,
    })
    .eq("id", eventId)

  if (error) {
    return { error: "La modification a échoué (droits insuffisants ou erreur serveur)." }
  }

  revalidatePath("/agenda")
  return {}
}

export async function deleteEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", eventId)

  if (error) {
    return { error: "La suppression a échoué (droits insuffisants ou erreur serveur)." }
  }

  revalidatePath("/agenda")
  return {}
}
