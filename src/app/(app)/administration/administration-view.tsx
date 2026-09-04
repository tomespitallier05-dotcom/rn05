"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AccountsTab, type Compte } from "./accounts-tab"
import { AuditTab } from "./audit-tab"
import type { Tables } from "@/lib/supabase/database.types"

export function AdministrationView({
  comptes,
  auditLog,
  serviceRoleDisponible,
}: {
  comptes: Compte[]
  auditLog: Tables<"audit_log">[]
  serviceRoleDisponible: boolean
}) {
  return (
    <div className="container-app flex flex-1 flex-col gap-6 py-8">
      <h1 className="text-[32px] font-bold text-texte">Administration</h1>

      <Tabs defaultValue="comptes">
        <TabsList>
          <TabsTrigger value="comptes">Comptes</TabsTrigger>
          <TabsTrigger value="audit">Journal d&apos;audit</TabsTrigger>
        </TabsList>
        <TabsContent value="comptes" className="mt-4">
          <AccountsTab comptes={comptes} serviceRoleDisponible={serviceRoleDisponible} />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditTab
            auditLog={auditLog}
            comptes={comptes.map((c) => ({ id: c.id, prenom: c.prenom, nom: c.nom }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
