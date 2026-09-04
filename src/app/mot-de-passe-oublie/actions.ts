"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"

const emailSchema = z.string().trim().toLowerCase().email("Adresse email invalide.")

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

export async function requestPasswordReset(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"))

  if (!parsedEmail.success) {
    return { error: "Adresse email invalide." }
  }

  const allowed = await checkRateLimit("mot-de-passe-oublie")
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans 15 minutes." }
  }

  const supabase = await createClient()

  await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent("/reinitialiser-mot-de-passe")}`,
  })

  // Message générique dans tous les cas : ne pas permettre l'énumération
  // d'adresses email selon qu'un compte existe ou non.
  return {
    success:
      "Si un compte existe pour cette adresse, un email de réinitialisation vient d'être envoyé.",
  }
}
