import type { MachineKind } from '../lib/machines';

/**
 * Anatomie des machines : quelles pièces montrer, et dans quel ordre.
 * Les textes (nom, « à quoi ça sert », « pourquoi c'est important ») sont dans les fichiers
 * de traduction, sous `anatomy.<pièce>`.
 */
export type AnatomyKey =
  | 'body'
  | 'wheels'
  | 'arm'
  | 'mast'
  | 'panels'
  | 'legs'
  | 'rotor'
  | 'antenna'
  | 'mirror'
  | 'engine'
  | 'power'
  | 'footpad'
  | 'ladder'
  | 'seismometer';

/** Une pièce montrée à l'écran. `label` : clé de son étiquette 3D (ex. « parts.rtg »). */
export interface AnatomyPart {
  key: AnatomyKey;
  label: string;
}

/** Étiquettes des modèles 3D (models.json, décors de la Lune) → fiche d'anatomie correspondante. */
const LABEL_TO_KEY: Record<string, AnatomyKey> = {
  'parts.mast': 'mast',
  'parts.arm': 'arm',
  'parts.rtg': 'power',
  'parts.wheels': 'wheels',
  'parts.hga': 'antenna',
  'parts.blades': 'rotor',
  'parts.solarPanel': 'panels',
  'parts.body': 'body',
  'parts.legs': 'legs',
  'parts.descentStage': 'engine',
  'parts.landingLegs': 'legs',
  'parts.footpad': 'footpad',
  'parts.ladder': 'ladder',
  'parts.reflectorPanel': 'mirror',
  'parts.seismometer': 'seismometer',
  'parts.seismoPanels': 'panels',
};

export function partsFromLabels(labels: string[]): AnatomyPart[] {
  return labels.filter((label) => label in LABEL_TO_KEY).map((label) => ({ key: LABEL_TO_KEY[label], label }));
}

/** Pièces génériques selon le type de machine (quand il n'y a pas de modèle annoté). */
const BY_KIND: Record<MachineKind, AnatomyKey[]> = {
  rover: ['body', 'wheels', 'arm', 'mast', 'panels', 'antenna'],
  lander: ['body', 'legs', 'arm', 'panels', 'antenna'],
  helicopter: ['rotor', 'panels', 'body', 'legs'],
  reflector: ['mirror'],
  orbiter: ['body', 'antenna', 'panels'],
  probe: ['body', 'antenna', 'power'],
};

/** Pièces d'une machine des missions : celles de sa mise en scène, sinon celles de son type. */
export function partsForKind(kind: MachineKind, override?: AnatomyKey[]): AnatomyPart[] {
  return (override ?? BY_KIND[kind]).map((key) => ({ key, label: `anatomy.${key}.name` }));
}
