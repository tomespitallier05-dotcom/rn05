"use client"

import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "cn"
import { CATEGORIES, CATEGORIE_LABEL } from "@/lib/agenda-categories"
import { labelPeriode, precedent, suivant } from "@/lib/agenda-dates"

type Vue = "mois" | "semaine" | "jour"

export function AgendaToolbar({
  vue,
  date,
  categoriesSelectionnees,
  peutCreer,
  onChange,
  onCreate,
}: {
  vue: Vue
  date: Date
  categoriesSelectionnees: string[]
  peutCreer: boolean
  onChange: (next: { vue: Vue; date: Date; categories: string[] }) => void
  onCreate: () => void
}) {
  const toutesSelectionnees = categoriesSelectionnees.length === CATEGORIES.length

  function toggleCategorie(categorie: string) {
    const next = categoriesSelectionnees.includes(categorie)
      ? categoriesSelectionnees.filter((c) => c !== categorie)
      : [...categoriesSelectionnees, categorie]
    onChange({ vue, date, categories: next.length === 0 ? [...CATEGORIES] : next })
  }

  return (
    <div className="flex flex-col gap-3 border-b border-bordure bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Période précédente"
            onClick={() => onChange({ vue, date: precedent(vue, date), categories: categoriesSelectionnees })}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            onClick={() => onChange({ vue, date: new Date(), categories: categoriesSelectionnees })}
          >
            Aujourd&apos;hui
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Période suivante"
            onClick={() => onChange({ vue, date: suivant(vue, date), categories: categoriesSelectionnees })}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <span className="text-[18px] font-semibold capitalize text-texte">
          {labelPeriode(vue, date)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={vue}
          onValueChange={(v) => onChange({ vue: v as Vue, date, categories: categoriesSelectionnees })}
        >
          <TabsList>
            <TabsTrigger value="mois">Mois</TabsTrigger>
            <TabsTrigger value="semaine">Semaine</TabsTrigger>
            <TabsTrigger value="jour">Jour</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ vue, date, categories: [...CATEGORIES] })}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              toutesSelectionnees
                ? "border-bleu-primaire bg-bleu-primaire text-white"
                : "border-bordure bg-surface text-texte-2 hover:bg-bleu-clair"
            )}
          >
            Tout
          </button>
          {CATEGORIES.map((categorie) => {
            const active = categoriesSelectionnees.includes(categorie)
            return (
              <button
                key={categorie}
                type="button"
                onClick={() => toggleCategorie(categorie)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-bleu-primaire bg-bleu-clair text-bleu-nuit"
                    : "border-bordure bg-surface text-texte-2 hover:bg-bleu-clair"
                )}
              >
                {CATEGORIE_LABEL[categorie]}
              </button>
            )
          })}
        </div>

        {peutCreer && (
          <Button onClick={onCreate} data-icon="inline-start">
            <PlusIcon />
            Nouvel événement
          </Button>
        )}
      </div>
    </div>
  )
}
