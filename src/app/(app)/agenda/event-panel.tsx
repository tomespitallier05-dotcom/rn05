"use client"

import { useActionState, useEffect, useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPinIcon, TagIcon, VideoIcon, ExternalLinkIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { CATEGORIES, CATEGORIE_LABEL, eventColor } from "@/lib/agenda-categories"
import { genererSalonJitsi, hostnameDuLien } from "@/lib/visio"
import type { Tables } from "@/lib/supabase/database.types"
import { createEvent, updateEvent, deleteEvent } from "./actions"
import { ParticipationSection } from "./participation-section"
import { ResponsesTab } from "./responses-tab"

type EventRow = Tables<"events">

function toLocalInputValue(iso: string) {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function EventForm({
  event,
  defaultDate,
  onSaved,
}: {
  event: EventRow | null
  defaultDate: Date | null
  onSaved: () => void
}) {
  const action = event ? updateEvent.bind(null, event.id) : createEvent
  const [state, formAction, pending] = useActionState(
    async (prevState: { error?: string } | null, formData: FormData) => {
      const result = await action(prevState, formData)
      if (!result.error) onSaved()
      return result
    },
    null
  )

  const debutDefault = event
    ? toLocalInputValue(event.debut)
    : defaultDate
      ? toLocalInputValue(defaultDate.toISOString())
      : ""
  const finDefault = event
    ? toLocalInputValue(event.fin)
    : defaultDate
      ? toLocalInputValue(new Date(defaultDate.getTime() + 60 * 60 * 1000).toISOString())
      : ""
  const [reponseAttendue, setReponseAttendue] = useState(event?.reponse_attendue ?? false)
  const [titre, setTitre] = useState(event?.titre ?? "")
  const [lienVisio, setLienVisio] = useState(event?.lien_visio ?? "")
  const domaineLienVisio = lienVisio ? hostnameDuLien(lienVisio) : null

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              name="titre"
              required
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="debut">Début *</Label>
              <Input
                id="debut"
                name="debut"
                type="datetime-local"
                required
                defaultValue={debutDefault}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fin">Fin *</Label>
              <Input
                id="fin"
                name="fin"
                type="datetime-local"
                required
                defaultValue={finDefault}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="categorie">Catégorie *</Label>
            <Select name="categorie" defaultValue={event?.categorie ?? "reunion"}>
              <SelectTrigger id="categorie" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORIE_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="visibilite">Visibilité *</Label>
            <Select name="visibilite" defaultValue={event?.visibilite ?? "tous"}>
              <SelectTrigger id="visibilite" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les membres</SelectItem>
                <SelectItem value="bureau">Bureau uniquement</SelectItem>
                <SelectItem value="role">Encadrement (bureau + responsables)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="reponseAttendue"
                name="reponseAttendue"
                checked={reponseAttendue}
                onCheckedChange={(v) => setReponseAttendue(v === true)}
              />
              <Label htmlFor="reponseAttendue" className="font-normal">
                Réponse de présence attendue
              </Label>
            </div>
            {reponseAttendue && (
              <div className="grid gap-1.5">
                <Label htmlFor="dateLimiteReponse">Date limite de réponse (optionnel)</Label>
                <Input
                  id="dateLimiteReponse"
                  name="dateLimiteReponse"
                  type="datetime-local"
                  defaultValue={
                    event?.date_limite_reponse ? toLocalInputValue(event.date_limite_reponse) : ""
                  }
                />
              </div>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lieu">Lieu</Label>
            <Input id="lieu" name="lieu" defaultValue={event?.lieu ?? ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lienVisio">Lien de visioconférence</Label>
            <div className="flex gap-2">
              <Input
                id="lienVisio"
                name="lienVisio"
                type="url"
                placeholder="https://..."
                value={lienVisio}
                onChange={(e) => setLienVisio(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                data-icon="inline-start"
                onClick={() => setLienVisio(genererSalonJitsi(titre))}
              >
                <VideoIcon />
                Générer un salon Jitsi
              </Button>
            </div>
            {domaineLienVisio && (
              <p className="text-xs text-texte-2">
                Ouvre : <span className="font-medium">{domaineLienVisio}</span>
              </p>
            )}
            <p className="text-xs text-texte-2">
              Réunion à plusieurs via un service externe (ouvre un nouvel onglet) — pas
              d&apos;appel vidéo intégré à l&apos;application.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={event?.description ?? ""} />
          </div>
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      <SheetFooter className="border-t border-bordure">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : event ? "Enregistrer" : "Créer l'événement"}
        </Button>
      </SheetFooter>
    </form>
  )
}

function EventDetails({
  event,
  peutModifier,
  peutVoirReponses,
  onEdit,
  onDeleted,
}: {
  event: EventRow
  peutModifier: boolean
  peutVoirReponses: boolean
  onEdit: () => void
  onDeleted: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const couleur = eventColor(event)

  // Le bouton "Rejoindre" n'apparaît que dans la fenêtre utile (15 min
  // avant le début jusqu'à la fin) : recalculé chaque minute pour qu'il
  // apparaisse sans que l'utilisateur ait à rafraîchir la page.
  const [maintenant, setMaintenant] = useState<Date | null>(null)
  useEffect(() => {
    setMaintenant(new Date())
    const id = setInterval(() => setMaintenant(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const domaineVisio = event.lien_visio ? hostnameDuLien(event.lien_visio) : null
  const visioVisible =
    event.lien_visio &&
    maintenant &&
    maintenant.getTime() >= new Date(event.debut).getTime() - 15 * 60 * 1000 &&
    maintenant.getTime() <= new Date(event.fin).getTime()

  const details = (
    <div className="grid gap-4">
      <div
        className="rounded-md border-l-[3px] px-3 py-2"
        style={{
          borderLeftColor: couleur,
          backgroundColor: `color-mix(in oklch, ${couleur} 8%, transparent)`,
        }}
      >
        <p className="flex items-center gap-1.5 text-sm text-texte-2">
          <TagIcon className="size-3.5" />
          {CATEGORIE_LABEL[event.categorie as keyof typeof CATEGORIE_LABEL] ?? event.categorie}
        </p>
      </div>

      <div>
        <p className="text-sm text-texte-2">
          {format(new Date(event.debut), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
        <p className="text-sm text-texte-2">
          {format(new Date(event.debut), "HH'h'mm", { locale: fr })} –{" "}
          {format(new Date(event.fin), "HH'h'mm", { locale: fr })}
        </p>
      </div>

      {event.lieu && (
        <p className="flex items-center gap-1.5 text-sm text-texte">
          <MapPinIcon className="size-4 text-texte-2" />
          {event.lieu}
        </p>
      )}

      {visioVisible && event.lien_visio && (
        <div className="grid gap-1">
          <Button asChild variant="outline" data-icon="inline-start" className="w-fit">
            <a
              href={event.lien_visio}
              target="_blank"
              rel="noopener noreferrer"
              title={domaineVisio ?? undefined}
            >
              <ExternalLinkIcon />
              Rejoindre la réunion
            </a>
          </Button>
          <p className="text-xs text-texte-2">
            Ouvre {domaineVisio ?? "un service externe"} dans un nouvel onglet — pas de
            visioconférence intégrée à l&apos;application.
          </p>
        </div>
      )}

      {event.description && (
        <p className="whitespace-pre-wrap text-sm text-texte">{event.description}</p>
      )}

      {event.reponse_attendue && (
        <ParticipationSection eventId={event.id} dateLimiteReponse={event.date_limite_reponse} />
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {peutVoirReponses && event.reponse_attendue ? (
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">
                Détails
              </TabsTrigger>
              <TabsTrigger value="reponses" className="flex-1">
                Liste des réponses
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4">
              {details}
            </TabsContent>
            <TabsContent value="reponses">
              <ResponsesTab eventId={event.id} titreEvenement={event.titre} />
            </TabsContent>
          </Tabs>
        ) : (
          details
        )}
      </div>
      {peutModifier && (
        <SheetFooter className="flex-row border-t border-bordure">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={pending}
            onClick={async () => {
              if (!confirm("Supprimer cet événement ?")) return
              setPending(true)
              const result = await deleteEvent(event.id)
              setPending(false)
              if (result.error) setError(result.error)
              else onDeleted()
            }}
          >
            Supprimer
          </Button>
          <Button type="button" className="flex-1" onClick={onEdit}>
            Modifier
          </Button>
        </SheetFooter>
      )}
    </div>
  )
}

export function EventPanel({
  open,
  onOpenChange,
  event,
  defaultDate,
  peutModifier,
  peutVoirReponses,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: EventRow | null
  defaultDate: Date | null
  peutModifier: boolean
  peutVoirReponses: boolean
}) {
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<"view" | "edit">(event ? "view" : "edit")

  // `open`/`event` changent sur la même instance montée (le panneau n'est
  // jamais démonté entre deux sélections) : sans cet effet, le mode initial
  // ("edit" pour la toute première ouverture, avant tout événement) reste
  // figé pour toujours, même en cliquant ensuite sur un événement existant.
  useEffect(() => {
    if (open) setMode(event ? "view" : "edit")
  }, [open, event])

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setMode(event ? "view" : "edit")
      }}
    >
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile ? "max-h-[85vh]" : ""}
      >
        <SheetHeader>
          <SheetTitle>
            {mode === "edit"
              ? event
                ? "Modifier l'événement"
                : "Nouvel événement"
              : event?.titre}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Détail de l&apos;événement d&apos;agenda
          </SheetDescription>
        </SheetHeader>

        {mode === "edit" ? (
          <EventForm
            event={event}
            defaultDate={defaultDate}
            onSaved={() => {
              if (event) setMode("view")
              else onOpenChange(false)
            }}
          />
        ) : event ? (
          <EventDetails
            event={event}
            peutModifier={peutModifier}
            peutVoirReponses={peutVoirReponses}
            onEdit={() => setMode("edit")}
            onDeleted={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
