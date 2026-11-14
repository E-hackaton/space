/**
 * Physique simplifiée des expériences interactives.
 *
 * Les valeurs de référence sont réelles et sourcées sur les fiches des héros. Les modèles sont
 * volontairement simplifiés pour des élèves : ils donnent les bons ordres de grandeur et les bonnes
 * tendances, pas une simulation d'ingénieur. L'interface le signale à chaque fois.
 */

// --- Réflecteur laser : télémétrie Terre-Lune ---------------------------------

export const SPEED_OF_LIGHT_KM_S = 299_792.458
/** Distance moyenne Terre-Lune. */
export const EARTH_MOON_DISTANCE_KM = 384_400
/** La Lune s'éloigne de la Terre d'environ 3,8 cm par an (mesuré grâce aux réflecteurs Apollo). */
export const MOON_RECESSION_CM_PER_YEAR = 3.8

/** Durée de l'aller-retour d'une impulsion laser (environ 2,56 s pour la Lune). */
export function laserRoundTripSeconds(distanceKm: number = EARTH_MOON_DISTANCE_KM): number {
  return (2 * distanceKm) / SPEED_OF_LIGHT_KM_S
}

/** Ce que font les scientifiques : distance = vitesse de la lumière × durée ÷ 2. */
export function distanceFromRoundTrip(seconds: number): number {
  return (SPEED_OF_LIGHT_KM_S * seconds) / 2
}

/** De combien de mètres la Lune se sera éloignée dans `years` années. */
export function moonRecessionMeters(years: number): number {
  return (years * MOON_RECESSION_CM_PER_YEAR) / 100
}

// --- Ingenuity : voler dans l'air de Mars -------------------------------------

export type Planet = 'earth' | 'mars'

export const GRAVITY_M_S2: Record<Planet, number> = { earth: 9.81, mars: 3.71 }
/** Masse volumique de l'air au sol (kg/m³). La NASA résume : l'air de Mars fait environ 1 % de celui de la Terre. */
export const AIR_DENSITY: Record<Planet, number> = { earth: 1.225, mars: 1.225 / 100 }
export const INGENUITY_MASS_KG = 1.8
/** Vitesse de rotation des pales d'Ingenuity sur Mars : environ 2 400 à 2 900 tours par minute. */
const MARS_HOVER_RPM = 2500

export function weightNewtons(planet: Planet): number {
  return INGENUITY_MASS_KG * GRAVITY_M_S2[planet]
}

/**
 * Coefficient de portance du modèle (portance = k × densité de l'air × tours²).
 * Il est calibré pour que le vol stationnaire sur Mars demande environ 2 500 tr/min,
 * l'ordre de grandeur réel d'Ingenuity.
 */
const LIFT_COEFFICIENT = weightNewtons('mars') / (AIR_DENSITY.mars * MARS_HOVER_RPM ** 2)

export function liftNewtons(planet: Planet, rpm: number): number {
  return LIFT_COEFFICIENT * AIR_DENSITY[planet] * rpm ** 2
}

/** Vitesse minimale des pales pour quitter le sol (environ 400 tr/min sur Terre, 2 500 sur Mars). */
export function hoverRpm(planet: Planet): number {
  return Math.sqrt(weightNewtons(planet) / (LIFT_COEFFICIENT * AIR_DENSITY[planet]))
}
