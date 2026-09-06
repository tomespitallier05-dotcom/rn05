"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"

const emailSchema = z.string().trim().toLowerCase().email("Adresse email invalide.")

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
