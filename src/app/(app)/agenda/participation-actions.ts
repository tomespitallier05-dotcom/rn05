"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { REPONSES, type Compteurs, type Reponse } from "@/lib/participation"

const reponseSchema = z.object({
  eventId: z.string().uuid(),
  reponse: z.enum(REPONSES),
})

// Upsert (jamais de delete, cf. participations_update en RLS) : changer
// d'avis met à jour la ligne existante et rafraîchit repondu_le, sans
// jamais créer de doublon (unique (event_id, user_id)). Un événement dont
// la date limite est dépassée, ou qui n'attend plus de réponse, refuse la
// requête côté serveur (policies participations_insert/participations_update) —
// ce n'est pas seulement l'UI qui désactive les boutons.
export async function repondreEvenement(
  eventId: string,
  reponse: string
): Promise<{ error?: string }> {
  const parsed = reponseSchema.safeParse({ eventId, reponse })
  if (!parsed.success) {
    return { error: "Réponse invalide." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Session expirée." }

  const { error } = await supabase.from("participations").upsert(
    {
      event_id: parsed.data.eventId,
      user_id: user.id,
      reponse: parsed.data.reponse,
      repondu_le: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id" }
  )

  if (error) {
    return {
      error: "La réponse n'a pas pu être enregistrée : les réponses sont peut-être closes.",
    }
  }

  revalidatePath("/agenda")
  return {}
}

export async function getParticipationEtat(eventId: string): Promise<{
  maReponse: Reponse | null
  compteurs: Compteurs | null
  error?: string
}> {
  const parsed = z.string().uuid().safeParse(eventId)
  if (!parsed.success) {
    return { maReponse: null, compteurs: null, error: "Événement invalide." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { maReponse: null, compteurs: null, error: "Session expirée." }
  }

  const [{ data: mienne }, { data: compteurs }] = await Promise.all([
    supabase
      .from("participations")
      .select("reponse")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.rpc("compteurs_participation", { p_event: eventId }).maybeSingle(),
  ])

  return {
    maReponse: (mienne?.reponse as Reponse | undefined) ?? null,
    compteurs: compteurs ?? null,
  }
}

export type ReponseListee = {
  prenom: string | null
  nom: string | null
  reponse: Reponse
  commentaire: string | null
  repondu_le: string
}

// Réservé à l'organisateur/bureau/admin, mais uniquement par la RLS
// (participations_select) : un membre simple n'obtient ici que sa propre
// ligne, jamais celles des autres, même en appelant cette action.
export async function getListeReponses(
  eventId: string
): Promise<{ data: ReponseListee[]; error?: string }> {
  const parsed = z.string().uuid().safeParse(eventId)
  if (!parsed.success) {
    return { data: [], error: "Événement invalide." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("participations")
    .select("user_id, reponse, commentaire, repondu_le")
    .eq("event_id", eventId)
    .order("repondu_le", { ascending: true })

  if (error) {
    return { data: [], error: "La liste des réponses n'a pas pu être chargée." }
  }

  // participations.user_id référence auth.users, pas public.profiles :
  // PostgREST ne peut pas les imbriquer automatiquement (pas de FK entre
  // les deux tables), d'où cette jointure applicative en deux temps.
  const { data: profils } = await supabase
    .from("profiles")
    .select("id, prenom, nom")
    .in("id", (data ?? []).map((r) => r.user_id))
  const profilParId = new Map((profils ?? []).map((p) => [p.id, p]))

  return {
    data: (data ?? []).map((r) => ({
      prenom: profilParId.get(r.user_id)?.prenom ?? null,
      nom: profilParId.get(r.user_id)?.nom ?? null,
      reponse: r.reponse as Reponse,
      commentaire: r.commentaire,
      repondu_le: r.repondu_le,
    })),
  }
}
