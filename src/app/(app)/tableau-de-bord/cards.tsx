import Link from "next/link"
import { CalendarIcon, MegaphoneIcon, FileTextIcon, UsersIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDateCourt, formatDateRelative } from "@/lib/format"
import { DashboardCard, CardEmptyMessage } from "./dashboard-card"

const CATEGORIE_EVENEMENT_LABEL: Record<string, string> = {
  reunion: "Réunion",
  evenement: "Événement",
  deplacement: "Déplacement",
  permanence: "Permanence",
}

export async function ProchainsEvenements() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from("events")
    .select("id, titre, debut, categorie")
    .is("deleted_at", null)
    .gte("debut", new Date().toISOString())
    .order("debut", { ascending: true })
    .limit(5)

  return (
    <DashboardCard
      icon={CalendarIcon}
      title="Prochains événements"
      href="/agenda"
      hrefLabel="Voir l'agenda"
    >
      {!events || events.length === 0 ? (
        <CardEmptyMessage>Aucun événement à venir.</CardEmptyMessage>
      ) : (
        <ul className="grid gap-2.5">
          {events.map((event) => (
            <li key={event.id} className="text-sm">
              <div className="flex items-center gap-2">
                <span className="text-texte-2">{formatDateCourt(event.debut)}</span>
                <Badge variant="secondary" className="shrink-0">
                  {CATEGORIE_EVENEMENT_LABEL[event.categorie] ?? event.categorie}
                </Badge>
              </div>
              <p className="truncate font-medium text-texte">{event.titre}</p>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}

export async function DernieresAnnonces() {
  const supabase = await createClient()
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, titre, categorie, publie_le")
    .order("publie_le", { ascending: false })
    .limit(3)

  return (
    <DashboardCard
      icon={MegaphoneIcon}
      title="Dernières annonces"
      href="/annonces"
      hrefLabel="Voir toutes les annonces"
    >
      {!announcements || announcements.length === 0 ? (
        <CardEmptyMessage>Aucune annonce publiée.</CardEmptyMessage>
      ) : (
        <ul className="grid gap-2.5">
          {announcements.map((annonce) => (
            <li key={annonce.id} className="text-sm">
              <span className="text-texte-2">
                {formatDateRelative(annonce.publie_le)}
              </span>
              <p className="truncate font-medium text-texte">{annonce.titre}</p>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}

export async function DerniersDocuments() {
  const supabase = await createClient()
  const { data: documents } = await supabase
    .from("documents")
    .select("id, nom, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(3)

  return (
    <DashboardCard
      icon={FileTextIcon}
      title="Derniers documents"
      href="/documents"
      hrefLabel="Voir tous les documents"
    >
      {!documents || documents.length === 0 ? (
        <CardEmptyMessage>Aucun document déposé.</CardEmptyMessage>
      ) : (
        <ul className="grid gap-2.5">
          {documents.map((document) => (
            <li key={document.id} className="text-sm">
              <span className="text-texte-2">
                {formatDateRelative(document.created_at)}
              </span>
              <p className="truncate font-medium text-texte">{document.nom}</p>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}

export async function NouveauxMembres() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, prenom, nom, commune, photo_url")
    .is("deleted_at", null)
    .eq("statut", "actif")
    .eq("onboarding_complete", true)
    .order("created_at", { ascending: false })
    .limit(5)

  const withPhotos = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      if (!profile.photo_url) return { ...profile, photoUrl: null as string | null }
      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.photo_url, 60 * 60)
      return { ...profile, photoUrl: signed?.signedUrl ?? null }
    })
  )

  return (
    <DashboardCard
      icon={UsersIcon}
      title="Nouveaux membres"
      href="/annuaire"
      hrefLabel="Voir l'annuaire"
    >
      {withPhotos.length === 0 ? (
        <CardEmptyMessage>Aucun nouveau membre.</CardEmptyMessage>
      ) : (
        <ul className="grid gap-2.5">
          {withPhotos.map((profile) => (
            <li key={profile.id}>
              <Link
                href="/annuaire"
                className="flex items-center gap-2.5 rounded-md -mx-1.5 px-1.5 py-1 hover:bg-bleu-clair"
              >
                <Avatar size="sm">
                  <AvatarImage src={profile.photoUrl ?? undefined} alt="" />
                  <AvatarFallback>
                    {`${profile.prenom?.[0] ?? ""}${profile.nom?.[0] ?? ""}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">
                  <span className="font-medium text-texte">
                    {profile.prenom} {profile.nom}
                  </span>
                  {profile.commune && (
                    <span className="text-texte-2"> — {profile.commune}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
