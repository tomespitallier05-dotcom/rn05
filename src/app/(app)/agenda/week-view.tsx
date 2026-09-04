"use client"

import { semaineDays } from "@/lib/agenda-dates"
import { HourGrid } from "./hour-grid"
import type { Tables } from "@/lib/supabase/database.types"

type EventRow = Tables<"events">

export function WeekView({
  date,
  eventsByDay,
  onSelectEvent,
  onSelectSlot,
}: {
  date: Date
  eventsByDay: Map<string, EventRow[]>
  onSelectEvent: (event: EventRow) => void
  onSelectSlot: (date: Date) => void
}) {
  return (
    <HourGrid
      jours={semaineDays(date)}
      eventsByDay={eventsByDay}
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
    />
  )
}
