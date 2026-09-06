export const REPONSES = ["present", "peut_etre", "absent"] as const
export type Reponse = (typeof REPONSES)[number]

export const REPONSE_LABEL: Record<Reponse, string> = {
  present: "Présent",
  peut_etre: "Peut-être",
  absent: "Absent",
}

// Couleurs du design system (succès/alerte/erreur) : les mêmes que celles
// demandées pour les états de réponse (présent #15803D, peut-être #B45309,
// absent #B42318 correspondent exactement à --succes/--alerte/--erreur).
export const REPONSE_COLOR: Record<Reponse, string> = {
  present: "var(--succes)",
  peut_etre: "var(--alerte)",
  absent: "var(--erreur)",
}

export const SANS_REPONSE_LABEL = "Sans réponse"
export const SANS_REPONSE_COLOR = "var(--texte-2)"

export type Compteurs = {
  present_count: number
  absent_count: number
  peut_etre_count: number
  sans_reponse_count: number
}

export function formatCompteurs(c: Compteurs) {
  return `${c.present_count} présent${c.present_count > 1 ? "s" : ""} · ${c.peut_etre_count} peut-être · ${c.absent_count} absent${c.absent_count > 1 ? "s" : ""} · ${c.sans_reponse_count} sans réponse`
}
