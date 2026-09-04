"use client"

import { useMemo, useState } from "react"
import { SearchIcon, UsersIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { ROLE_LABEL, ROLES } from "@/lib/roles"
import { MemberCard, type Membre } from "./member-card"
import { MemberPanel } from "./member-panel"

export function AnnuaireView({ membres }: { membres: Membre[] }) {
  const [recherche, setRecherche] = useState("")
  const rechercheDebounced = useDebouncedValue(recherche, 250)
  const [role, setRole] = useState<string>("tous")
  const [commune, setCommune] = useState<string>("toutes")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const communes = useMemo(() => {
    const set = new Set(membres.map((m) => m.commune).filter((c): c is string => !!c))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [membres])

  const filtres = useMemo(() => {
    const q = rechercheDebounced.trim().toLowerCase()
    return membres.filter((m) => {
      if (role !== "tous" && m.role !== role) return false
      if (commune !== "toutes" && m.commune !== commune) return false
      if (!q) return true
      const cible = `${m.prenom ?? ""} ${m.nom ?? ""} ${m.commune ?? ""} ${m.fonction_rn ?? ""}`.toLowerCase()
      return cible.includes(q)
    })
  }, [membres, rechercheDebounced, role, commune])

  return (
    <div className="container-app flex flex-1 flex-col gap-6 py-8">
      <h1 className="text-[32px] font-bold text-texte">Annuaire</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texte-2" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un nom, une commune, une fonction..."
            className="pl-9"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les rôles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={commune} onValueChange={setCommune}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes les communes</SelectItem>
            {communes.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtres.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Aucun membre trouvé"
          description="Modifiez votre recherche ou vos filtres."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 [grid-auto-rows:1fr]">
          {filtres.map((membre) => (
            <MemberCard
              key={membre.id}
              membre={membre}
              onClick={() => setSelectedId(membre.id)}
            />
          ))}
        </div>
      )}

      <MemberPanel memberId={selectedId} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  )
}
