"use client"

import { useState, useTransition } from "react"
import { KeyRoundIcon, PlusIcon, XIcon } from "lucide-react"
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
import { EmptyState } from "@/components/ui/empty-state"
import { formatDateRelative } from "@/lib/format"
import { ROLE_LABEL, STATUT_LABEL, type Role, type Statut } from "@/lib/roles"
import type { Database } from "@/lib/supabase/database.types"
import { GenerateCodeDialog } from "./generate-code-dialog"
import { revoquerCodeAction } from "./actions"

type Code = Database["public"]["Functions"]["admin_liste_codes"]["Returns"][number]

function estExpire(code: Code) {
  return new Date(code.expire_le).getTime() < Date.now()
}

function statutAffiche(code: Code): { label: string; variant: "succes" | "alerte" | "erreur" } {
  if (!code.actif) return { label: "Révoqué", variant: "erreur" }
  if (estExpire(code)) return { label: "Expiré", variant: "erreur" }
  if (code.usages >= code.usages_max) return { label: "Épuisé", variant: "alerte" }
  return { label: "Actif", variant: "succes" }
}

export function CodesView({ codes }: { codes: Code[] }) {
  const [dialogOuvert, setDialogOuvert] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="container-app flex flex-1 flex-col gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[32px] font-bold text-texte">Codes d&apos;inscription</h1>
        <Button data-icon="inline-start" onClick={() => setDialogOuvert(true)}>
          <PlusIcon />
          Générer un code
        </Button>
      </div>

      {erreur && <p className="text-sm text-erreur">{erreur}</p>}

      {codes.length === 0 ? (
        <EmptyState
          icon={KeyRoundIcon}
          title="Aucun code"
          description="Générez un code pour permettre à un adhérent de créer son compte."
        />
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-bordure">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut initial</TableHead>
                <TableHead>Usages</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>État</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => {
                const etat = statutAffiche(code)
                const revocable = code.actif
                return (
                  <TableRow key={code.id}>
                    <TableCell>{code.libelle}</TableCell>
                    <TableCell className="text-texte-2">
                      {ROLE_LABEL[code.role_attribue as Role] ?? code.role_attribue}
                    </TableCell>
                    <TableCell className="text-texte-2">
                      {STATUT_LABEL[code.statut_initial as Statut] ?? code.statut_initial}
                    </TableCell>
                    <TableCell className="text-texte-2">
                      {code.usages} / {code.usages_max}
                    </TableCell>
                    <TableCell className="text-texte-2">
                      {formatDateRelative(code.expire_le)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={etat.variant}>{etat.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Révoquer le code"
                        disabled={pending || !revocable}
                        title={revocable ? undefined : "Déjà révoqué."}
                        onClick={() => {
                          if (!confirm(`Révoquer le code « ${code.libelle} » ? Il ne pourra plus être utilisé.`)) {
                            return
                          }
                          setErreur(null)
                          startTransition(async () => {
                            const result = await revoquerCodeAction(code.id)
                            if (result.error) setErreur(result.error)
                          })
                        }}
                      >
                        <XIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <GenerateCodeDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
    </div>
  )
}
