import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { AdministrationView } from "./administration-view"

export default async function AdministrationPage() {
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

  // Réservé aux administrateurs (1.8, matrice de permissions) : le
  // middleware ne vérifie que la session, pas le rôle applicatif.
  if (viewerProfile?.role !== "admin") {
    redirect("/tableau-de-bord")
  }

  const [{ data: profiles }, { data: auditLog }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, prenom, nom, commune, fonction_rn, role, statut, created_at, last_seen_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  // L'email n'existe que dans auth.users (schéma protégé, hors RLS) :
  // seule l'API Admin peut le lire, donc uniquement si service_role est
  // configurée. Sans elle, l'écran reste utilisable (rôles/statuts/audit),
  // simplement sans colonne email.
  const adminClient = createAdminClient()
  let emailById = new Map<string, string>()
  let serviceRoleDisponible = false
  if (adminClient) {
    serviceRoleDisponible = true
    const { data } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    emailById = new Map((data?.users ?? []).map((u) => [u.id, u.email ?? ""]))
  }

  const comptes = (profiles ?? []).map((p) => ({
    ...p,
    email: emailById.get(p.id) ?? null,
  }))

  return (
    <AdministrationView
      comptes={comptes}
      auditLog={auditLog ?? []}
      serviceRoleDisponible={serviceRoleDisponible}
    />
  )
}
