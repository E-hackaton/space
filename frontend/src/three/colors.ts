/**
 * Couleurs utilisées dans les scènes 3D. WebGL ne lit pas les variables CSS : on garde ici
 * des valeurs alignées sur styles/theme.css et styles/worlds.css.
 */

import type { BodySlug, EquipmentStatus } from '../types/api'

/** Accent de chaque monde (identique à worlds.css). */
export const WORLD_ACCENTS: Record<BodySlug, string> = {
  moon: '#d6e0f0',
  mars: '#ff8a4c',
  elsewhere: '#c49bff',
}

/** « En mission » à l'année affichée, sinon l'état actuel (identique à theme.css). */
export type MarkerLook = 'working' | EquipmentStatus

export const MARKER_COLORS: Record<MarkerLook, string> = {
  working: '#eafe07',
  active: '#3ddc97',
  useful: '#2e96f5',
  silent: '#b8c2d9',
  lost: '#7d8bab',
}
