import { format, isToday, isTomorrow } from "date-fns"
import { fr } from "date-fns/locale"

// "Aujourd'hui 14h30", "Demain 9h00" ou "12 mars 14h30" : formats courts
// réutilisés partout où un événement est listé (tableau de bord, agenda).
export function formatDateCourt(iso: string) {
  const date = new Date(iso)
  const heure = format(date, "HH'h'mm", { locale: fr })

  if (isToday(date)) return `Aujourd'hui ${heure}`
  if (isTomorrow(date)) return `Demain ${heure}`
  return `${format(date, "d MMMM", { locale: fr })} ${heure}`
}

export function formatDateLongue(iso: string) {
  return format(new Date(iso), "EEEE d MMMM yyyy", { locale: fr })
}

export function formatDateRelative(iso: string) {
  return format(new Date(iso), "d MMMM yyyy", { locale: fr })
}
