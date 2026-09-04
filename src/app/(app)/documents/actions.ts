"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ROLES } from "@/lib/roles"

const MAX_SIZE = 25 * 1024 * 1024 // 25 Mo

export async function createFolder(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const nom = formData.get("nom")
  const parentId = formData.get("parent_id")

  if (typeof nom !== "string" || nom.trim().length === 0) {
    return { error: "Le nom du dossier est obligatoire." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Session expirée." }

  const { error } = await supabase.from("document_folders").insert({
    nom: nom.trim(),
    parent_id: typeof parentId === "string" && parentId ? parentId : null,
    created_by: user.id,
  })

  if (error) return { error: "La création du dossier a échoué." }

  revalidatePath("/documents")
  return {}
}

const uploadSchema = z.object({
  description: z.string().trim().optional(),
  dossier_id: z.string().optional(),
  role_minimum: z.enum(ROLES),
})

export async function uploadDocument(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Aucun fichier sélectionné." }
  }
  if (file.size > MAX_SIZE) {
    return { error: "Le fichier dépasse la taille maximale de 25 Mo." }
  }

  const parsed = uploadSchema.safeParse({
    description: formData.get("description") || undefined,
    dossier_id: formData.get("dossier_id") || undefined,
    role_minimum: formData.get("role_minimum") || "membre",
  })
  if (!parsed.success) {
    return { error: "Champs invalides." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Session expirée." }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : undefined
  const path = `${crypto.randomUUID()}${extension ? `.${extension}` : ""}`

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || "application/octet-stream" })

  if (uploadError) {
    return { error: "L'envoi du fichier a échoué (droits insuffisants ou erreur serveur)." }
  }

  const { error: insertError } = await supabase.from("documents").insert({
    nom: file.name,
    description: parsed.data.description ?? null,
    storage_path: path,
    mime: file.type || "application/octet-stream",
    taille: file.size,
    dossier_id: parsed.data.dossier_id ?? null,
    role_minimum: parsed.data.role_minimum,
    uploaded_by: user.id,
  })

  if (insertError) {
    // Nettoie le fichier orphelin si l'insertion en base échoue.
    await supabase.storage.from("documents").remove([path])
    return { error: "L'enregistrement du document a échoué." }
  }

  revalidatePath("/documents")
  return {}
}

export async function deleteDocument(documentId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", documentId)

  if (error) return { error: "La suppression a échoué." }

  revalidatePath("/documents")
  return {}
}

// URL signée à durée limitée (60 secondes, 1.7) : jamais d'URL publique
// stable pour un fichier privé.
export async function getDownloadUrl(documentId: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()

  const { data: document } = await supabase
    .from("documents")
    .select("storage_path, nom")
    .eq("id", documentId)
    .single()

  if (!document) {
    return { error: "Document introuvable ou accès non autorisé." }
  }

  const { data: signed, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.storage_path, 60, { download: document.nom })

  if (error || !signed) {
    return { error: "La génération du lien de téléchargement a échoué." }
  }

  return { url: signed.signedUrl }
}
