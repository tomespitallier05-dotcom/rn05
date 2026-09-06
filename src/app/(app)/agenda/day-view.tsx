"use client"

import { HourGrid } from "./hour-grid"
import type { Tables } from "@/lib/supabase/database.types"

type EventRow = Tables<"events">

export function DayView({
  date,
  eventsByDay,
  nonRepondu,
  onSelectEvent,
  onSelectSlot,
}: {
  date: Date
  eventsByDay: Map<string, EventRow[]>
  nonRepondu: Set<string>
  onSelectEvent: (event: EventRow) => void
  onSelectSlot: (date: Date) => void
}) {
  return (
    <HourGrid
      jours={[date]}
      eventsByDay={eventsByDay}
      nonRepondu={nonRepondu}
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
    />
  )
}
