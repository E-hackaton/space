/**
 * Conversion de coordonnées planétaires en position sur une carte équirectangulaire.
 *
 * Nos cartes (Lune et Mars) vont de -180° (bord gauche) à +180° (bord droit) en longitude Est,
 * et de +90° (haut) à -90° (bas) en latitude. La conversion est donc une simple proportion.
 */

export interface MapPosition {
  /** Distance au bord gauche, en % de la largeur. */
  left: number
  /** Distance au bord haut, en % de la hauteur. */
  top: number
}

export function toMapPosition(latitude: number, longitude: number): MapPosition {
  return {
    left: ((longitude + 180) / 360) * 100,
    top: ((90 - latitude) / 180) * 100,
  }
}

/**
 * Pour chaque position, compte combien de positions précédentes sont quasiment au même endroit.
 *
 * Exemple : le rover et le réflecteur laser d'Apollo 15 sont à quelques mètres l'un de l'autre.
 * Les points restent à leur vraie position ; seules les étiquettes sont décalées avec ce rang,
 * pour rester lisibles.
 *
 * @param threshold écart maximal, en % de la carte, pour considérer deux positions confondues
 */
export function stackIndexes(positions: MapPosition[], threshold = 2): number[] {
  return positions.map(
    (current, index) =>
      positions
        .slice(0, index)
        .filter(
          (previous) =>
            Math.abs(previous.left - current.left) < threshold && Math.abs(previous.top - current.top) < threshold,
        ).length,
  )
}

/** Lettres des points cardinaux, qui changent selon la langue (Ouest = « O » ou « W »). */
export interface CardinalLetters {
  north: string
  south: string
  east: string
  west: string
}

/** Formate une coordonnée pour l'affichage, ex. « 22,27° N » ou « 47.95° W ». */
export function formatCoordinate(value: number, axis: 'lat' | 'lon', locale: string, letters: CardinalLetters): string {
  const hemisphere =
    axis === 'lat' ? (value >= 0 ? letters.north : letters.south) : value >= 0 ? letters.east : letters.west
  const amount = Math.abs(value).toLocaleString(locale, { maximumFractionDigits: 2 })
  return `${amount}° ${hemisphere}`
}
