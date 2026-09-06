import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StatistiquesView } from "./statistiques-view"

export default async function StatistiquesPage() {
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

  // Réservé à l'encadrement (4, en-tête) : le middleware ne vérifie que la
  // session, pas le rôle applicatif. Les fonctions RPC revérifient aussi
  // elles-mêmes can_manage_content() côté SQL (défense en profondeur).
  if (viewerProfile?.role !== "admin" && viewerProfile?.role !== "bureau") {
    redirect("/tableau-de-bord")
  }

  const [{ data: taux }, { data: repartition }, { data: parCategorie }] = await Promise.all([
    supabase.rpc("stats_taux_participation_evenements"),
    supabase.rpc("stats_repartition_prochain_evenement"),
    supabase.rpc("stats_evenements_par_categorie"),
  ])

  return (
    <StatistiquesView
      taux={taux ?? []}
      repartition={repartition?.[0] ?? null}
      parCategorie={parCategorie ?? []}
    />
  )
}
