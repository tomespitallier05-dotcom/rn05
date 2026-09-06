"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { UsersIcon } from "lucide-react"
import { REPONSES, REPONSE_LABEL } from "@/lib/participation"
import { getListeReponses, type ReponseListee } from "./participation-actions"

function nomComplet(r: ReponseListee) {
  return `${r.prenom ?? ""} ${r.nom ?? ""}`.trim() || "(onboarding non terminé)"
}

function exporterCsv(titreEvenement: string, reponses: ReponseListee[]) {
  const entetes = ["Prénom", "Nom", "Réponse", "Commentaire", "Répondu le"]
  const lignes = reponses.map((r) =>
    [
      r.prenom,
      r.nom,
      REPONSE_LABEL[r.reponse],
      r.commentaire,
      format(new Date(r.repondu_le), "d MMM yyyy HH'h'mm", { locale: fr }),
    ]
      .map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
      .join(",")
  )
  const csv = [entetes.join(","), ...lignes].join("\r\n")
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `reponses-${titreEvenement.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ResponsesTab({ eventId, titreEvenement }: { eventId: string; titreEvenement: string }) {
  const [chargement, setChargement] = useState(true)
  const [reponses, setReponses] = useState<ReponseListee[]>([])
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let annule = false
    setChargement(true)
    getListeReponses(eventId).then((res) => {
      if (annule) return
      setReponses(res.data)
      setErreur(res.error ?? null)
      setChargement(false)
    })
    return () => {
      annule = true
    }
  }, [eventId])

  if (chargement) {
    return (
      <div className="grid gap-2 px-4 py-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    )
  }

  if (erreur) {
    return <p className="px-4 py-2 text-sm text-erreur">{erreur}</p>
  }

  if (reponses.length === 0) {
    return (
      <div className="px-4 py-2">
        <EmptyState icon={UsersIcon} title="Aucune réponse pour le moment" />
      </div>
    )
  }

  return (
    <div className="grid gap-3 px-4 py-2">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-icon="inline-start"
          onClick={() => exporterCsv(titreEvenement, reponses)}
        >
          <DownloadIcon />
          Exporter CSV
        </Button>
      </div>

      {REPONSES.map((r) => {
        const groupe = reponses.filter((rep) => rep.reponse === r)
        if (groupe.length === 0) return null
        return (
          <div key={r}>
            <p className="mb-1 text-sm font-medium text-texte">
              {REPONSE_LABEL[r]} ({groupe.length})
            </p>
            <ul className="grid gap-0.5">
              {groupe.map((rep, i) => (
                <li key={i} className="text-sm text-texte-2">
                  {nomComplet(rep)}
                  {rep.commentaire && <span className="text-texte-2"> — {rep.commentaire}</span>}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
