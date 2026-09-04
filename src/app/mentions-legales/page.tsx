import Link from "next/link"

// Contenu à rédiger par la fédération (éditeur, hébergeur, directeur de
// publication...) avant mise en production — texte non fourni par le
// cahier des charges.
export default function MentionsLegalesPage() {
  return (
    <div className="container-app flex flex-1 flex-col gap-4 py-12">
      <Link href="/" className="text-sm text-bleu-primaire hover:underline">
        ← Retour
      </Link>
      <h1 className="text-[32px] font-bold text-texte">Mentions légales</h1>
      <p className="text-sm text-texte-2">
        Contenu à compléter par la fédération : éditeur du site, hébergeur,
        directeur de publication, coordonnées de contact.
      </p>
    </div>
  )
}
