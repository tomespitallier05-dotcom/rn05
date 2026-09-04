// Couleurs des catégories d'événements, limitées à la palette du design
// system (jamais de couleur en dur) — accent est explicitement réservé aux
// alertes/urgences (< 5% d'usage) donc exclu ici.
export const CATEGORIES = ["reunion", "evenement", "deplacement", "permanence"] as const
export type Categorie = (typeof CATEGORIES)[number]

export const CATEGORIE_LABEL: Record<Categorie, string> = {
  reunion: "Réunion",
  evenement: "Événement",
  deplacement: "Déplacement",
  permanence: "Permanence",
}

// Référence CSS (var(--token)) utilisée pour la barre de couleur 3px et le
// fond à 8% d'opacité des blocs événement (1.5). Un événement peut la
// remplacer par sa propre couleur (events.couleur).
export const CATEGORIE_COLOR: Record<Categorie, string> = {
  reunion: "var(--bleu-primaire)",
  evenement: "var(--succes)",
  deplacement: "var(--alerte)",
  permanence: "var(--bleu-nuit)",
}

export function categorieLabel(categorie: string) {
  return CATEGORIE_LABEL[categorie as Categorie] ?? categorie
}

export function eventColor(event: { categorie: string; couleur: string | null }) {
  return event.couleur || CATEGORIE_COLOR[event.categorie as Categorie] || "var(--bleu-primaire)"
}
