// Positionnement côte à côte des événements qui se chevauchent (vues
// semaine/jour, 1.5). Algorithme volontairement simple (colonnes de largeur
// uniforme par groupe de chevauchement) plutôt que le compactage optimal de
// Google Calendar : correct (jamais de recouvrement visuel) et largement
// suffisant pour le volume d'événements d'une fédération départementale.
export type EvenementPositionne<T> = {
  event: T
  colonne: number
  colonnes: number
}

export function positionnerChevauchements<T extends { debut: string; fin: string }>(
  events: T[]
): EvenementPositionne<T>[] {
  const tries = [...events].sort(
    (a, b) => new Date(a.debut).getTime() - new Date(b.debut).getTime()
  )

  const resultats: EvenementPositionne<T>[] = []
  let clusterActuel: { event: T; colonne: number }[] = []
  let finClusterMax = -Infinity

  const cloreCluster = () => {
    if (clusterActuel.length === 0) return
    const colonnes = Math.max(...clusterActuel.map((e) => e.colonne)) + 1
    for (const item of clusterActuel) {
      resultats.push({ event: item.event, colonne: item.colonne, colonnes })
    }
    clusterActuel = []
  }

  const finsColonnes: number[] = []

  for (const event of tries) {
    const debut = new Date(event.debut).getTime()
    const fin = new Date(event.fin).getTime()

    if (debut >= finClusterMax) {
      cloreCluster()
      finsColonnes.length = 0
      finClusterMax = -Infinity
    }

    let colonne = finsColonnes.findIndex((finColonne) => finColonne <= debut)
    if (colonne === -1) {
      colonne = finsColonnes.length
    }
    finsColonnes[colonne] = fin
    finClusterMax = Math.max(finClusterMax, fin)
    clusterActuel.push({ event, colonne })
  }
  cloreCluster()

  return resultats
}
