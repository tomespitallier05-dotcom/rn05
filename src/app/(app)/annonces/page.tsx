import { createClient } from "@/lib/supabase/server"
import { AnnoncesView } from "./annonces-view"

export default async function AnnoncesPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("epingle", { ascending: false })
    .order("publie_le", { ascending: false })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single()

  const peutPublier = profile?.role === "admin" || profile?.role === "bureau"

  return <AnnoncesView announcements={announcements ?? []} peutPublier={peutPublier} />
}
