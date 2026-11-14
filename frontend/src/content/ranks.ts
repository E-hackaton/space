/**
 * Grades d'explorateur, gagnés en complétant la collection.
 * Les seuils sont des proportions, pour rester justes si l'équipe ajoute des héros.
 * Les noms des grades sont dans les dictionnaires (t.collection.ranks), dans le même ordre.
 */

const THRESHOLDS: readonly number[] = [0, 0.2, 0.5, 0.8, 1]

/** Index du grade actuel et du suivant (null si le dernier est atteint). */
export function rankFor(unlocked: number, total: number): { current: number; next: number | null } {
  const ratio = total === 0 ? 0 : unlocked / total
  const current = Math.max(0, THRESHOLDS.findLastIndex((threshold) => ratio >= threshold))
  return { current, next: current + 1 < THRESHOLDS.length ? current + 1 : null }
}
