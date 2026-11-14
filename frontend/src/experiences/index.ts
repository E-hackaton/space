/**
 * Registre des expériences « À toi de jouer », une par héros (repéré par son slug).
 *
 * Chaque expérience montre comment fonctionnait l'engin, comme le demande l'énoncé du défi
 * (« showing how missions operated rather than listing facts »).
 * Pour en ajouter une : créer le composant dans ce dossier, ses textes dans les dictionnaires
 * (t.experiences), puis l'enregistrer ici.
 */

import type { ComponentType } from 'react'

import type { Messages } from '../i18n/messages/fr'
import { DustyPanels } from './DustyPanels'
import { IngenuityFlight } from './IngenuityFlight'
import { LaserRanging } from './LaserRanging'

export interface Experience {
  /** Clé des textes de l'expérience dans les dictionnaires. */
  messages: keyof Messages['experiences']
  Component: ComponentType
}

export const EXPERIENCES: Partial<Record<string, Experience>> = {
  'apollo-15-retroreflector': { messages: 'laser', Component: LaserRanging },
  ingenuity: { messages: 'ingenuity', Component: IngenuityFlight },
  opportunity: { messages: 'dust', Component: DustyPanels },
}
