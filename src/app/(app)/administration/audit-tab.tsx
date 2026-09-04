"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ScrollTextIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { Tables } from "@/lib/supabase/database.types"

type AuditEntry = Tables<"audit_log">
type Compte = { id: string; prenom: string | null; nom: string | null }

const ACTION_LABEL: Record<string, string> = {
  consultation_fiche: "Consultation de fiche",
}

export function AuditTab({
  auditLog,
  comptes,
}: {
  auditLog: AuditEntry[]
  comptes: Compte[]
}) {
  const [recherche, setRecherche] = useState("")
  const rechercheDebounced = useDebouncedValue(recherche, 250)

  const nomsById = useMemo(
    () => new Map(comptes.map((c) => [c.id, `${c.prenom ?? ""} ${c.nom ?? ""}`.trim() || c.id])),
    [comptes]
  )

  const lignes = useMemo(() => {
    const q = rechercheDebounced.trim().toLowerCase()
    if (!q) return auditLog
    return auditLog.filter((entry) => {
      const acteur = (entry.user_id ? nomsById.get(entry.user_id) : "") ?? ""
      const cible = entry.id_cible ? nomsById.get(entry.id_cible) : ""
      return (
        acteur.toLowerCase().includes(q) ||
        (cible ?? "").toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.table_cible.toLowerCase().includes(q)
      )
    })
  }, [auditLog, rechercheDebounced, nomsById])

  return (
    <div className="grid gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texte-2" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Filtrer par personne, action, table..."
          className="pl-9"
        />
      </div>

      {lignes.length === 0 ? (
        <EmptyState icon={ScrollTextIcon} title="Aucune entrée" description="Rien à afficher pour ce filtre." />
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-bordure">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Acteur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignes.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-texte-2">
                    {format(new Date(entry.created_at), "d MMM yyyy HH'h'mm", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {entry.user_id ? (nomsById.get(entry.user_id) ?? entry.user_id) : "—"}
                  </TableCell>
                  <TableCell>{ACTION_LABEL[entry.action] ?? entry.action}</TableCell>
                  <TableCell className="text-texte-2">
                    {entry.table_cible}
                    {entry.id_cible ? ` · ${nomsById.get(entry.id_cible) ?? entry.id_cible}` : ""}
                  </TableCell>
                  <TableCell className="text-texte-2">{entry.ip ? String(entry.ip) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
