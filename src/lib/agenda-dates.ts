import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  addDays,
  addMonths,
  addWeeks,
  format,
} from "date-fns"
import { fr } from "date-fns/locale"

// Semaine du lundi (1.5) partout où une semaine est calculée.
const OPTIONS = { locale: fr, weekStartsOn: 1 as const }

export function moisGridDays(date: Date) {
  const debutMois = startOfMonth(date)
  const finMois = endOfMonth(date)
  const debutGrille = startOfWeek(debutMois, OPTIONS)
  const finGrille = endOfWeek(finMois, OPTIONS)
  // Grille 7x6 fixe (42 cellules) : on complète au besoin jusqu'à 6 lignes
  // même quand le mois ne déborde que sur 4 ou 5 semaines de calendrier.
  const jours = eachDayOfInterval({ start: debutGrille, end: finGrille })
  while (jours.length < 42) {
    jours.push(addDays(jours[jours.length - 1]!, 1))
  }
  return jours.slice(0, 42)
}

export function semaineDays(date: Date) {
  const debut = startOfWeek(date, OPTIONS)
  return eachDayOfInterval({ start: debut, end: endOfWeek(date, OPTIONS) })
}

export function plagePourVue(vue: "mois" | "semaine" | "jour", date: Date) {
  if (vue === "mois") {
    const jours = moisGridDays(date)
    return { debut: startOfDay(jours[0]!), fin: endOfDay(jours[jours.length - 1]!) }
  }
  if (vue === "semaine") {
    return { debut: startOfWeek(date, OPTIONS), fin: endOfWeek(date, OPTIONS) }
  }
  return { debut: startOfDay(date), fin: endOfDay(date) }
}

export function suivant(vue: "mois" | "semaine" | "jour", date: Date) {
  if (vue === "mois") return addMonths(date, 1)
  if (vue === "semaine") return addWeeks(date, 1)
  return addDays(date, 1)
}

export function precedent(vue: "mois" | "semaine" | "jour", date: Date) {
  if (vue === "mois") return addMonths(date, -1)
  if (vue === "semaine") return addWeeks(date, -1)
  return addDays(date, -1)
}

export function labelPeriode(vue: "mois" | "semaine" | "jour", date: Date) {
  if (vue === "mois") return format(date, "MMMM yyyy", { locale: fr })
  if (vue === "jour") return format(date, "EEEE d MMMM yyyy", { locale: fr })
  const debut = startOfWeek(date, OPTIONS)
  const fin = endOfWeek(date, OPTIONS)
  const memeMois = debut.getMonth() === fin.getMonth()
  return memeMois
    ? `${format(debut, "d", { locale: fr })} – ${format(fin, "d MMMM yyyy", { locale: fr })}`
    : `${format(debut, "d MMM", { locale: fr })} – ${format(fin, "d MMM yyyy", { locale: fr })}`
}

export function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

export const HEURE_DEBUT_GRILLE = 7
export const HEURE_FIN_GRILLE = 22
