"use client"

import { format, isToday } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "cn"
import { EventBlock } from "./event-block"
import type { Tables } from "@/lib/supabase/database.types"

type EventRow = Tables<"events">

// 1.5 : sur mobile, la vue Mois bascule en liste chronologique groupée par
// jour (la grille 7x6 est illisible sous 768px).
export function MobileListView({
  eventsByDay,
  onSelectEvent,
}: {
  eventsByDay: Map<string, EventRow[]>
  onSelectEvent: (event: EventRow) => void
}) {
  const jours = Array.from(eventsByDay.entries())
    .filter(([, events]) => events.length > 0)
    .sort(([a], [b]) => a.localeCompare(b))

  if (jours.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 sm:hidden">
        <p className="text-sm text-texte-2">Aucun événement ce mois-ci.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:hidden">
      {jours.map(([cle, events]) => {
        const jour = new Date(`${cle}T00:00:00`)
        return (
          <div key={cle}>
            <p
              className={cn(
                "mb-1.5 text-sm font-semibold capitalize",
                isToday(jour) ? "text-bleu-primaire" : "text-texte"
              )}
            >
              {format(jour, "EEEE d MMMM", { locale: fr })}
            </p>
            <div className="grid gap-1.5">
              {events.map((event) => (
                <EventBlock key={event.id} event={event} onClick={() => onSelectEvent(event)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
