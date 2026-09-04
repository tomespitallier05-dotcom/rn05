"use client"

import { useActionState, useMemo, useState } from "react"
import {
  FileTextIcon,
  SearchIcon,
  PlusIcon,
  FolderPlusIcon,
  DownloadIcon,
  TrashIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { formatDateRelative, formatTailleFichier } from "@/lib/format"
import { ROLE_LABEL, type Role } from "@/lib/roles"
import type { Tables } from "@/lib/supabase/database.types"
import { FolderTree } from "./folder-tree"
import { UploadDropzone } from "./upload-dropzone"
import { createFolder, deleteDocument, getDownloadUrl } from "./actions"

type Folder = Tables<"document_folders">
type Document = Tables<"documents">

function NewFolderDialog({
  open,
  onOpenChange,
  parentId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentId: string | null
}) {
  const [state, formAction, pending] = useActionState(
    async (prevState: { error?: string } | null, formData: FormData) => {
      const result = await createFolder(prevState, formData)
      if (!result.error) onOpenChange(false)
      return result
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau dossier</DialogTitle>
          <DialogDescription>
            Créé {parentId ? "à l'intérieur du dossier sélectionné" : "à la racine"}.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="parent_id" value={parentId ?? ""} />
          <div className="grid gap-1.5">
            <Label htmlFor="nom">Nom du dossier</Label>
            <Input id="nom" name="nom" required autoFocus />
          </div>
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Création..." : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UploadDialog({
  open,
  onOpenChange,
  dossierId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dossierId: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Déposer un document</DialogTitle>
          <DialogDescription>
            {dossierId ? "Dans le dossier sélectionné." : "À la racine."}
          </DialogDescription>
        </DialogHeader>
        <UploadDropzone dossierId={dossierId} />
      </DialogContent>
    </Dialog>
  )
}

export function DocumentsView({
  folders,
  documents,
  peutDeposer,
  peutGerer,
}: {
  folders: Folder[]
  documents: Document[]
  peutDeposer: boolean
  peutGerer: boolean
}) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [recherche, setRecherche] = useState("")
  const rechercheDebounced = useDebouncedValue(recherche, 250)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const documentsAffiches = useMemo(() => {
    const q = rechercheDebounced.trim().toLowerCase()
    return documents.filter((d) => {
      if (q) return d.nom.toLowerCase().includes(q)
      return d.dossier_id === selectedFolder
    })
  }, [documents, rechercheDebounced, selectedFolder])

  async function telecharger(documentId: string) {
    const result = await getDownloadUrl(documentId)
    if (result.error) {
      setErreur(result.error)
      return
    }
    if (result.url) {
      window.location.href = result.url
    }
  }

  return (
    <div className="container-app flex flex-1 flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] font-bold text-texte">Documents</h1>
        {peutDeposer && (
          <div className="flex gap-2">
            <Button variant="outline" data-icon="inline-start" onClick={() => setNewFolderOpen(true)}>
              <FolderPlusIcon />
              Nouveau dossier
            </Button>
            <Button data-icon="inline-start" onClick={() => setUploadOpen(true)}>
              <PlusIcon />
              Déposer
            </Button>
          </div>
        )}
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texte-2" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un document..."
          className="pl-9"
        />
      </div>

      {erreur && <p className="text-sm text-erreur">{erreur}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <Card className="h-fit p-3">
          <FolderTree folders={folders} selectedId={selectedFolder} onSelect={setSelectedFolder} />
        </Card>

        {documentsAffiches.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title="Aucun document"
            description={
              recherche
                ? "Aucun résultat pour cette recherche."
                : "Ce dossier ne contient pas encore de document."
            }
          />
        ) : (
          <div className="grid gap-3">
            {documentsAffiches.map((document) => (
              <Card key={document.id} className="flex items-center gap-3 p-4">
                <FileTextIcon className="size-8 shrink-0 text-bleu-primaire" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-texte">{document.nom}</p>
                  <p className="text-sm text-texte-2">
                    {formatDateRelative(document.created_at)} ·{" "}
                    {formatTailleFichier(document.taille)}
                  </p>
                  {document.description && (
                    <p className="mt-1 text-sm text-texte-2">{document.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {ROLE_LABEL[document.role_minimum as Role] ?? document.role_minimum}
                </Badge>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Télécharger"
                  onClick={() => telecharger(document.id)}
                >
                  <DownloadIcon />
                </Button>
                {peutGerer && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Supprimer"
                    onClick={async () => {
                      if (!confirm("Supprimer ce document ?")) return
                      const result = await deleteDocument(document.id)
                      if (result.error) setErreur(result.error)
                    }}
                  >
                    <TrashIcon />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {peutDeposer && (
        <>
          <UploadDialog
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            dossierId={selectedFolder}
          />
          <NewFolderDialog
            open={newFolderOpen}
            onOpenChange={setNewFolderOpen}
            parentId={selectedFolder}
          />
        </>
      )}
    </div>
  )
}
