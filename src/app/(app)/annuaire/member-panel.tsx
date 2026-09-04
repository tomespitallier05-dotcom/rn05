"use client"

import { useEffect, useState } from "react"
import { PhoneIcon, MapPinIcon, BriefcaseIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { ROLE_LABEL, type Role } from "@/lib/roles"
import { getMemberDetail, type MemberDetail } from "./actions"

function initiales(prenom?: string | null, nom?: string | null) {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?"
}

export function MemberPanel({
  memberId,
  onOpenChange,
}: {
  memberId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!memberId) return
    setLoading(true)
    setDetail(null)
    getMemberDetail(memberId).then((result) => {
      setDetail(result)
      setLoading(false)
    })
  }, [memberId])

  return (
    <Sheet open={!!memberId} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "max-h-[85vh]" : ""}>
        <SheetHeader>
          <SheetTitle>
            {detail ? `${detail.prenom ?? ""} ${detail.nom ?? ""}`.trim() : "Fiche membre"}
          </SheetTitle>
          <SheetDescription className="sr-only">Détail de la fiche membre</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading || !detail ? (
            <div className="grid gap-4">
              <Skeleton className="mx-auto size-20 rounded-full" />
              <Skeleton className="mx-auto h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="flex flex-col items-center gap-2">
                <Avatar size="lg" className="size-20">
                  <AvatarImage src={detail.photoUrl ?? undefined} alt="" />
                  <AvatarFallback className="text-lg">
                    {initiales(detail.prenom, detail.nom)}
                  </AvatarFallback>
                </Avatar>
                <Badge variant="secondary">{ROLE_LABEL[detail.role as Role] ?? detail.role}</Badge>
              </div>

              <div className="grid gap-2">
                {detail.fonction_rn && (
                  <p className="flex items-center gap-1.5 text-sm text-texte">
                    <BriefcaseIcon className="size-4 text-texte-2" />
                    {detail.fonction_rn}
                  </p>
                )}
                {detail.commune && (
                  <p className="flex items-center gap-1.5 text-sm text-texte">
                    <MapPinIcon className="size-4 text-texte-2" />
                    {detail.commune}
                  </p>
                )}
                {detail.peutVoirCoordonnees && detail.telephone && (
                  <p className="flex items-center gap-1.5 text-sm text-texte">
                    <PhoneIcon className="size-4 text-texte-2" />
                    {detail.telephone}
                  </p>
                )}
              </div>

              {detail.profession && (
                <div>
                  <p className="text-xs font-medium text-texte-2">Profession</p>
                  <p className="text-sm text-texte">{detail.profession}</p>
                </div>
              )}
              {detail.secteur && (
                <div>
                  <p className="text-xs font-medium text-texte-2">Secteur</p>
                  <p className="text-sm text-texte">{detail.secteur}</p>
                </div>
              )}
              {detail.bio && (
                <div>
                  <p className="text-xs font-medium text-texte-2">Biographie</p>
                  <p className="whitespace-pre-wrap text-sm text-texte">{detail.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
