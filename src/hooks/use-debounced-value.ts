"use client"

import { useEffect, useState } from "react"

// Recherche instantanée avec debounce 250ms (1.6) : réutilisable partout où
// une saisie déclenche un filtrage.
export function useDebouncedValue<T>(value: T, delayMs = 250) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
