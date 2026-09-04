"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AgendaToolbar } from "./toolbar"
import { MonthView } from "./month-view"
import { MobileListView } from "./mobile-list-view"
import { WeekView } from "./week-view"
import { DayView } from "./day-view"
import { EventPanel } from "./event-panel"
import { CATEGORIES } from "@/lib/agenda-categories"
import { dateKey } from "@/lib/agenda-dates"
import type { Tables } from "@/lib/supabase/database.types"

type EventRow = Tables<"events">
type Vue = "mois" | "semaine" | "jour"

export function AgendaView({
  vue,
  date,
  events,
  categoriesSelectionnees,
  peutCreer,
  currentUserId,
  currentUserRole,
}: {
  vue: Vue
  date: string
  events: EventRow[]
  categoriesSelectionnees: string[]
  peutCreer: boolean
  currentUserId: string
  currentUserRole: string
}) {
  const router = useRouter()
  const dateObj = useMemo(() => new Date(date), [date])

  const [panel, setPanel] = useState<{
    open: boolean
    event: EventRow | null
    defaultDate: Date | null
  }>({ open: false, event: null, defaultDate: null })

  // Après revalidatePath (édition/suppression), le serveur renvoie une
  // liste `events` fraîche mais l'état local du panneau ne se met pas à
  // jour tout seul : sans cet effet, le panneau ouvert continue d'afficher
  // la version de l'événement capturée au moment du clic initial.
  useEffect(() => {
    if (panel.event) {
      const frais = events.find((e) => e.id === panel.event!.id)
      if (frais && frais !== panel.event) {
        setPanel((p) => ({ ...p, event: frais }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>()
    for (const event of events) {
      const cle = dateKey(new Date(event.debut))
      if (!map.has(cle)) map.set(cle, [])
      map.get(cle)!.push(event)
    }
    return map
  }, [events])

  function navigate(next: { vue: Vue; date: Date; categories: string[] }) {
    const params = new URLSearchParams()
    params.set("vue", next.vue)
    params.set("date", dateKey(next.date))
    if (next.categories.length < CATEGORIES.length) {
      params.set("categories", next.categories.join(","))
    }
    router.push(`/agenda?${params.toString()}`)
  }

  function peutModifierEvent(event: EventRow) {
    if (currentUserRole === "admin" || currentUserRole === "bureau") return true
    if (currentUserRole === "responsable") return event.created_by === currentUserId
    return false
  }

  return (
    <div className="flex flex-1 flex-col">
      <AgendaToolbar
        vue={vue}
        date={dateObj}
        categoriesSelectionnees={categoriesSelectionnees}
        peutCreer={peutCreer}
        onChange={navigate}
        onCreate={() => setPanel({ open: true, event: null, defaultDate: dateObj })}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {vue === "mois" && (
          <>
            <MonthView
              date={dateObj}
              eventsByDay={eventsByDay}
              onSelectEvent={(event) => setPanel({ open: true, event, defaultDate: null })}
              onSelectDay={(jour) => navigate({ vue: "jour", date: jour, categories: categoriesSelectionnees })}
            />
            <MobileListView
              eventsByDay={eventsByDay}
              onSelectEvent={(event) => setPanel({ open: true, event, defaultDate: null })}
            />
          </>
        )}
        {vue === "semaine" && (
          <WeekView
            date={dateObj}
            eventsByDay={eventsByDay}
            onSelectEvent={(event) => setPanel({ open: true, event, defaultDate: null })}
            onSelectSlot={(slot) => {
              if (peutCreer) setPanel({ open: true, event: null, defaultDate: slot })
            }}
          />
        )}
        {vue === "jour" && (
          <DayView
            date={dateObj}
            eventsByDay={eventsByDay}
            onSelectEvent={(event) => setPanel({ open: true, event, defaultDate: null })}
            onSelectSlot={(slot) => {
              if (peutCreer) setPanel({ open: true, event: null, defaultDate: slot })
            }}
          />
        )}
      </div>

      <EventPanel
        open={panel.open}
        onOpenChange={(open) => setPanel((p) => ({ ...p, open }))}
        event={panel.event}
        defaultDate={panel.defaultDate}
        peutModifier={panel.event ? peutModifierEvent(panel.event) : peutCreer}
      />
    </div>
  )
}
