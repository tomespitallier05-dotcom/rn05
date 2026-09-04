"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const passwordSchema = z
  .string()
  .min(12, "12 caractères minimum.")

export async function updatePassword(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get("password")
  const confirmation = formData.get("confirmation")

  const parsed = passwordSchema.safeParse(password)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide." }
  }
  if (password !== confirmation) {
    return { error: "Les deux mots de passe ne correspondent pas." }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      error:
        "Session de réinitialisation expirée. Redemandez un email de réinitialisation.",
    }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data })
  if (error) {
    return { error: "La mise à jour du mot de passe a échoué. Réessayez." }
  }

  redirect("/tableau-de-bord")
}
