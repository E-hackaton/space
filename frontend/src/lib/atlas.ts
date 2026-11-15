import * as THREE from 'three';
import { latLonToVector3 } from './geo';
import type { MachineSummary } from './machines';
import type { ModelId } from '../components/3d/NasaModel';
import type { AnatomyId } from '../world/anatomy/AnatomyModel';

/*
 * Atlas des objets oubliés : où se trouve chaque machine sur la Lune et sur Mars,
 * et comment la montrer en 3D. Les coordonnées viennent de l'API (fiches vérifiées).
 */

export type SurfaceBody = 'moon' | 'mars';
export const SURFACE_BODIES: SurfaceBody[] = ['moon', 'mars'];

export interface SurfaceConfig {
  texture: string;
  bump?: string;
  /** Rayon moyen réel (km), fiches NASA NSSDCA : sert aux distances affichées. */
  radiusKm: number;
  radiusSource: string;
  atmosphere?: string;
  /** Teinte de la lumière ambiante et du ciel. */
  sky: string;
  glow: string;
}

export const SURFACES: Record<SurfaceBody, SurfaceConfig> = {
  moon: {
    texture: '/textures/moon_color.jpg',
    bump: '/textures/moon_bump.jpg',
    radiusKm: 1737.4,
    radiusSource: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
    sky: '#9fb2ff',
    glow: '#cfd8ff',
  },
  mars: {
    texture: '/textures/mars_color.jpg',
    radiusKm: 3389.5,
    radiusSource: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
    atmosphere: '#ff9a6a',
    sky: '#ffb08a',
    glow: '#ff9a6a',
  },
};

/** Rayon des globes dans les scènes (unités). Les machines y sont agrandies : rien n'est à l'échelle. */
export const GLOBE_R = 10;

/** Comment afficher une machine en 3D. */
export type Look3D =
  | { kind: 'nasa'; id: ModelId }
  | { kind: 'anatomy'; id: AnatomyId; pieces?: string[]; exclude?: string[]; excludeGroups?: string[] }
  | { kind: 'reflector'; variant: 'a11' | 'a15' }
  | { kind: 'craft' };

export const LOOKS: Record<string, Look3D> = {
  'surveyor-3': { kind: 'anatomy', id: 'surveyor' },
  'apollo-11-eagle': { kind: 'anatomy', id: 'lunar-module', excludeGroups: ['asc', 'flag'], exclude: ['lrrr', 'psep'] },
  'apollo-15-lrv': { kind: 'anatomy', id: 'lunar-rover' },
  'apollo-15-retroreflector': { kind: 'reflector', variant: 'a15' },
  'viking-1': { kind: 'nasa', id: 'viking' },
  opportunity: { kind: 'nasa', id: 'opportunity' },
  curiosity: { kind: 'nasa', id: 'curiosity' },
  ingenuity: { kind: 'nasa', id: 'ingenuity' },
  perseverance: { kind: 'nasa', id: 'perseverance' },
  insight: { kind: 'nasa', id: 'insight' },
  'near-shoemaker': { kind: 'nasa', id: 'near' },
  'pioneer-10': { kind: 'nasa', id: 'pioneer10' },
};
export const lookOf = (id: string): Look3D => LOOKS[id] ?? { kind: 'craft' };

export interface AtlasPoint {
  machine: MachineSummary;
  /** Position réelle (direction unitaire depuis le centre de l'astre). */
  real: THREE.Vector3;
  /** Position affichée : écartée des voisines trop proches pour rester lisible. */
  shown: THREE.Vector3;
  /** Vraie position modifiée pour l'affichage ? (ex. Perseverance et Ingenuity, au même endroit) */
  nudged: boolean;
}

/** Les machines d'un astre, placées sur le globe unité. */
export function atlasPoints(machines: MachineSummary[], body: SurfaceBody): AtlasPoint[] {
  const list = machines.filter((m) => m.body === body && m.lat !== undefined && m.lon !== undefined);
  const pts: AtlasPoint[] = list.map((m) => {
    const real = latLonToVector3(m.lat!, m.lon!, 1);
    return { machine: m, real, shown: real.clone(), nudged: false };
  });
  // Écarte les sites trop proches (même vallée, même cratère) en couronne autour de leur centre.
  const MIN = 0.045;
  const groups: AtlasPoint[][] = [];
  for (const p of pts) {
    const g = groups.find((gr) => gr.some((q) => q.real.distanceTo(p.real) < MIN));
    if (g) g.push(p);
    else groups.push([p]);
  }
  for (const g of groups) {
    if (g.length < 2) continue;
    const centre = g.reduce((c, p) => c.add(p.real), new THREE.Vector3()).normalize();
    const east = new THREE.Vector3(0, 1, 0).cross(centre).normalize();
    const north = centre.clone().cross(east).normalize();
    g.forEach((p, i) => {
      const a = (i / g.length) * Math.PI * 2 + 0.6;
      p.shown = centre.clone().addScaledVector(east, Math.cos(a) * MIN * 0.75).addScaledVector(north, Math.sin(a) * MIN * 0.75).normalize();
      p.nudged = true;
    });
  }
  return pts;
}

/** Distance réelle à la surface (km) entre deux directions. */
export function surfaceKm(a: THREE.Vector3, b: THREE.Vector3, body: SurfaceBody): number {
  return a.angleTo(b) * SURFACES[body].radiusKm;
}

/** Position sur la carte plate (équirectangulaire) : x, y entre 0 et 1. */
export function mapXY(v: THREE.Vector3): [number, number] {
  const lat = Math.asin(THREE.MathUtils.clamp(v.y / v.length(), -1, 1));
  // Inverse de latLonToVector3 : phi = lon + 180°, x = −cos φ, z = sin φ.
  const phi = Math.atan2(v.z, -v.x);
  let lon = (phi * 180) / Math.PI - 180;
  if (lon < -180) lon += 360;
  return [(lon + 180) / 360, (90 - (lat * 180) / Math.PI) / 180];
}

/** Direction (globe unité) depuis une position de la carte plate. */
export function fromMapXY(x: number, y: number): THREE.Vector3 {
  return latLonToVector3(90 - y * 180, x * 360 - 180, 1);
}

export const isSurfaceBody = (b: string | null | undefined): b is SurfaceBody => b === 'moon' || b === 'mars';
