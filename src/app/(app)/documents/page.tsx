import { createClient } from "@/lib/supabase/server"
import { DocumentsView } from "./documents-view"

export default async function DocumentsPage() {
  const supabase = await createClient()

  const [{ data: folders }, { data: documents }, { data: { user } }] = await Promise.all([
    supabase.from("document_folders").select("*").order("nom", { ascending: true }),
    supabase
      .from("documents")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ])

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single()

  const peutDeposer =
    profile?.role === "admin" || profile?.role === "bureau" || profile?.role === "responsable"
  const peutGerer = profile?.role === "admin" || profile?.role === "bureau"

  return (
    <DocumentsView
      folders={folders ?? []}
      documents={documents ?? []}
      peutDeposer={peutDeposer}
      peutGerer={peutGerer}
    />
  )
}
