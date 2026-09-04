"use client"

import { FolderIcon, FolderOpenIcon } from "lucide-react"
import { cn } from "cn"
import type { Tables } from "@/lib/supabase/database.types"

type Folder = Tables<"document_folders">

function FolderNode({
  folder,
  depth,
  childrenByParent,
  selectedId,
  onSelect,
}: {
  folder: Folder
  depth: number
  childrenByParent: Map<string | null, Folder[]>
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const enfants = childrenByParent.get(folder.id) ?? []
  const actif = selectedId === folder.id

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(folder.id)}
        style={{ paddingLeft: 8 + depth * 16 }}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-sm hover:bg-bleu-clair",
          actif ? "bg-bleu-clair font-medium text-bleu-nuit" : "text-texte"
        )}
      >
        {actif ? (
          <FolderOpenIcon className="size-4 shrink-0 text-texte-2" />
        ) : (
          <FolderIcon className="size-4 shrink-0 text-texte-2" />
        )}
        <span className="truncate">{folder.nom}</span>
      </button>
      {enfants.length > 0 && (
        <ul>
          {enfants.map((enfant) => (
            <FolderNode
              key={enfant.id}
              folder={enfant}
              depth={depth + 1}
              childrenByParent={childrenByParent}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function FolderTree({
  folders,
  selectedId,
  onSelect,
}: {
  folders: Folder[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const childrenByParent = new Map<string | null, Folder[]>()
  for (const folder of folders) {
    const key = folder.parent_id
    if (!childrenByParent.has(key)) childrenByParent.set(key, [])
    childrenByParent.get(key)!.push(folder)
  }
  const racines = childrenByParent.get(null) ?? []

  return (
    <ul className="grid gap-0.5">
      <li>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-bleu-clair",
            selectedId === null ? "bg-bleu-clair font-medium text-bleu-nuit" : "text-texte"
          )}
        >
          <FolderIcon className="size-4 shrink-0 text-texte-2" />
          Tous les documents
        </button>
      </li>
      {racines.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          depth={0}
          childrenByParent={childrenByParent}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
