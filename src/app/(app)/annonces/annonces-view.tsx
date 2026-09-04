"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { PinIcon, PlusIcon, MegaphoneIcon, PencilIcon, TrashIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  ANNOUNCEMENT_CATEGORIE_LABEL,
  ANNOUNCEMENT_BADGE_VARIANT,
  type AnnouncementCategorie,
} from "@/lib/announcement-categories"
import type { Tables } from "@/lib/supabase/database.types"
import { AnnouncementPanel } from "./announcement-panel"
import { deleteAnnouncement } from "./actions"

type Announcement = Tables<"announcements">

export function AnnoncesView({
  announcements,
  peutPublier,
}: {
  announcements: Announcement[]
  peutPublier: boolean
}) {
  const [panel, setPanel] = useState<{ open: boolean; announcement: Announcement | null }>({
    open: false,
    announcement: null,
  })
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null)

  return (
    <div className="container-app flex flex-1 flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] font-bold text-texte">Annonces</h1>
        {peutPublier && (
          <Button
            data-icon="inline-start"
            onClick={() => setPanel({ open: true, announcement: null })}
          >
            <PlusIcon />
            Nouvelle annonce
          </Button>
        )}
      </div>

      {erreurSuppression && (
        <p className="text-sm text-erreur">{erreurSuppression}</p>
      )}

      {announcements.length === 0 ? (
        <EmptyState
          icon={MegaphoneIcon}
          title="Aucune annonce publiée"
          description="Les annonces de la fédération apparaîtront ici."
        />
      ) : (
        <div className="grid gap-4">
          {announcements.map((annonce) => (
            <Card key={annonce.id} className="p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {annonce.epingle && (
                  <PinIcon className="size-4 shrink-0 text-bleu-primaire" aria-label="Épinglée" />
                )}
                <Badge
                  variant={
                    ANNOUNCEMENT_BADGE_VARIANT[annonce.categorie as AnnouncementCategorie] ??
                    "default"
                  }
                >
                  {ANNOUNCEMENT_CATEGORIE_LABEL[annonce.categorie as AnnouncementCategorie] ??
                    annonce.categorie}
                </Badge>
                <span className="text-sm text-texte-2">
                  {format(new Date(annonce.publie_le), "d MMMM yyyy", { locale: fr })}
                </span>
                {peutPublier && (
                  <div className="ml-auto flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Modifier"
                      onClick={() => setPanel({ open: true, announcement: annonce })}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Supprimer"
                      onClick={async () => {
                        if (!confirm("Supprimer cette annonce ?")) return
                        const result = await deleteAnnouncement(annonce.id)
                        if (result.error) setErreurSuppression(result.error)
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                )}
              </div>
              <h2 className="mb-2 text-[20px] font-semibold text-texte">{annonce.titre}</h2>
              <div className="text-sm text-texte [&_a]:text-bleu-primaire [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_p:not(:last-child)]:mb-2 [&_ul]:list-disc">
                <ReactMarkdown>{annonce.corps}</ReactMarkdown>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AnnouncementPanel
        open={panel.open}
        onOpenChange={(open) => setPanel((p) => ({ ...p, open }))}
        announcement={panel.announcement}
      />
    </div>
  )
}
