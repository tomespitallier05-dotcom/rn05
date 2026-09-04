import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "./database.types"

// Routes accessibles sans session. Tout le reste est protégé (critère
// d'acceptation : une route protégée ouverte sans session redirige vers
// /connexion).
const PUBLIC_PATHS = [
  "/",
  "/connexion",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/mentions-legales",
  "/politique-de-confidentialite",
  "/compte-suspendu",
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/auth/")
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() (pas getSession()) revalide le token auprès de Supabase à
  // chaque requête : nécessaire pour que le middleware fasse foi.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/connexion"
    redirectUrl.search = ""
    redirectUrl.searchParams.set("redirect", pathname + search)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && (pathname === "/connexion" || pathname === "/")) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/tableau-de-bord"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  // Onboarding bloquant (1.3) : tant que le profil n'est pas complet, tout
  // écran hors onboarding redirige vers celui-ci ; une fois complet,
  // /onboarding redirige vers le tableau de bord.
  if (user && !isPublicPath(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete, statut")
      .eq("id", user.id)
      .single()

    // Un compte suspendu ou archivé ne doit plus accéder à l'application,
    // même avec une session valide (1.8 : suspendre/archiver un compte).
    if (profile && profile.statut !== "actif") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/compte-suspendu"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }

    const onboardingComplete = profile?.onboarding_complete ?? false

    if (!onboardingComplete && pathname !== "/onboarding") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/onboarding"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }

    if (onboardingComplete && pathname === "/onboarding") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/tableau-de-bord"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
