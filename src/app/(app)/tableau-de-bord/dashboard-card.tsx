import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Structure imposée par 1.4 : icône 40px → titre 18px → contenu → lien
// d'accès collé en bas (margin-top:auto). Utilisé par les 4 cartes de la
// grille, qui doit rester strictement homogène (grid-auto-rows: 1fr, jamais
// de hauteur en px) : cette coquille garantit la même structure partout.
export function DashboardCard({
  icon: Icon,
  title,
  href,
  hrefLabel,
  children,
}: {
  icon: LucideIcon
  title: string
  href: string
  hrefLabel: string
  children: React.ReactNode
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <Icon className="mb-2 size-10 text-bleu-primaire" aria-hidden="true" />
        <CardTitle className="text-[18px]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1">{children}</div>
        <Link
          href={href}
          className="mt-auto block pt-4 text-sm font-medium text-bleu-primaire hover:underline"
        >
          {hrefLabel}
        </Link>
      </CardContent>
    </Card>
  )
}

export function DashboardCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <Skeleton className="mb-2 size-10 rounded-[10px]" />
        <Skeleton className="h-5 w-2/3" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="mt-auto h-4 w-24" />
      </CardContent>
    </Card>
  )
}

export function CardEmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex h-full items-center text-sm text-texte-2">{children}</p>
  )
}
