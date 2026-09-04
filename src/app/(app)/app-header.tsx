"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "./actions"

// La navigation ne référence que les écrans déjà livrés (méthode de
// livraison : un écran complet à la fois). À compléter au fur et à mesure
// (agenda, annuaire, annonces, documents, administration).
const NAV_ITEMS = [{ href: "/tableau-de-bord", label: "Tableau de bord" }] as const

function initiales(prenom?: string | null, nom?: string | null) {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?"
}

export function AppHeader({
  email,
  prenom,
  nom,
  photoUrl,
}: {
  email: string
  prenom?: string | null
  nom?: string | null
  photoUrl?: string | null
}) {
  const pathname = usePathname()

  return (
    <header className="border-b border-bordure bg-bleu-nuit">
      <div className="container-app flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-[16px] font-semibold text-white">
            Fédération RN des Hautes-Alpes
          </span>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white",
                  pathname === item.href && "bg-white/10 text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 gap-2 px-2 text-white hover:bg-white/10 hover:text-white"
            >
              <Avatar size="sm">
                <AvatarImage src={photoUrl ?? undefined} alt="" />
                <AvatarFallback>{initiales(prenom, nom)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">{prenom ?? email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-1.5 py-1 text-sm text-texte-2">{email}</div>
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
    </header>
  )
}
