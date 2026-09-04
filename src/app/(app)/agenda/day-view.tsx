"use client"

import { HourGrid } from "./hour-grid"
import type { Tables } from "@/lib/supabase/database.types"

type EventRow = Tables<"events">

export function DayView({
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
      jours={[date]}
      eventsByDay={eventsByDay}
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
    />
  )
}
