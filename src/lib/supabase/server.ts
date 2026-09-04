import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

// Client Supabase pour Server Components / Server Actions / Route Handlers.
// Utilise la clé anon : les droits réels viennent des policies RLS, pas de
// ce client. Ne jamais utiliser pour les actions d'administration (voir
// admin.ts pour la clé secrète, strictement server-only).
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll appelé depuis un Server Component : ignoré, le
            // middleware se charge du rafraîchissement de session.
          }
        },
      },
    }
  )
}
