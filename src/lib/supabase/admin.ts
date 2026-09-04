import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Client à clé secrète, strictement server-only : bypass RLS, ne doit
// jamais être importé depuis un composant client. Nécessaire uniquement
// pour l'API Auth Admin (inviter/supprimer un compte, lister les emails)
// qui n'a pas d'équivalent RLS. Retourne null tant que la clé n'est pas
// configurée, pour un échec explicite plutôt qu'un crash.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY

  if (!url || !key) return null

  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
