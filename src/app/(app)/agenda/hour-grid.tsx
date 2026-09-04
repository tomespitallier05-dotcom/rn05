"use client"

import { useEffect, useState } from "react"
import { format, isSameDay, isToday, setHours, setMinutes } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "cn"
import { HEURE_DEBUT_GRILLE, HEURE_FIN_GRILLE, dateKey } from "@/lib/agenda-dates"
import { positionnerChevauchements } from "@/lib/agenda-layout"
import { eventColor } from "@/lib/agenda-categories"
import type { Tables } from "@/lib/supabase/database.types"

type EventRow = Tables<"events">

const PX_PAR_HEURE = 80
const HEURES = Array.from(
  { length: HEURE_FIN_GRILLE - HEURE_DEBUT_GRILLE },
  (_, i) => HEURE_DEBUT_GRILLE + i
)
const HAUTEUR_GRILLE = HEURES.length * PX_PAR_HEURE

function minutesDepuisDebutGrille(iso: string, jour: Date) {
  const d = new Date(iso)
  const debutGrille = setMinutes(setHours(jour, HEURE_DEBUT_GRILLE), 0)
  return (d.getTime() - debutGrille.getTime()) / 60000
}

// Grille horaire partagée entre les vues semaine (7 colonnes) et jour (1
// colonne) : colonne d'heures 64px fixe, 07h→22h, ligne d'heure courante,
// chevauchements côte à côte (1.5).
export function HourGrid({
  jours,
  eventsByDay,
  onSelectEvent,
  onSelectSlot,
}: {
  jours: Date[]
  eventsByDay: Map<string, EventRow[]>
  onSelectEvent: (event: EventRow) => void
  onSelectSlot: (date: Date) => void
}) {
  const [maintenant, setMaintenant] = useState<Date | null>(null)

  useEffect(() => {
    setMaintenant(new Date())
    const id = setInterval(() => setMaintenant(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const offsetMaintenant =
    maintenant && maintenant.getHours() >= HEURE_DEBUT_GRILLE && maintenant.getHours() < HEURE_FIN_GRILLE
      ? (maintenant.getHours() - HEURE_DEBUT_GRILLE) * PX_PAR_HEURE + (maintenant.getMinutes() / 60) * PX_PAR_HEURE
      : null

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* En-têtes des jours, alignées sur les colonnes de la grille */}
      <div className="flex border-b border-bordure bg-surface">
        <div className="w-16 shrink-0" />
        {jours.map((jour) => (
          <div
            key={dateKey(jour)}
            className="flex-1 border-l border-bordure px-2 py-2 text-center"
          >
            <p className="text-xs text-texte-2">{format(jour, "EEE", { locale: fr })}</p>
            <p
              className={cn(
                "mx-auto flex size-6 items-center justify-center rounded-full text-sm",
                isToday(jour) ? "bg-bleu-primaire text-white" : "text-texte"
              )}
            >
              {format(jour, "d")}
            </p>
          </div>
        ))}
      </div>

      <div className="flex">
        <div className="w-16 shrink-0">
          {HEURES.map((heure) => (
            <div
              key={heure}
              style={{ height: PX_PAR_HEURE }}
              className="border-r border-bordure pr-2 text-right text-xs text-texte-2"
            >
              {String(heure).padStart(2, "0")}h00
            </div>
          ))}
        </div>

        {jours.map((jour) => {
          const cle = dateKey(jour)
          const events = eventsByDay.get(cle) ?? []
          const positions = positionnerChevauchements(events)

          return (
            <div
              key={cle}
              className="relative flex-1 border-l border-bordure"
              style={{ height: HAUTEUR_GRILLE }}
            >
              {HEURES.map((heure, i) => (
                <button
                  key={heure}
                  type="button"
                  onClick={() => onSelectSlot(setMinutes(setHours(jour, heure), 0))}
                  style={{ top: i * PX_PAR_HEURE, height: PX_PAR_HEURE }}
                  className="absolute inset-x-0 border-b border-bordure/60 hover:bg-bleu-clair/40"
                />
              ))}

              {offsetMaintenant !== null && maintenant && isSameDay(jour, maintenant) && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-erreur"
                  style={{ top: offsetMaintenant }}
                />
              )}

              {positions.map(({ event, colonne, colonnes }) => {
                const top = Math.max(0, minutesDepuisDebutGrille(event.debut, jour)) * (PX_PAR_HEURE / 60)
                const finMinutes = Math.min(
                  HEURES.length * 60,
                  minutesDepuisDebutGrille(event.fin, jour)
                )
                const hauteur = Math.max(20, (finMinutes - minutesDepuisDebutGrille(event.debut, jour)) * (PX_PAR_HEURE / 60))
                const largeur = 100 / colonnes
                const couleur = eventColor(event)

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectEvent(event)
                    }}
                    className="absolute overflow-hidden rounded-sm border-l-[3px] px-1.5 py-0.5 text-left hover:opacity-80"
                    style={{
                      top,
                      height: hauteur,
                      left: `${colonne * largeur}%`,
                      width: `calc(${largeur}% - 2px)`,
                      borderLeftColor: couleur,
                      backgroundColor: `color-mix(in oklch, ${couleur} 8%, transparent)`,
                    }}
                  >
                    <span className="block text-[12px] text-texte-2">
                      {format(new Date(event.debut), "HH'h'mm", { locale: fr })}
                    </span>
                    <span className="block truncate text-[13px] font-medium text-texte">
                      {event.titre}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
