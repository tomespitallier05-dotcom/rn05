import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SocialCard } from "@/components/SocialCard"
import { Reveal } from "@/components/Reveal"
import {
  IllustrationAgenda,
  IllustrationAnnuaire,
  IllustrationAnnonces,
  IllustrationDocuments,
  IllustrationAppels,
} from "@/components/illustrations/Illustrations"

// 1.1 — Page publique : unique route non authentifiée. Aucune donnée
// d'adhérent, aucun nom, aucune photo (critère d'acceptation lot 1).
// Les illustrations sont schématiques et ne montrent aucune vraie donnée.

const FONCTIONNALITES = [
  {
    titre: "Un agenda partagé",
    texte:
      "Réunions, permanences, déplacements et événements réunis au même endroit, en vue mensuelle ou hebdomadaire. Vous indiquez si vous serez présent en un clic, et les organisateurs savent sur qui compter.",
    illustration: <IllustrationAgenda />,
  },
  {
    titre: "L'annuaire de la fédération",
    texte:
      "Qui fait quoi, dans quelle commune, avec quelle responsabilité. La recherche est instantanée et les coordonnées ne sont visibles que des personnes habilitées.",
    illustration: <IllustrationAnnuaire />,
  },
  {
    titre: "Les annonces internes",
    texte:
      "Les informations d'organisation ne se perdent plus dans les conversations. Chaque annonce est classée, datée, et les plus importantes restent épinglées en tête.",
    illustration: <IllustrationAnnonces />,
  },
  {
    titre: "Les documents utiles",
    texte:
      "Comptes rendus, supports, modèles : tout est classé par dossier et accessible selon votre rôle. Fini les pièces jointes qu'on cherche dans d'anciens messages.",
    illustration: <IllustrationDocuments />,
  },
  {
    titre: "Les échanges directs",
    texte:
      "Un appel audio ou vidéo depuis la fiche d'un membre, sans installer quoi que ce soit. Pour les réunions à plusieurs, un lien de visioconférence est joint à l'événement.",
    illustration: <IllustrationAppels />,
  },
]

const ETAPES = [
  {
    titre: "Recevez votre code",
    texte:
      "La fédération remet un code d'adhérent aux membres à jour de cotisation, en réunion ou par message.",
  },
  {
    titre: "Créez votre compte",
    texte:
      "Le code, votre adresse email et un mot de passe suffisent. Aucune inscription n'est possible sans code.",
  },
  {
    titre: "Complétez votre profil",
    texte:
      "Commune, fonction et coordonnées : quelques informations pour que les autres membres sachent qui vous êtes.",
  },
]

const FAQ = [
  {
    question: "Comment obtenir un code d'adhérent ?",
    reponse:
      "Les codes sont distribués par la fédération aux adhérents à jour de cotisation. Contactez le secrétariat départemental si vous n'avez pas encore reçu le vôtre.",
  },
  {
    question: "Mon code ne fonctionne pas, que faire ?",
    reponse:
      "Un code a une durée de validité et un nombre d'utilisations limités. S'il est expiré ou déjà utilisé, demandez-en un nouveau à la fédération : un code ne peut pas être réactivé.",
  },
  {
    question: "Qui peut voir mes coordonnées ?",
    reponse:
      "Votre nom, votre commune et votre fonction sont visibles par les autres adhérents. Votre téléphone et votre email ne sont accessibles qu'aux membres du bureau et aux responsables, et chaque consultation est enregistrée.",
  },
  {
    question: "Que deviennent mes données ?",
    reponse:
      "Elles sont hébergées dans l'Union européenne, chiffrées, et utilisées uniquement pour le fonctionnement interne de la fédération. Elles ne sont transmises à aucun tiers. Le détail figure dans la politique de confidentialité.",
  },
  {
    question: "Puis-je supprimer mon compte ?",
    reponse:
      "Oui, à tout moment et sans justification. Vos données personnelles sont alors effacées définitivement. Il suffit d'en faire la demande à un administrateur.",
  },
  {
    question: "J'ai oublié mon mot de passe",
    reponse:
      "Utilisez le lien de réinitialisation sur la page de connexion. Un message vous sera envoyé à l'adresse associée à votre compte.",
  },
]

