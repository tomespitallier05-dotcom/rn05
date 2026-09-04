"use client"

import { useActionState, useRef, useState } from "react"
import { UploadCloudIcon } from "lucide-react"
import { cn } from "cn"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLES, ROLE_LABEL } from "@/lib/roles"
import { uploadDocument } from "./actions"

// Dépôt par glisser-déposer (1.7), avec repli clic-pour-parcourir pour
// l'accessibilité et les navigateurs sans drag-and-drop fonctionnel.
export function UploadDropzone({ dossierId }: { dossierId: string | null }) {
  const [dragActif, setDragActif] = useState(false)
  const [fichier, setFichier] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, formAction, pending] = useActionState(uploadDocument, null)

  return (
    <form
      action={(formData) => {
        formAction(formData)
        setFichier(null)
      }}
      className="grid gap-3"
    >
      <input type="hidden" name="dossier_id" value={dossierId ?? ""} />
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActif(true)
        }}
        onDragLeave={() => setDragActif(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActif(false)
          const dropped = e.dataTransfer.files?.[0]
          if (dropped && inputRef.current) {
            // Un input file ne peut pas être rempli par simple affectation :
            // il faut passer par un DataTransfer pour que la soumission du
            // formulaire (FormData) voie bien le fichier déposé.
            const transfer = new DataTransfer()
            transfer.items.add(dropped)
            inputRef.current.files = transfer.files
            setFichier(dropped)
          }
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed p-6 text-center transition-colors",
          dragActif ? "border-bleu-primaire bg-bleu-clair" : "border-bordure hover:bg-bleu-clair/40"
        )}
      >
        <UploadCloudIcon className="size-8 text-texte-2" />
        <p className="text-sm text-texte">
          Glissez-déposez un fichier ici, ou cliquez pour parcourir.
        </p>
        {fichier && (
          <p className="text-sm font-medium text-bleu-primaire">{fichier.name}</p>
        )}
        <Input
          ref={inputRef}
          type="file"
          name="file"
          className="hidden"
          onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="role_minimum">Rôle minimum requis pour voir ce document</Label>
        <Select name="role_minimum" defaultValue="membre">
          <SelectTrigger id="role_minimum" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Description (facultatif)</Label>
        <Input id="description" name="description" />
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending || !fichier} className="w-full">
        {pending ? "Envoi..." : "Déposer le document"}
      </Button>
    </form>
  )
}
