/**
 * Registre des expériences « À toi de jouer », une par héros (repéré par son slug).
 *
 * Chaque expérience montre comment fonctionnait l'engin, comme le demande l'énoncé du défi
 * (« showing how missions operated rather than listing facts »).
 * Pour en ajouter une : créer le composant dans ce dossier, puis l'enregistrer ici.
 */

import type { ComponentType } from 'react'

import { DustyPanels } from './DustyPanels'
import { IngenuityFlight } from './IngenuityFlight'
import { LaserRanging } from './LaserRanging'

export interface Experience {
  title: string
  intro: string
  Component: ComponentType
}

export const EXPERIENCES: Partial<Record<string, Experience>> = {
  'apollo-15-retroreflector': {
    title: 'Mesure la distance de la Lune',
    intro:
      "Tu es dans un observatoire. Tire une impulsion laser vers mes miroirs et chronomètre son retour : c'est exactement ce que font les scientifiques aujourd'hui.",
    Component: LaserRanging,
  },
  ingenuity: {
    title: 'Fais décoller Ingenuity',
    intro: "Règle la vitesse de mes pales. Arriveras-tu à décoller sur Mars ? Et sur Terre, ce serait plus facile ?",
    Component: IngenuityFlight,
  },
  opportunity: {
    title: 'Garde Opportunity en vie',
    intro:
      "Mon énergie vient du Soleil, mais la poussière martienne recouvre mes panneaux. Avance dans le temps et vois combien de sols tu tiens.",
    Component: DustyPanels,
  },
}
