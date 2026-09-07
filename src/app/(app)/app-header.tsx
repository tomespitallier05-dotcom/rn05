"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import PillNav, { type PillNavItem } from "@/components/PillNav"
import { signOut } from "./actions"
import { PreferencesAppelDialog } from "./appels/preferences-dialog"

// Navigation quotidienne : reste dans la barre principale.
const NAV_ITEMS: PillNavItem[] = [
  { href: "/tableau-de-bord", label: "Tableau de bord" },
  { href: "/agenda", label: "Agenda" },
  { href: "/annuaire", label: "Annuaire" },
  { href: "/annonces", label: "Annonces" },
  { href: "/documents", label: "Documents" },
]

// Outils d'encadrement : dans le menu utilisateur, sinon huit entrées
// ne tiennent pas dans la barre en rôle admin.
const ENCADREMENT_NAV_ITEMS = [
  { href: "/statistiques", label: "Statistiques" },
] as const

const ADMIN_NAV_ITEMS = [
  { href: "/administration", label: "Administration" },
  { href: "/codes", label: "Codes" },
] as const

function initiales(prenom?: string | null, nom?: string | null) {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?"
}

export function AppHeader({
  email,
  prenom,
  nom,
  photoUrl,
  role,
  nePasDeranger,
  appelsDesactives,
}: {
  email: string
  prenom?: string | null
  nom?: string | null
  photoUrl?: string | null
  role?: string | null
  nePasDeranger: boolean
  appelsDesactives: boolean
}) {
  const pathname = usePathname()
  const [preferencesOuvertes, setPreferencesOuvertes] = useState(false)

  const outils = [
    ...(role === "admin" || role === "bureau" ? ENCADREMENT_NAV_ITEMS : []),
    ...(role === "admin" ? ADMIN_NAV_ITEMS : []),
  ]

  // Garde l'onglet actif sur une sous-page : /agenda/12 → « Agenda ».
  const actif =
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )?.href ?? undefined

  return (
    <header className="border-b border-bordure bg-surface">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-6">
          <span className="hidden shrink-0 text-[15px] font-semibold text-bleu-nuit xl:inline">
            Fédération RN des Hautes-Alpes
          </span>

          <PillNav
            logo="/logo.png"
            logoAlt="RN05"
            items={NAV_ITEMS}
            activeHref={actif}
            baseColor="#0B1F3A"
            pillColor="#16305A"
            pillTextColor="#C3D0E4"
            hoveredPillTextColor="#FFFFFF"
            initialLoadAnimation={false}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 shrink-0 gap-2 px-2 text-texte hover:bg-fond"
            >
              <Avatar size="sm">
                <AvatarImage src={photoUrl ?? undefined} alt="" />
                <AvatarFallback>{initiales(prenom, nom)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">{prenom ?? email}</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="px-1.5 py-1 text-sm text-texte-2">{email}</div>

            {outils.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Encadrement</DropdownMenuLabel>
                {outils.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "w-full",
                        pathname.startsWith(item.href) &&
                          "font-semibold text-bleu-primaire"
                      )}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setPreferencesOuvertes(true)}>
              Préférences d&apos;appel
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={signOut} className="w-full">
                <button type="submit" className="w-full text-left">
                  Se déconnecter
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <PreferencesAppelDialog
        open={preferencesOuvertes}
        onOpenChange={setPreferencesOuvertes}
        nePasDerangerInitial={nePasDeranger}
        appelsDesactivesInitial={appelsDesactives}
      />
    </header>
  )
}