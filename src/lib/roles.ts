export const ROLES = ["admin", "bureau", "responsable", "membre"] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrateur",
  bureau: "Bureau",
  responsable: "Responsable",
  membre: "Membre",
}

export const STATUTS = ["actif", "suspendu", "archive"] as const
export type Statut = (typeof STATUTS)[number]

export const STATUT_LABEL: Record<Statut, string> = {
  actif: "Actif",
  suspendu: "Suspendu",
  archive: "Archivé",
}
