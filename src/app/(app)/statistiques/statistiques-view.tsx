"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { BarChart3Icon } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { CATEGORIE_LABEL, CATEGORIE_COLOR, type Categorie } from "@/lib/agenda-categories"
import {
  REPONSES,
  REPONSE_LABEL,
  REPONSE_COLOR,
  SANS_REPONSE_LABEL,
  SANS_REPONSE_COLOR,
} from "@/lib/participation"
import type { Database } from "@/lib/supabase/database.types"

type TauxRow = Database["public"]["Functions"]["stats_taux_participation_evenements"]["Returns"][number]
type RepartitionRow = Database["public"]["Functions"]["stats_repartition_prochain_evenement"]["Returns"][number]
type CategorieRow = Database["public"]["Functions"]["stats_evenements_par_categorie"]["Returns"][number]

const HAUTEUR_GRAPHIQUE = 280
const AUCUNE_DONNEE = "Pas encore assez de données pour ce graphique."

function tickTitre(valeur: string, mobile: boolean) {
  const max = mobile ? 8 : 16
  return valeur.length > max ? `${valeur.slice(0, max - 1)}…` : valeur
}

function TauxParticipationChart({ data }: { data: TauxRow[] }) {
  const isMobile = useIsMobile()
  const utilisables = data.filter((d) => d.taux_presence !== null)

  if (data.length === 0) {
    return <EmptyState icon={BarChart3Icon} title={AUCUNE_DONNEE} />
  }

  return (
    <div className="grid gap-4">
      <ResponsiveContainer width="100%" height={HAUTEUR_GRAPHIQUE}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: isMobile ? 48 : 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bordure)" vertical={false} />
          <XAxis
            dataKey="titre"
            tick={{ fontSize: 12, fill: "var(--texte-2)" }}
            tickFormatter={(v: string) => tickTitre(v, isMobile)}
            angle={isMobile ? -35 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 56 : 30}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12, fill: "var(--texte-2)" }}
            width={40}
          />
          <Tooltip
            formatter={(v) => [`${v}%`, "Présents parmi les répondants"]}
            labelStyle={{ color: "var(--texte)" }}
            contentStyle={{ borderColor: "var(--bordure)", borderRadius: 8 }}
          />
          <Bar dataKey="taux_presence" fill="var(--bleu-primaire)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto rounded-[10px] border border-bordure">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Événement</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Taux de présence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.event_id}>
                <TableCell>{row.titre}</TableCell>
                <TableCell className="text-texte-2">
                  {format(new Date(row.debut), "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell className="text-texte-2">
                  {row.taux_presence === null ? "Aucun répondant" : `${row.taux_presence}%`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {utilisables.length === 0 && (
        <p className="text-sm text-texte-2">Aucun événement n&apos;a encore de répondant.</p>
      )}
    </div>
  )
}

function RepartitionProchainChart({ data }: { data: RepartitionRow | null }) {
  if (!data) {
    return <EmptyState icon={BarChart3Icon} title={AUCUNE_DONNEE} />
  }

  const chartData = [
    {
      titre: data.titre,
      present: data.present_count,
      peut_etre: data.peut_etre_count,
      absent: data.absent_count,
      sans_reponse: data.sans_reponse_count,
    },
  ]

  return (
    <div className="grid gap-4">
      <p className="text-sm text-texte-2">
        {data.titre} — {format(new Date(data.debut), "EEEE d MMMM yyyy", { locale: fr })}
      </p>
      <ResponsiveContainer width="100%" height={HAUTEUR_GRAPHIQUE}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bordure)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--texte-2)" }} />
          <YAxis type="category" dataKey="titre" hide />
          <Tooltip contentStyle={{ borderColor: "var(--bordure)", borderRadius: 8 }} />
          <Bar dataKey="present" stackId="a" fill={REPONSE_COLOR.present} name={REPONSE_LABEL.present} />
          <Bar dataKey="peut_etre" stackId="a" fill={REPONSE_COLOR.peut_etre} name={REPONSE_LABEL.peut_etre} />
          <Bar dataKey="absent" stackId="a" fill={REPONSE_COLOR.absent} name={REPONSE_LABEL.absent} />
          <Bar dataKey="sans_reponse" stackId="a" fill={SANS_REPONSE_COLOR} name={SANS_REPONSE_LABEL} />
        </BarChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto rounded-[10px] border border-bordure">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Réponse</TableHead>
              <TableHead>Nombre</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {REPONSES.map((r) => (
              <TableRow key={r}>
                <TableCell>{REPONSE_LABEL[r]}</TableCell>
                <TableCell className="text-texte-2">
                  {r === "present" ? data.present_count : r === "peut_etre" ? data.peut_etre_count : data.absent_count}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>{SANS_REPONSE_LABEL}</TableCell>
              <TableCell className="text-texte-2">{data.sans_reponse_count}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function EvenementsParCategorieChart({ data }: { data: CategorieRow[] }) {
  if (data.length === 0) {
    return <EmptyState icon={BarChart3Icon} title={AUCUNE_DONNEE} />
  }

  const chartData = data.map((d) => ({
    ...d,
    label: CATEGORIE_LABEL[d.categorie as Categorie] ?? d.categorie,
  }))

  return (
    <div className="grid gap-4">
      <ResponsiveContainer width="100%" height={HAUTEUR_GRAPHIQUE}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bordure)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--texte-2)" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--texte-2)" }} width={32} />
          <Tooltip contentStyle={{ borderColor: "var(--bordure)", borderRadius: 8 }} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {chartData.map((d) => (
              <Cell key={d.categorie} fill={CATEGORIE_COLOR[d.categorie as Categorie]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto rounded-[10px] border border-bordure">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Catégorie</TableHead>
              <TableHead>Nombre d&apos;événements</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chartData.map((d) => (
              <TableRow key={d.categorie}>
                <TableCell>{d.label}</TableCell>
                <TableCell className="text-texte-2">{d.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function StatistiquesView({
  taux,
  repartition,
  parCategorie,
}: {
  taux: TauxRow[]
  repartition: RepartitionRow | null
  parCategorie: CategorieRow[]
}) {
  return (
    <div className="container-app flex flex-1 flex-col gap-8 py-8">
      <h1 className="text-[32px] font-bold text-texte">Statistiques</h1>

      <section className="grid gap-3">
        <h2 className="text-[18px] font-semibold text-texte">
          Taux de participation par événement (6 derniers mois)
        </h2>
        <TauxParticipationChart data={taux} />
      </section>

      <section className="grid gap-3">
        <h2 className="text-[18px] font-semibold text-texte">Répartition du prochain événement</h2>
        <RepartitionProchainChart data={repartition} />
      </section>

      <section className="grid gap-3">
        <h2 className="text-[18px] font-semibold text-texte">
          Événements par catégorie (12 derniers mois)
        </h2>
        <EvenementsParCategorieChart data={parCategorie} />
      </section>
    </div>
  )
}
