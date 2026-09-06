import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CodesView } from "./codes-view"

export default async function CodesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/connexion")

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Réservé aux administrateurs, comme /administration : le middleware ne
  // vérifie que la session, pas le rôle applicatif.
  if (viewerProfile?.role !== "admin") {
    redirect("/tableau-de-bord")
  }

  const { data: codes } = await supabase.rpc("admin_liste_codes")

  return <CodesView codes={codes ?? []} />
}
