// Réunions à plusieurs (lot 2, partie B) : lien externe uniquement, aucun
// développement WebRTC ici (voir agenda-view et event-panel). Le salon
// Jitsi généré doit être long et non devinable : un nom court serait
// accessible à n'importe qui connaissant le motif d'URL.

const ACCENTS_COMBINANTS = /[̀-ͯ]/g

function slugifier(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(ACCENTS_COMBINANTS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

const ALPHABET_SUFFIXE = "abcdefghijklmnopqrstuvwxyz0123456789"

function suffixeAleatoire(longueur: number): string {
  const octets = new Uint8Array(longueur)
  crypto.getRandomValues(octets)
  return Array.from(octets, (o) => ALPHABET_SUFFIXE[o % ALPHABET_SUFFIXE.length]).join("")
}

export function genererSalonJitsi(titreEvenement: string): string {
  const slug = slugifier(titreEvenement) || "evenement"
  return `https://meet.jit.si/rn05-${slug}-${suffixeAleatoire(8)}`
}

export function estUrlHttps(valeur: string): boolean {
  try {
    return new URL(valeur).protocol === "https:"
  } catch {
    return false
  }
}

// Domaine affiché au survol du bouton "Rejoindre la réunion" (validation
// visuelle avant de cliquer) : null si le lien n'est pas une URL valide.
export function hostnameDuLien(valeur: string): string | null {
  try {
    return new URL(valeur).hostname
  } catch {
    return null
  }
}

export function fournisseurDepuisLien(lien: string | null): "jitsi" | "autre" | null {
  if (!lien) return null
  const hostname = hostnameDuLien(lien)
  return hostname === "meet.jit.si" ? "jitsi" : "autre"
}
