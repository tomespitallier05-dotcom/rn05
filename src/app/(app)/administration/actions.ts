"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ROLES, STATUTS } from "@/lib/roles"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Session expirée." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { ok: false as const, error: "Réservé aux administrateurs." }
  }

  return { ok: true as const, supabase, userId: user.id }
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

const CLE_ABSENTE =
  "Clé secrète non configurée : configurez SUPABASE_SECRET_KEY dans .env.local (voir le dashboard Supabase > Project Settings > API Keys > \"secret\")."

// Garde-fou 5 : une opération qui retirerait à un admin actif son rôle ou
// son statut (modification, suspension, archivage, suppression) est
// refusée s'il ne reste aucun autre administrateur actif ensuite — sinon
// plus personne ne peut gérer les comptes.
async function estDernierAdminActif(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
) {
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("statut", "actif")
    .is("deleted_at", null)
    .neq("id", profileId)

  return (count ?? 0) === 0
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  role: z.enum(ROLES),
})

export async function inviteAccount(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const check = await requireAdmin()
  if (!check.ok) return { error: check.error }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." }
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return { error: CLE_ABSENTE }
  }

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent("/onboarding")}`,
  })

  if (error || !data.user) {
    return { error: `L'invitation a échoué : ${error?.message ?? "erreur inconnue"}.` }
  }

  if (parsed.data.role !== "membre") {
    await adminClient.from("profiles").update({ role: parsed.data.role }).eq("id", data.user.id)
  }

  await check.supabase.from("audit_log").insert({
    user_id: check.userId,
    action: "invitation_compte",
    table_cible: "profiles",
    id_cible: data.user.id,
  })

  revalidatePath("/administration")
  return { success: `Invitation envoyée à ${parsed.data.email}.` }
}

export async function updateAccountRole(
  profileId: string,
  role: string
): Promise<{ error?: string }> {
  const check = await requireAdmin()
  if (!check.ok) return { error: check.error }

  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return { error: "Rôle invalide." }
  }

  // Garde-fou 5 : un admin ne peut pas modifier son propre rôle.
  if (profileId === check.userId) {
    return { error: "Vous ne pouvez pas modifier votre propre rôle." }
  }

  if (role !== "admin" && (await estDernierAdminActif(check.supabase, profileId))) {
    return {
      error: "Impossible : cela laisserait la fédération sans administrateur actif.",
    }
  }

  const { error } = await check.supabase
    .from("profiles")
    .update({ role: role as (typeof ROLES)[number] })
    .eq("id", profileId)
  if (error) return { error: "La modification du rôle a échoué." }

  revalidatePath("/administration")
  return {}
}

export async function updateAccountStatut(
  profileId: string,
  statut: string
): Promise<{ error?: string }> {
  const check = await requireAdmin()
  if (!check.ok) return { error: check.error }

  if (!STATUTS.includes(statut as (typeof STATUTS)[number])) {
    return { error: "Statut invalide." }
  }

  // Garde-fou 5 : un admin ne peut pas modifier son propre statut.
  if (profileId === check.userId) {
    return { error: "Vous ne pouvez pas modifier votre propre statut." }
  }

  if (statut !== "actif" && (await estDernierAdminActif(check.supabase, profileId))) {
    return {
      error: "Impossible : cela laisserait la fédération sans administrateur actif.",
    }
  }

  const { error } = await check.supabase
    .from("profiles")
    .update({ statut: statut as (typeof STATUTS)[number] })
    .eq("id", profileId)
  if (error) return { error: "La modification du statut a échoué." }

  // Verrouille aussi l'accès au niveau de l'authentification (pas seulement
  // le flag applicatif) quand la clé secrète est disponible.
  const adminClient = createAdminClient()
  if (adminClient) {
    await adminClient.auth.admin.updateUserById(profileId, {
      ban_duration: statut === "actif" ? "none" : "876000h",
    })
  }

  revalidatePath("/administration")
  return {}
}

export async function deleteAccount(profileId: string): Promise<{ error?: string }> {
  const check = await requireAdmin()
  if (!check.ok) return { error: check.error }

  // Garde-fou 5 : un admin ne peut pas se supprimer lui-même depuis cet
  // écran — si vous voulez vraiment partir, faites-le supprimer par un
  // autre administrateur.
  if (profileId === check.userId) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." }
  }

  if (await estDernierAdminActif(check.supabase, profileId)) {
    return {
      error: "Impossible : cela laisserait la fédération sans administrateur actif.",
    }
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return { error: CLE_ABSENTE }
  }

  const { error } = await adminClient.auth.admin.deleteUser(profileId)
  if (error) return { error: `La suppression a échoué : ${error.message}.` }

  revalidatePath("/administration")
  return {}
}
