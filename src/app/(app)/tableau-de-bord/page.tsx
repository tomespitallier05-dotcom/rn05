import { Suspense } from "react"
import { DashboardCardSkeleton } from "./dashboard-card"
import {
  ProchainsEvenements,
  DernieresAnnonces,
  DerniersDocuments,
  NouveauxMembres,
} from "./cards"

export default function TableauDeBordPage() {
  return (
    <div className="container-app flex flex-1 flex-col gap-6 py-8">
      <h1 className="text-[32px] font-bold text-texte">Tableau de bord</h1>

      {/* 3 colonnes desktop, 2 tablette, 1 mobile, gouttière 24px (gap-6) ;
          grid-auto-rows: 1fr pour des cartes strictement homogènes. */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 [grid-auto-rows:1fr]">
        <Suspense fallback={<DashboardCardSkeleton />}>
          <ProchainsEvenements />
        </Suspense>
        <Suspense fallback={<DashboardCardSkeleton />}>
          <DernieresAnnonces />
        </Suspense>
        <Suspense fallback={<DashboardCardSkeleton />}>
          <DerniersDocuments />
        </Suspense>
        <Suspense fallback={<DashboardCardSkeleton />}>
          <NouveauxMembres />
        </Suspense>
      </div>
    </div>
  )
}
