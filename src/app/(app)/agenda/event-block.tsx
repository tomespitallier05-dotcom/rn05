"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "cn"
import { eventColor } from "@/lib/agenda-categories"
import type { Tables } from "@/lib/supabase/database.types"

type EventRow = Tables<"events">

// Bloc événement (1.5) : barre de couleur 3px à gauche, fond à 8% d'opacité,
// heure 12px puis titre 13px tronqué sur une ligne.
export function EventBlock({
  event,
  onClick,
  className,
  style,
  compact = false,
}: {
  event: EventRow
  onClick: () => void
  className?: string
  style?: React.CSSProperties
  compact?: boolean
}) {
  const couleur = eventColor(event)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "block w-full overflow-hidden rounded-sm border-l-[3px] px-1.5 py-1 text-left transition-opacity hover:opacity-80",
        className
      )}
      style={{
        borderLeftColor: couleur,
        backgroundColor: `color-mix(in oklch, ${couleur} 8%, transparent)`,
        ...style,
      }}
    >
      {!compact && (
        <span className="block text-[12px] text-texte-2">
          {format(new Date(event.debut), "HH'h'mm", { locale: fr })}
        </span>
      )}
      <span className="block truncate text-[13px] font-medium text-texte">
        {event.titre}
      </span>
    </button>
  )
}
