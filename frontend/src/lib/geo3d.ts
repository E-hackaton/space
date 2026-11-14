/**
 * Coordonnées planétaires → position 3D sur un globe three.js.
 *
 * On reprend exactement la paramétrisation de THREE.SphereGeometry (phi autour de l'axe Y,
 * theta depuis le pôle Nord). Une carte équirectangulaire (-180° → +180°) plaquée sur la sphère
 * et nos marqueurs tombent ainsi au même endroit, sans calibrage.
 */

const DEG = Math.PI / 180

export type Vec3 = [number, number, number]

export function latLonToVector3(latitude: number, longitude: number, radius = 1): Vec3 {
  const phi = (longitude + 180) * DEG // u = 0 à gauche de la carte (-180°)
  const theta = (90 - latitude) * DEG // v = 0 au pôle Nord
  return [-radius * Math.cos(phi) * Math.sin(theta), radius * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta)]
}

/**
 * Rotation du globe (autour de l'axe vertical) qui amène une longitude face à la caméra (+Z).
 * Sert à ouvrir le globe directement sur les machines plutôt que sur une face vide.
 */
export function rotationToFaceLongitude(longitude: number): number {
  const [x, , z] = latLonToVector3(0, longitude)
  return -Math.atan2(x, z)
}

/** Longitude moyenne d'un ensemble de points (moyenne circulaire : -179° et +179° sont voisins). */
export function meanLongitude(longitudes: number[]): number {
  if (longitudes.length === 0) return 0
  const sin = longitudes.reduce((sum, lon) => sum + Math.sin(lon * DEG), 0)
  const cos = longitudes.reduce((sum, lon) => sum + Math.cos(lon * DEG), 0)
  return Math.atan2(sin, cos) / DEG
}
