"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function definirPreferencesAppel(
  preferences: { nePasDeranger: boolean; appelsDesactives: boolean }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Session expirée." }

  const { error } = await supabase
    .from("profiles")
    .update({
      ne_pas_deranger: preferences.nePasDeranger,
      appels_desactives: preferences.appelsDesactives,
    })
    .eq("id", user.id)

  if (error) return { error: "L'enregistrement des préférences a échoué." }

  revalidatePath("/", "layout")
  return {}
}
