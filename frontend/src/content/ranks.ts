/**
 * Grades d'explorateur, gagnés en complétant la collection.
 * Les seuils sont des proportions, pour rester justes si l'équipe ajoute des héros.
 */

export interface Rank {
  /** Part minimale de la collection (0 à 1) pour obtenir ce grade. */
  threshold: number
  title: string
}

const RANKS: readonly Rank[] = [
  { threshold: 0, title: "Recrue de l'espace" },
  { threshold: 0.2, title: 'Exploratrice ou explorateur junior' },
  { threshold: 0.5, title: 'Archiviste des étoiles' },
  { threshold: 0.8, title: 'Pilote de la mémoire' },
  { threshold: 1, title: 'Gardienne ou gardien de la mémoire' },
]

/** Grade actuel et grade suivant (null si le dernier est atteint). */
export function rankFor(unlocked: number, total: number): { current: Rank; next: Rank | null } {
  const ratio = total === 0 ? 0 : unlocked / total
  const index = RANKS.findLastIndex((rank) => ratio >= rank.threshold)
  const current = RANKS[Math.max(0, index)] ?? RANKS[0]!
  return { current, next: RANKS[index + 1] ?? null }
}
