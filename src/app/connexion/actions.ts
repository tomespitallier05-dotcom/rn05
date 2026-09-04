"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"

const emailSchema = z.string().trim().toLowerCase().email("Adresse email invalide.")

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

// N'autorise qu'un chemin relatif interne (protection contre une
// redirection ouverte via le paramètre ?redirect= posé par le middleware).
function sanitizeRedirect(path: FormDataEntryValue | null) {
  if (typeof path === "string" && path.startsWith("/") && !path.startsWith("//")) {
    return path
  }
  return "/tableau-de-bord"
}

export async function signInWithPassword(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"))
  const password = formData.get("password")

  if (!parsedEmail.success || typeof password !== "string" || password.length === 0) {
    return { error: "Adresse email ou mot de passe invalide." }
  }

  const allowed = await checkRateLimit("connexion-mdp")
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans 15 minutes." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsedEmail.data,
    password,
  })

  if (error) {
    return { error: "Email ou mot de passe incorrect." }
  }

  redirect(sanitizeRedirect(formData.get("redirect")))
}

export async function signInWithMagicLink(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"))

  if (!parsedEmail.success) {
    return { error: "Adresse email invalide." }
  }

  const allowed = await checkRateLimit("connexion-lien-magique")
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans 15 minutes." }
  }

  const redirectPath = sanitizeRedirect(formData.get("redirect"))
  const supabase = await createClient()

  // shouldCreateUser: false — pas d'auto-inscription, seule une invitation
  // administrateur crée un compte (critère d'acceptation 1.2).
  await supabase.auth.signInWithOtp({
    email: parsedEmail.data,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
    },
  })

  // Message générique dans tous les cas, y compris en cas d'erreur Supabase
  // (compte inexistant) : ne pas permettre l'énumération d'adresses email.
  return {
    success:
      "Si un compte existe pour cette adresse, un lien de connexion vient d'être envoyé.",
  }
}
