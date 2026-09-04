import Link from "next/link"

// Contenu à rédiger par la fédération avant mise en production : finalités
// du traitement, base légale, durée de conservation, droits RGPD, contact
// DPO le cas échéant. Le texte définitif n'est pas fourni par le cahier des
// charges et conditionne la case de consentement de l'onboarding (1.3).
export default function PolitiqueDeConfidentialitePage() {
  return (
    <div className="container-app flex flex-1 flex-col gap-4 py-12">
      <Link href="/" className="text-sm text-bleu-primaire hover:underline">
        ← Retour
      </Link>
      <h1 className="text-[32px] font-bold text-texte">
        Politique de confidentialité
      </h1>
      <p className="text-sm text-texte-2">
        Contenu à compléter par la fédération : finalités du traitement,
        base légale, durée de conservation des données, droits d&apos;accès,
        de rectification et de suppression, contact pour l&apos;exercice de
        ces droits.
      </p>
    </div>
  )
}
