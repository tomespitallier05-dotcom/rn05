"use server"

import { z } from "zod"
import { headers } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { hacherCode } from "@/lib/signup-code"

export type CreerCompteState = {
  errors?: {
    code?: string
    email?: string
    motDePasse?: string
    consentement?: string
    general?: string
  }
  success?: boolean
}

const CLE_ABSENTE =
  "Création de compte momentanément indisponible. Contactez un administrateur."

// Message volontairement identique que l'adresse existe déjà ou non (échec
// de auth.admin.createUser pour n'importe quelle raison) : un message
// distinct ("email déjà utilisé") transformerait le formulaire en outil
// pour tester qui est déjà adhérent.
const ECHEC_GENERIQUE =
  "La création du compte a échoué. Vérifiez vos informations ou contactez un administrateur."

const schema = z.object({
  code: z.string().trim().min(1, "Code d'adhérent requis."),
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  motDePasse: z.string().min(12, "12 caractères minimum."),
})

// IP calculée côté serveur (jamais fournie par le client) : voir
// src/lib/rate-limit.ts, même logique appliquée ici au quota de création
// de compte plutôt qu'aux actions de connexion.
async function getClientIp() {
  const h = await headers()
  const forwardedFor = h.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim()
  return h.get("x-real-ip") ?? "inconnu"
}

export async function creerCompte(
  _prevState: CreerCompteState | null,
  formData: FormData
): Promise<CreerCompteState> {
  // Le client à clé secrète sert ici à deux choses distinctes : appeler les
  // fonctions reserver_code / liberer_code / quota_creation_depasse /
  // journaliser_tentative (aucun droit anon ni authenticated, seule la clé
  // secrète peut les exécuter) et appeler auth.admin.createUser (aucun
  // équivalent RLS). Sans elle, la création de compte reste désactivée
  // plutôt que de planter.
  const adminClient = createAdminClient()
  if (!adminClient) {
    return { errors: { general: CLE_ABSENTE } }
  }

  const ip = await getClientIp()

  // 1. Quota par IP : un code court se casse par force brute sans cette
  // limite, indépendamment de la validité des autres champs.
  const { data: depasse, error: quotaError } = await adminClient.rpc(
    "quota_creation_depasse",
    { p_ip: ip }
  )
  if (quotaError || depasse) {
    return {
      errors: { general: "Trop de tentatives. Réessayez dans 15 minutes." },
    }
  }

  // 2. Validation des champs.
  const parsed = schema.safeParse({
    code: formData.get("code"),
    email: formData.get("email"),
    motDePasse: formData.get("motDePasse"),
  })
  const consentement = formData.get("consentement") === "on"

  if (!parsed.success || !consentement) {
    const errors: CreerCompteState["errors"] = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const champ = issue.path[0]
        if (champ === "code" || champ === "email" || champ === "motDePasse") {
          errors[champ] = issue.message
        }
      }
    }
    if (!consentement) {
      errors.consentement = "Le consentement au traitement des données est requis."
    }
    await adminClient.rpc("journaliser_tentative", { p_ip: ip, p_succes: false })
    return { errors }
  }

  const { code, email, motDePasse } = parsed.data
  const codeHash = hacherCode(code)

  // 3. Réservation atomique du code (verrou SQL : voir reserver_code dans
  // la migration). Même message que le code soit inconnu, expiré, révoqué
  // ou déjà épuisé — l'appelant ne doit distinguer aucun de ces cas.
  const { data: reservation, error: reservationError } = await adminClient
    .rpc("reserver_code", { p_code_hash: codeHash })
    .maybeSingle()

  if (reservationError || !reservation) {
    await adminClient.rpc("journaliser_tentative", { p_ip: ip, p_succes: false })
    return { errors: { code: "Code invalide, expiré ou déjà utilisé." } }
  }

  // 4. Création du compte via l'API Auth Admin (jamais signUp()).
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
  })

  if (createError || !created.user) {
    await adminClient.rpc("liberer_code", { p_id: reservation.id })
    await adminClient.rpc("journaliser_tentative", { p_ip: ip, p_succes: false })
    return { errors: { general: ECHEC_GENERIQUE } }
  }

  // 5. Rôle et statut imposés par le code : l'inscrit ne choisit rien.
  await adminClient
    .from("profiles")
    .update({ role: reservation.role_attribue, statut: reservation.statut_initial })
    .eq("id", created.user.id)

  // 6. Audit.
  await adminClient.from("audit_log").insert({
    user_id: created.user.id,
    action: "SIGNUP_CODE",
    table_cible: "profiles",
    id_cible: created.user.id,
    ip,
  })

  await adminClient.rpc("journaliser_tentative", { p_ip: ip, p_succes: true })

  return { success: true }
}
