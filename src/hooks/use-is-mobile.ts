"use client"

import { useEffect, useState } from "react"

// Seuil mobile du design system : < 768px (breakpoints 1.5/critères
// d'acceptation). Utilisé là où un comportement diffère réellement entre
// mobile et desktop (panneau latéral vs feuille modale, vue mois vs liste).
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)")
    setIsMobile(mql.matches)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
