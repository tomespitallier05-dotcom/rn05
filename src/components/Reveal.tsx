'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Un seul effet pour toute la page : fondu + légère montée à l'entrée
 * dans le viewport. Réutilisé partout plutôt que d'empiler des
 * animations différentes par section.
 *
 * L'observateur se déconnecte après le premier déclenchement : l'élément
 * ne rejoue pas l'animation si on remonte, ce qui devient vite pénible.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  /** Décalage en ms, pour faire apparaître une série d'éléments en cascade. */
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Réglage système respecté : affichage immédiat, sans transition.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}
