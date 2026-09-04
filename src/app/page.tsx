import Link from "next/link"
import { Button } from "@/components/ui/button"

// 1.1 — Page publique : unique route non authentifiée. Aucune donnée
// d'adhérent, aucun nom, aucune photo (critère d'acceptation lot 1).
export default function AccueilPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-bordure bg-bleu-nuit">
        <div className="container-app flex h-16 items-center justify-between">
          <span className="text-[16px] font-semibold text-white">
            Fédération RN des Hautes-Alpes
          </span>
          <Button asChild variant="secondary">
            <Link href="/connexion">Connexion</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center bg-fond">
        <div className="container-app flex flex-col items-center gap-6 py-24 text-center">
          <h1 className="max-w-2xl text-[40px] font-bold leading-tight text-texte">
            Plateforme interne de la fédération
          </h1>
          <p className="max-w-xl text-[18px] text-texte-2">
            Outil réservé aux adhérents invités : annuaire, agenda partagé,
            annonces et documents de la fédération des Hautes-Alpes.
          </p>
          <Button asChild size="lg">
            <Link href="/connexion">Accéder à la plateforme</Link>
          </Button>
        </div>
      </main>

      <footer className="border-t border-bordure bg-surface">
        <div className="container-app flex flex-col items-center justify-between gap-4 py-8 text-sm text-texte-2 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Fédération RN des Hautes-Alpes
          </p>
          <nav className="flex items-center gap-6">
            <Link href="/mentions-legales" className="hover:text-texte hover:underline">
              Mentions légales
            </Link>
            <Link
              href="/politique-de-confidentialite"
              className="hover:text-texte hover:underline"
            >
              Politique de confidentialité
            </Link>
            <a
              href="mailto:contact@rn05.example"
              className="hover:text-texte hover:underline"
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
