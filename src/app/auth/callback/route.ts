import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Point d'entrée unique pour tous les liens envoyés par email par Supabase
// Auth (lien magique, invitation, réinitialisation de mot de passe) :
// échange le code contre une session puis redirige vers la page adaptée.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = sanitizeNext(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/connexion?erreur=lien_invalide`)
}

// N'autorise qu'un chemin relatif interne, pour éviter une redirection
// ouverte vers un domaine externe.
function sanitizeNext(next: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next
  }
  return "/tableau-de-bord"
}
