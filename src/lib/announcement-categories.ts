export const ANNOUNCEMENT_CATEGORIES = [
  "organisation",
  "evenement",
  "communication",
  "urgent",
] as const
export type AnnouncementCategorie = (typeof ANNOUNCEMENT_CATEGORIES)[number]

export const ANNOUNCEMENT_CATEGORIE_LABEL: Record<AnnouncementCategorie, string> = {
  organisation: "Organisation",
  evenement: "Événement",
  communication: "Communication",
  urgent: "Urgent",
}

// "urgent" est le cas d'usage légitime de --accent (< 5% des annonces,
// alertes/urgences uniquement) ; les autres catégories restent sur la
// palette neutre du design system.
export const ANNOUNCEMENT_BADGE_VARIANT: Record<
  AnnouncementCategorie,
  "default" | "secondary" | "succes" | "accent"
> = {
  organisation: "default",
  evenement: "succes",
  communication: "secondary",
  urgent: "accent",
}
