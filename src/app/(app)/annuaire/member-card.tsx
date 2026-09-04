"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ROLE_LABEL, type Role } from "@/lib/roles"

export type Membre = {
  id: string
  prenom: string | null
  nom: string | null
  commune: string | null
  fonction_rn: string | null
  role: string
  photoUrl: string | null
}

function initiales(prenom?: string | null, nom?: string | null) {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?"
}

// Carte homogène : photo → nom → fonction → commune (1.6). Jamais de
// coordonnées ici : elles n'apparaissent que dans la fiche détaillée, et
// uniquement pour les rôles autorisés (filtré côté RLS).
export function MemberCard({ membre, onClick }: { membre: Membre; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className="flex h-full flex-col items-center gap-2 p-4 text-center transition-shadow hover:shadow-[var(--shadow-hover)]">
        <Avatar size="lg" className="size-16">
          <AvatarImage src={membre.photoUrl ?? undefined} alt="" />
          <AvatarFallback className="text-base">
            {initiales(membre.prenom, membre.nom)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-texte">
            {membre.prenom} {membre.nom}
          </p>
          {membre.fonction_rn && (
            <p className="text-sm text-texte-2">{membre.fonction_rn}</p>
          )}
          {membre.commune && (
            <p className="text-sm text-texte-2">{membre.commune}</p>
          )}
        </div>
        <Badge variant="secondary">{ROLE_LABEL[membre.role as Role] ?? membre.role}</Badge>
      </Card>
    </button>
  )
}
