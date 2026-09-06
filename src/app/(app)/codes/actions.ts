"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ROLES, STATUTS } from "@/lib/roles"
import { genererCode, hacherCode } from "@/lib/signup-code"

// Vérification applicative en plus de is_admin() côté SQL (admin_creer_code
// / admin_revoquer_code la revérifient elles-mêmes, security definer) :
// même défense en profondeur que administration/actions.ts, pour un
// message d'erreur clair plutôt qu'une exception Postgres brute.
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

  return { ok: true as const, supabase }
}

export type GenererCodeState = {
  error?: string
  code?: string
}

const genererSchema = z.object({
  libelle: z.string().trim().min(1, "Libellé requis.").max(200, "200 caractères maximum."),
  role: z.enum(ROLES),
  statut: z.enum(STATUTS),
  usagesMax: z.coerce.number().int().min(1, "Au moins 1 usage.").max(1000),
  dureeJours: z.coerce.number().int().min(1, "Au moins 1 jour.").max(365),
})

export async function genererCodeAction(
  _prevState: GenererCodeState | null,
  formData: FormData
): Promise<GenererCodeState> {
  const check = await requireAdmin()
  if (!check.ok) return { error: check.error }

  const parsed = genererSchema.safeParse({
    libelle: formData.get("libelle"),
    role: formData.get("role"),
    statut: formData.get("statut"),
    usagesMax: formData.get("usagesMax"),
    dureeJours: formData.get("dureeJours"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." }
  }

  // Le code en clair n'est jamais stocké : seul son empreinte l'est
  // (voir src/lib/signup-code.ts). Il n'est renvoyé qu'une fois, ici.
  const code = genererCode()
  const codeHash = hacherCode(code)
  const expireLe = new Date(
    Date.now() + parsed.data.dureeJours * 24 * 60 * 60 * 1000
  ).toISOString()

  const { error } = await check.supabase.rpc("admin_creer_code", {
    p_libelle: parsed.data.libelle,
    p_code_hash: codeHash,
    p_role_attribue: parsed.data.role,
    p_statut_initial: parsed.data.statut,
    p_usages_max: parsed.data.usagesMax,
    p_expire_le: expireLe,
  })

  if (error) {
    return { error: "La génération du code a échoué." }
  }

  revalidatePath("/codes")
  return { code }
}

export async function revoquerCodeAction(id: string): Promise<{ error?: string }> {
  const check = await requireAdmin()
  if (!check.ok) return { error: check.error }

  const { error } = await check.supabase.rpc("admin_revoquer_code", { p_id: id })
  if (error) return { error: "La révocation a échoué." }

  revalidatePath("/codes")
  return {}
}
