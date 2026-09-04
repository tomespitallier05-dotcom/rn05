"use client"

import { isSameMonth, isToday, format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "cn"
import { moisGridDays, dateKey } from "@/lib/agenda-dates"
import { EventBlock } from "./event-block"
import type { Tables } from "@/lib/supabase/database.types"

type EventRow = Tables<"events">

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const MAX_PAR_CELLULE = 3

export function MonthView({
  date,
  eventsByDay,
  onSelectEvent,
  onSelectDay,
}: {
  date: Date
  eventsByDay: Map<string, EventRow[]>
  onSelectEvent: (event: EventRow) => void
  onSelectDay: (day: Date) => void
}) {
  const jours = moisGridDays(date)

  return (
    <div className="hidden flex-col sm:flex">
      <div className="grid grid-cols-7 border-b border-bordure bg-surface">
        {JOURS_SEMAINE.map((jour) => (
          <div
            key={jour}
            className="px-2 py-2 text-center text-xs font-medium text-texte-2"
          >
            {jour}
          </div>
        ))}
      </div>
      {/* Grille 7x6 fixe (42 cellules rigoureusement identiques, min 128px). */}
      <div className="grid grid-cols-7 grid-rows-6">
        {jours.map((jour) => {
          const cle = dateKey(jour)
          const events = eventsByDay.get(cle) ?? []
          const horsMois = !isSameMonth(jour, date)
          const estAujourdhui = isToday(jour)

          return (
            <div
              key={cle}
              className={cn(
                "flex min-h-32 flex-col gap-1 border-b border-r border-bordure p-1.5",
                horsMois ? "bg-fond" : "bg-surface"
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDay(jour)}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center self-start rounded-full text-sm hover:bg-bleu-clair",
                  horsMois && "text-texte-2/60",
                  !horsMois && "text-texte",
                  estAujourdhui && "bg-bleu-primaire text-white hover:bg-bleu-hover"
                )}
              >
                {format(jour, "d", { locale: fr })}
              </button>

              <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                {events.slice(0, MAX_PAR_CELLULE).map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onSelectEvent(event)}
                  />
                ))}
                {events.length > MAX_PAR_CELLULE && (
                  <button
                    type="button"
                    onClick={() => onSelectDay(jour)}
                    className="px-1.5 text-left text-[12px] font-medium text-texte-2 hover:text-texte"
                  >
                    +{events.length - MAX_PAR_CELLULE} autres
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
