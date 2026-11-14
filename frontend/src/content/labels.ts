/**
 * Libellés de l'interface pour les codes renvoyés par l'API.
 * L'API envoie des codes stables (« silent », « rover ») ; le texte affiché est choisi ici.
 */

import type { BodySlug, EquipmentKind, EquipmentStatus } from '../types/api'

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  active: 'Encore actif',
  useful: 'Encore utile',
  silent: 'Silencieux',
  lost: 'Perdu',
}

/** Explication courte du statut, lue par les lecteurs d'écran et affichée en infobulle. */
export const STATUS_DESCRIPTIONS: Record<EquipmentStatus, string> = {
  active: 'Il fonctionne et communique encore avec la Terre.',
  useful: "Il n'envoie plus de signal, mais les scientifiques s'en servent encore.",
  silent: 'Sa mission est terminée. Il ne communique plus, mais on sait où il se trouve.',
  lost: 'Il est trop loin ou trop faible pour être capté.',
}

export const KIND_LABELS: Record<EquipmentKind, string> = {
  lander: 'Atterrisseur',
  descent_stage: 'Étage de descente',
  rover: 'Rover',
  helicopter: 'Hélicoptère',
  instrument: 'Instrument scientifique',
  orbiter: 'Sonde en orbite',
  probe: 'Sonde interplanétaire',
  telescope: 'Télescope spatial',
}

export const BODY_ORDER: readonly BodySlug[] = ['moon', 'mars', 'elsewhere']
