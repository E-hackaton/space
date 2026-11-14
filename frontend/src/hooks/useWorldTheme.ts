import { useEffect } from 'react'

import type { BodySlug } from '../types/api'

/**
 * Applique l'univers de couleur d'un monde à toute la page (voir styles/worlds.css).
 * En quittant la page, on revient au thème Space Apps par défaut.
 */
export function useWorldTheme(world: BodySlug): void {
  useEffect(() => {
    const root = document.documentElement
    root.dataset.world = world
    return () => {
      delete root.dataset.world
    }
  }, [world])
}
