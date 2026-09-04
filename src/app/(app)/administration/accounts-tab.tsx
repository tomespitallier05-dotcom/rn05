"use client"

import { useState, useTransition } from "react"
import { DownloadIcon, PlusIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { UsersIcon } from "lucide-react"
import { formatDateRelative } from "@/lib/format"
import { ROLES, ROLE_LABEL, STATUTS, STATUT_LABEL, type Role, type Statut } from "@/lib/roles"
import { InviteDialog } from "./invite-dialog"
import { updateAccountRole, updateAccountStatut, deleteAccount } from "./actions"

export type Compte = {
  id: string
  prenom: string | null
  nom: string | null
  commune: string | null
  fonction_rn: string | null
  role: string
  statut: string
  created_at: string
  last_seen_at: string | null
  email: string | null
}

const STATUT_BADGE: Record<Statut, "succes" | "alerte" | "erreur"> = {
  actif: "succes",
  suspendu: "alerte",
  archive: "erreur",
}

function exporterCsv(comptes: Compte[]) {
  const entetes = ["Prénom", "Nom", "Commune", "Fonction", "Email", "Rôle", "Statut"]
  const lignes = comptes.map((c) =>
    [c.prenom, c.nom, c.commune, c.fonction_rn, c.email, ROLE_LABEL[c.role as Role] ?? c.role, STATUT_LABEL[c.statut as Statut] ?? c.statut]
      .map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
      .join(",")
  )
  const csv = [entetes.join(","), ...lignes].join("\r\n")
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `annuaire-rn05-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AccountsTab({
  comptes,
  serviceRoleDisponible,
}: {
  comptes: Compte[]
  serviceRoleDisponible: boolean
}) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-texte-2">{comptes.length} compte(s)</p>
        <div className="flex gap-2">
          <Button variant="outline" data-icon="inline-start" onClick={() => exporterCsv(comptes)}>
            <DownloadIcon />
            Exporter CSV
          </Button>
          <Button data-icon="inline-start" onClick={() => setInviteOpen(true)}>
            <PlusIcon />
            Inviter un compte
          </Button>
        </div>
      </div>

      {!serviceRoleDisponible && (
        <p className="rounded-md border border-alerte/30 bg-alerte/10 px-3 py-2 text-sm text-alerte">
          Clé service_role non configurée : l&apos;email n&apos;est pas affiché, et
          l&apos;invitation/suppression de comptes est indisponible tant qu&apos;elle
          n&apos;est pas ajoutée à .env.local.
        </p>
      )}

      {erreur && <p className="text-sm text-erreur">{erreur}</p>}

      {comptes.length === 0 ? (
        <EmptyState icon={UsersIcon} title="Aucun compte" />
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-bordure">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Commune</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {comptes.map((compte) => (
                <TableRow key={compte.id}>
                  <TableCell>
                    {compte.prenom || compte.nom
                      ? `${compte.prenom ?? ""} ${compte.nom ?? ""}`.trim()
                      : "(onboarding non terminé)"}
                  </TableCell>
                  <TableCell className="text-texte-2">{compte.email ?? "—"}</TableCell>
                  <TableCell className="text-texte-2">{compte.commune ?? "—"}</TableCell>
                  <TableCell>
                    <Select
                      value={compte.role}
                      disabled={pending}
                      onValueChange={(role) => {
                        setErreur(null)
                        startTransition(async () => {
                          const result = await updateAccountRole(compte.id, role)
                          if (result.error) setErreur(result.error)
                        })
                      }}
                    >
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={compte.statut}
                      disabled={pending}
                      onValueChange={(statut) => {
                        setErreur(null)
                        startTransition(async () => {
                          const result = await updateAccountStatut(compte.id, statut)
                          if (result.error) setErreur(result.error)
                        })
                      }}
                    >
                      <SelectTrigger size="sm" className="w-32">
                        <Badge variant={STATUT_BADGE[compte.statut as Statut] ?? "secondary"}>
                          {STATUT_LABEL[compte.statut as Statut] ?? compte.statut}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUTS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUT_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-texte-2">
                    {formatDateRelative(compte.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Supprimer le compte (RGPD)"
                      disabled={pending}
                      onClick={() => {
                        if (
                          !confirm(
                            "Supprimer définitivement ce compte et toutes ses données (demande RGPD) ? Cette action est irréversible."
                          )
                        )
                          return
                        setErreur(null)
                        startTransition(async () => {
                          const result = await deleteAccount(compte.id)
                          if (result.error) setErreur(result.error)
                        })
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
