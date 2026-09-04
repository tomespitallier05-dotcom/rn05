import "server-only"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

// IP calculée côté serveur à partir des en-têtes de la plateforme
// (non falsifiable par le client : jamais lue depuis le navigateur ni
// transmise par lui). Vercel place l'IP réelle du client en tête de
// x-forwarded-for.
async function getClientIp() {
  const h = await headers()
  const forwardedFor = h.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim()
  }
  return h.get("x-real-ip") ?? "inconnu"
}

// Limitation à 5 tentatives par IP et par 15 minutes (critère
// d'acceptation lot 1), appliquée à chaque action d'authentification :
// connexion par mot de passe, lien magique, demande de réinitialisation.
export async function checkRateLimit(action: string) {
  const ip = await getClientIp()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("check_and_record_rate_limit", {
    p_identifiant: `${action}:${ip}`,
    p_limite: 5,
    p_fenetre_minutes: 15,
  })

  if (error) {
    // En cas d'échec du contrôle lui-même, on refuse par prudence plutôt
    // que de laisser passer une action d'authentification sans limite.
    return false
  }

  return data === true
}
