/**
 * Contexte et palette partagés par les pièces des machines 3D (voir MachineParts.tsx).
 * Séparés des composants pour que le rechargement à chaud de Vite fonctionne.
 */

import { createContext } from 'react'
import type { Object3D } from 'three'

import type { MachineFocus } from '../../types/api'

export interface PartsRegistry {
  register: (focus: MachineFocus, object: Object3D) => () => void
  /** Pièce mise en avant par l'étape en cours. */
  activeFocus: MachineFocus
  /** Couleur d'éclairage de la pièce active (accent du monde). */
  highlight: string
}

export const PartsContext = createContext<PartsRegistry | null>(null)

/** Palette des matériaux, sobre et cohérente pour toutes les machines. */
export const MATERIALS = {
  hull: { color: '#d9dde6', roughness: 0.6, metalness: 0.2 },
  dark: { color: '#3a4152', roughness: 0.7, metalness: 0.3 },
  gold: { color: '#c9a227', roughness: 0.35, metalness: 0.75 }, // feuille d'isolation dorée
  solar: { color: '#1d3f8f', roughness: 0.3, metalness: 0.5 },
  tire: { color: '#5b6070', roughness: 0.9, metalness: 0.1 },
  glass: { color: '#cfe6ff', roughness: 0.05, metalness: 0.9 },
} as const
