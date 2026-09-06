"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CheckIcon } from "lucide-react"
import { cn } from "cn"
import { Skeleton } from "@/components/ui/skeleton"
import {
  REPONSES,
  REPONSE_LABEL,
  REPONSE_COLOR,
  formatCompteurs,
  type Compteurs,
  type Reponse,
} from "@/lib/participation"
import { repondreEvenement, getParticipationEtat } from "./participation-actions"

function compteurKey(r: Reponse): "present_count" | "peut_etre_count" | "absent_count" {
  return `${r}_count` as const
}

export function ParticipationSection({
  eventId,
  dateLimiteReponse,
}: {
  eventId: string
  dateLimiteReponse: string | null
}) {
  const [chargement, setChargement] = useState(true)
  const [maReponse, setMaReponse] = useState<Reponse | null>(null)
  const [compteurs, setCompteurs] = useState<Compteurs | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState<Reponse | null>(null)

  useEffect(() => {
    let annule = false
    setChargement(true)
    getParticipationEtat(eventId).then((etat) => {
      if (annule) return
      setMaReponse(etat.maReponse)
      setCompteurs(etat.compteurs)
      setErreur(etat.error ?? null)
      setChargement(false)
    })
    return () => {
      annule = true
    }
  }, [eventId])

  const closes = dateLimiteReponse ? new Date(dateLimiteReponse) < new Date() : false

  async function choisir(reponse: Reponse) {
    if (closes || envoi) return
    const precedente = maReponse
    const compteursPrecedents = compteurs

    // Mise à jour optimiste : on affiche tout de suite le nouveau choix et
    // on ajuste les compteurs localement, avec retour arrière si l'action
    // serveur échoue (date limite dépassée entre-temps, erreur réseau...).
    setEnvoi(reponse)
    setMaReponse(reponse)
    setErreur(null)
    if (compteurs) {
      const next = { ...compteurs }
      if (precedente) {
        next[compteurKey(precedente)] -= 1
      } else {
        next.sans_reponse_count = Math.max(0, next.sans_reponse_count - 1)
      }
      next[compteurKey(reponse)] += 1
      setCompteurs(next)
    }

    const result = await repondreEvenement(eventId, reponse)
    setEnvoi(null)

    if (result.error) {
      setMaReponse(precedente)
      setCompteurs(compteursPrecedents)
      setErreur(result.error)
    }
  }

  if (chargement) {
    return (
      <div className="grid gap-2 border-t border-bordure pt-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="grid gap-2 border-t border-bordure pt-4">
      <p className="text-sm font-medium text-texte">Serez-vous présent ?</p>

      <div className="grid grid-cols-3 gap-2">
        {REPONSES.map((r) => {
          const active = maReponse === r
          return (
            <button
              key={r}
              type="button"
              disabled={closes || envoi !== null}
              onClick={() => choisir(r)}
              aria-pressed={active}
              className={cn(
                "flex h-10 max-sm:min-h-11 items-center justify-center gap-1.5 rounded-md border px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                active ? "border-transparent text-texte" : "border-bordure text-texte-2 hover:bg-fond"
              )}
              style={
                active
                  ? {
                      backgroundColor: `color-mix(in oklch, ${REPONSE_COLOR[r]} 12%, transparent)`,
                      borderColor: REPONSE_COLOR[r],
                    }
                  : undefined
              }
            >
              {active && <CheckIcon className="size-4 shrink-0" style={{ color: REPONSE_COLOR[r] }} />}
              {REPONSE_LABEL[r]}
            </button>
          )
        })}
      </div>

      {maReponse && (
        <p className="text-xs text-texte-2">
          Votre réponse : <span className="font-medium text-texte">{REPONSE_LABEL[maReponse]}</span>
        </p>
      )}

      {compteurs && <p className="text-sm text-texte-2">{formatCompteurs(compteurs)}</p>}

      {closes && dateLimiteReponse && (
        <p className="text-sm text-alerte">
          Les réponses sont closes depuis le{" "}
          {format(new Date(dateLimiteReponse), "d MMMM", { locale: fr })}.
        </p>
      )}

      {erreur && <p className="text-sm text-erreur">{erreur}</p>}
    </div>
  )
}
