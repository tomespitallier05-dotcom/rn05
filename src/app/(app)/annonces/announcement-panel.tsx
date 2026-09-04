"use client"

import { useActionState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-is-mobile"
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_CATEGORIE_LABEL,
} from "@/lib/announcement-categories"
import type { Tables } from "@/lib/supabase/database.types"
import { createAnnouncement, updateAnnouncement } from "./actions"

type Announcement = Tables<"announcements">

export function AnnouncementPanel({
  open,
  onOpenChange,
  announcement,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement: Announcement | null
}) {
  const isMobile = useIsMobile()
  const action = announcement ? updateAnnouncement.bind(null, announcement.id) : createAnnouncement
  const [state, formAction, pending] = useActionState(
    async (prevState: { error?: string } | null, formData: FormData) => {
      const result = await action(prevState, formData)
      if (!result.error) onOpenChange(false)
      return result
    },
    null
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "max-h-[85vh]" : ""}>
        <SheetHeader>
          <SheetTitle>{announcement ? "Modifier l'annonce" : "Nouvelle annonce"}</SheetTitle>
          <SheetDescription className="sr-only">Formulaire d&apos;annonce</SheetDescription>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="titre">Titre *</Label>
                <Input id="titre" name="titre" required defaultValue={announcement?.titre} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="categorie">Catégorie *</Label>
                <Select name="categorie" defaultValue={announcement?.categorie ?? "organisation"}>
                  <SelectTrigger id="categorie" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNOUNCEMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {ANNOUNCEMENT_CATEGORIE_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="corps">Contenu * (markdown pris en charge)</Label>
                <Textarea
                  id="corps"
                  name="corps"
                  required
                  rows={8}
                  defaultValue={announcement?.corps}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="epingle"
                  name="epingle"
                  defaultChecked={announcement?.epingle ?? false}
                />
                <Label htmlFor="epingle" className="font-normal">
                  Épingler cette annonce
                </Label>
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
              {pending ? "Enregistrement..." : announcement ? "Enregistrer" : "Publier"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
