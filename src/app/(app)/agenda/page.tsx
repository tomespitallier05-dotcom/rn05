import { createClient } from "@/lib/supabase/server"
import { CATEGORIES, type Categorie } from "@/lib/agenda-categories"
import { plagePourVue } from "@/lib/agenda-dates"
import { AgendaView } from "./agenda-view"

type Vue = "mois" | "semaine" | "jour"

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; date?: string; categories?: string }>
}) {
  const params = await searchParams
  const vue: Vue = params.vue === "semaine" || params.vue === "jour" ? params.vue : "mois"
  const date = params.date ? new Date(`${params.date}T00:00:00`) : new Date()
  const categoriesSelectionnees: Categorie[] = params.categories
    ? params.categories
        .split(",")
        .filter((c): c is Categorie => (CATEGORIES as readonly string[]).includes(c))
    : [...CATEGORIES]

  const { debut, fin } = plagePourVue(vue, date)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single()

  const role = profile?.role ?? "membre"
  const peutCreer = role === "admin" || role === "bureau" || role === "responsable"

  let query = supabase
    .from("events")
    .select("*")
    .is("deleted_at", null)
    .lt("debut", fin.toISOString())
    .gte("fin", debut.toISOString())
    .order("debut", { ascending: true })

  if (categoriesSelectionnees.length < CATEGORIES.length) {
    query = query.in("categorie", categoriesSelectionnees)
  }

  const { data: events } = await query

  return (
    <AgendaView
      vue={vue}
      date={date.toISOString()}
      events={events ?? []}
      categoriesSelectionnees={categoriesSelectionnees}
      peutCreer={peutCreer}
      currentUserId={user!.id}
      currentUserRole={role}
    />
  )
}
