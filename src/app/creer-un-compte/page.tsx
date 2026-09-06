import type { Metadata } from "next"
import { CreerUnCompteForm } from "./creer-un-compte-form"

// Défense en profondeur en plus du robots.ts et du meta global du layout
// racine (1.1) : page publique la plus exposée aux bots, jamais indexée.
export const metadata: Metadata = {
  title: "Créer un compte — RN05",
  robots: { index: false, follow: false },
}

export default function CreerUnComptePage() {
  return (
    <div className="container-app flex flex-1 flex-col items-center justify-center py-12">
      <CreerUnCompteForm />
    </div>
  )
}
