import type { ApiPhase } from '../api/types';
import type { BodyId } from '../lib/solarSystem';
import type { ModelId } from '../components/3d/NasaModel';
import type { MachineKind, StoryEffect, Vital } from '../lib/machines';
import type { AnatomyKey } from './anatomy';

/**
 * Mise en scène de chaque machine dans la cinématique 3D.
 *
 * Le **contenu** (récits, dates, quiz, sources, voix) vient de l'API Django : c'est la source unique,
 * vérifiée et éditable dans l'admin. Ce fichier ne décrit que ce qui sert au **jeu** :
 * jauges illustratives, effets spéciaux, modèle NASA à afficher, astres survolés.
 */
export interface Staging {
  /** Modèle 3D officiel de la NASA (public/models). Sans modèle, on affiche une forme simplifiée. */
  model?: ModelId;
  /** Remplace la forme déduite du type de l'API (ex. le réflecteur laser). */
  kind?: MachineKind;
  /** Astres survolés pendant le voyage (ex. Pioneer 10 passe par Jupiter). */
  cruise?: BodyId[];
  /** Effet spécial joué pendant les étapes d'une phase du récit. */
  effects?: Partial<Record<ApiPhase, StoryEffect>>;
  /** « Constantes vitales » : jauges illustratives qui évoluent au fil du récit. */
  vitals: Vital[];
  /** Pièces à expliquer (anatomie) quand le modèle 3D n'a pas d'étiquettes. Par défaut : selon le type. */
  anatomy?: AnatomyKey[];
}

const solar = (signalEnd = 0): Vital[] => [
  { label: 'vitals.energy', start: 100, end: 0, unit: '%' },
  { label: 'vitals.dust', start: 0, end: 100, unit: '%' },
  { label: 'vitals.signal', start: 100, end: signalEnd, unit: '%' },
];

/** Générateur nucléaire (RTG) : il perd un peu de puissance chaque année. */
const nuclear = (energyEnd: number, signalEnd: number): Vital[] => [
  { label: 'vitals.energy', start: 100, end: energyEnd, unit: '%' },
  { label: 'vitals.signal', start: 100, end: signalEnd, unit: '%' },
];

export const STAGING: Record<string, Staging> = {
  'surveyor-3': { anatomy: ['body', 'legs', 'footpad', 'arm', 'panels'], vitals: [{ label: 'vitals.energy', start: 100, end: 0, unit: '%' }, { label: 'vitals.signal', start: 100, end: 0, unit: '%' }] },
  'apollo-11-eagle': { model: 'apollo_lm', vitals: [{ label: 'vitals.fuel', start: 100, end: 2, unit: '%' }] },
  'apollo-15-lrv': { anatomy: ['body', 'wheels', 'antenna'], vitals: [{ label: 'vitals.energy', start: 100, end: 0, unit: '%' }, { label: 'vitals.dust', start: 0, end: 70, unit: '%' }] },
  'apollo-15-retroreflector': {
    kind: 'reflector',
    anatomy: ['mirror'],
    effects: { exploration: 'laser', discovery: 'laser' },
    vitals: [{ label: 'vitals.echo', start: 100, end: 100, unit: '%' }],
  },
  'viking-1': { model: 'viking', anatomy: ['body', 'legs', 'arm', 'power', 'antenna'], vitals: nuclear(60, 0) },
  sojourner: { anatomy: ['body', 'wheels', 'panels', 'antenna'], vitals: [{ label: 'vitals.energy', start: 100, end: 0, unit: '%' }, { label: 'vitals.signal', start: 100, end: 0, unit: '%' }] },
  opportunity: { model: 'opportunity', effects: { legacy: 'dust-storm' }, vitals: solar() },
  insight: { anatomy: ['body', 'legs', 'arm', 'panels', 'seismometer'], vitals: solar() },
  ingenuity: {
    model: 'ingenuity',
    effects: { exploration: 'flight' },
    vitals: [
      { label: 'vitals.blades', start: 100, end: 0, unit: '%' },
      { label: 'vitals.signal', start: 100, end: 0, unit: '%' },
    ],
  },
  curiosity: { model: 'curiosity', vitals: nuclear(75, 100) },
  perseverance: { model: 'perseverance', vitals: nuclear(90, 100) },
  'near-shoemaker': { anatomy: ['body', 'panels', 'antenna'], vitals: [{ label: 'vitals.energy', start: 100, end: 0, unit: '%' }, { label: 'vitals.signal', start: 100, end: 0, unit: '%' }] },
  'pioneer-10': { cruise: ['jupiter'], anatomy: ['body', 'antenna', 'power'], vitals: nuclear(0, 0) },
};

/** Valeur par défaut pour une machine ajoutée dans l'admin sans mise en scène dédiée. */
export const DEFAULT_STAGING: Staging = {
  vitals: [{ label: 'vitals.signal', start: 100, end: 0, unit: '%' }],
};