export default function AccueilPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ---------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-bordure bg-surface/90 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <span className="text-[15px] font-semibold text-bleu-nuit">
            Fédération RN des Hautes-Alpes
          </span>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/creer-un-compte">Créer un compte</Link>
            </Button>
            <Button asChild>
              <Link href="/connexion">Connexion</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* ------------------------- Bandeau ------------------------ */}
        <section className="border-b border-bordure bg-fond">
          <div className="container-app flex flex-col items-center gap-6 py-24 text-center md:py-32">
            <Reveal>
              <span className="inline-flex items-center rounded-full border border-bordure bg-surface px-3 py-1 text-[13px] font-medium text-texte-2">
                Espace réservé aux adhérents
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="max-w-3xl text-[36px] font-bold leading-tight text-texte md:text-[48px]">
                Tout ce que fait la fédération, au même endroit
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="max-w-xl text-[18px] leading-relaxed text-texte-2">
                Agenda partagé, annuaire des membres, annonces et documents.
                Un outil interne pensé pour que personne ne rate une réunion
                ni ne cherche une information pendant vingt minutes.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/creer-un-compte">
                    J&apos;ai un code, créer mon compte
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/connexion">Se connecter</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* --------------------- Fonctionnalités -------------------- */}
        <section className="border-b border-bordure bg-surface">
          <div className="container-app py-20 md:py-24">
            <Reveal>
              <h2 className="max-w-2xl text-[28px] font-bold leading-tight text-texte md:text-[32px]">
                Ce que vous trouverez à l&apos;intérieur
              </h2>
            </Reveal>

            <div className="mt-16 flex flex-col gap-20 md:gap-24">
              {FONCTIONNALITES.map((f, i) => (
                <Reveal key={f.titre}>
                  <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
                    <div className={i % 2 === 1 ? "md:order-2" : undefined}>
                      <h3 className="text-[22px] font-semibold text-texte">
                        {f.titre}
                      </h3>
                      <p className="mt-3 max-w-md text-[16px] leading-relaxed text-texte-2">
                        {f.texte}
                      </p>
                    </div>
                    <div
                      className={`rounded-[10px] border border-bordure bg-fond p-4 ${
                        i % 2 === 1 ? "md:order-1" : ""
                      }`}
                    >
                      {f.illustration}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------- Mot du bureau --------------------- */}
        {/* TODO — remplacer par le texte réel et le nom de son auteur.
            Ne pas publier ce texte tel quel. */}
        <section className="border-b border-bordure bg-bleu-nuit">
          <div className="container-app py-20 md:py-24">
            <Reveal>
              <figure className="mx-auto max-w-3xl text-center">
                <blockquote className="text-[22px] font-medium leading-relaxed text-white md:text-[26px]">
                  « Une fédération, c&apos;est d&apos;abord des gens qui doivent
                  pouvoir se joindre, savoir où et quand se retrouver, et
                  retrouver un document sans le demander à trois personnes.
                  Cet outil ne sert qu&apos;à ça. »
                </blockquote>
                <figcaption className="mt-8 text-[15px] text-white/60">
                  <span className="block font-semibold text-white">
                    [Prénom Nom]
                  </span>
                  Secrétaire départemental
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        {/* ------------------- Comment y accéder -------------------- */}
        <section className="border-b border-bordure bg-surface">
          <div className="container-app py-20 md:py-24">
            <Reveal>
              <h2 className="text-[28px] font-bold leading-tight text-texte md:text-[32px]">
                Comment obtenir votre accès
              </h2>
              <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-texte-2">
                L&apos;inscription libre est fermée. Chaque compte est créé à
                partir d&apos;un code remis par la fédération.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {ETAPES.map((e, i) => (
                <Reveal key={e.titre} delay={i * 80}>
                  <div className="flex h-full flex-col rounded-[10px] border border-bordure bg-surface p-6 transition-shadow duration-150 hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bleu-clair text-[15px] font-semibold text-bleu-primaire">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 text-[18px] font-semibold text-texte">
                      {e.titre}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-texte-2">
                      {e.texte}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={240}>
              <div className="mt-10">
                <Button asChild size="lg">
                  <Link href="/creer-un-compte">Créer mon compte</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ------------------------- FAQ ---------------------------- */}
        <section className="border-b border-bordure bg-fond">
          <div className="container-app py-20 md:py-24">
            <Reveal>
              <h2 className="text-[28px] font-bold leading-tight text-texte md:text-[32px]">
                Questions fréquentes
              </h2>
            </Reveal>

            <div className="mt-10 max-w-3xl">
              {FAQ.map((item, i) => (
                <Reveal key={item.question} delay={i * 50}>
                  {/* <details> natif : accessible et fonctionnel sans JavaScript */}
                  <details className="group border-b border-bordure py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium text-texte marker:content-none">
                      {item.question}
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 shrink-0 items-center justify-center text-texte-2 transition-transform duration-200 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl pr-10 text-[15px] leading-relaxed text-texte-2">
                      {item.reponse}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------ Pied de page --------------------- */}
      <footer className="border-t border-bordure bg-bleu-nuit">
        <div className="container-app flex flex-col items-center gap-8 py-12">
          <SocialCard />

          <div className="flex w-full flex-col items-center justify-between gap-4 text-sm text-white/70 sm:flex-row">
            <p>© {new Date().getFullYear()} Fédération RN des Hautes-Alpes</p>
            <nav className="flex flex-wrap items-center justify-center gap-6">
              <Link
                href="/mentions-legales"
                className="transition-colors hover:text-white hover:underline"
              >
                Mentions légales
              </Link>
              <Link
                href="/politique-de-confidentialite"
                className="transition-colors hover:text-white hover:underline"
              >
                Politique de confidentialité
              </Link>
              <a
                href="mailto:contact@rn05.example"
                className="transition-colors hover:text-white hover:underline"
              >
                Contact
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
