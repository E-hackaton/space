import { craters, fbm } from './noise';
import type { HeightField } from './terrain';
import type { MachineSummary } from '../lib/machines';
import type { SurfaceBody } from '../lib/atlas';

/*
 * Terrain d'expédition : toutes les machines d'un astre sur un même sol, où l'on roule de l'une à l'autre.
 * Chaque machine est placée d'après sa vraie latitude et longitude (est = +x, nord = −z), avec une
 * même échelle réduite pour tout l'astre : l'agencement réel est respecté, pas les distances.
 */

export const EXPEDITION_HALF = 300;
/** Écart minimal entre deux sites voisins (m de scène), pour que chacun reste visible. */
const MIN_GAP = 26;
/** Rayon aplani autour de chaque machine. */
export const SITE_FLAT = 14;

export interface Site {
  machine: MachineSummary;
  x: number;
  z: number;
  /** Position écartée de sa vraie place relative (sites voisins). */
  nudged: boolean;
}

export function layoutSites(machines: MachineSummary[], body: SurfaceBody): { sites: Site[]; metresPerDegree: number } {
  const list = machines.filter((m) => m.body === body && m.lat !== undefined && m.lon !== undefined);
  if (!list.length) return { sites: [], metresPerDegree: 1 };
  const lons = list.map((m) => m.lon!);
  const lats = list.map((m) => m.lat!);
  const lonC = (Math.min(...lons) + Math.max(...lons)) / 2;
  const latC = (Math.min(...lats) + Math.max(...lats)) / 2;
  const span = EXPEDITION_HALF * 2 * 0.72;
  const k = Math.min(14, span / Math.max(1, Math.max(...lons) - Math.min(...lons)), span / Math.max(1, Math.max(...lats) - Math.min(...lats)));
  const sites: Site[] = list.map((m) => ({ machine: m, x: (m.lon! - lonC) * k, z: -(m.lat! - latC) * k, nudged: false }));
  // Écarte les sites trop proches (relaxation simple, déterministe).
  for (let it = 0; it < 60; it++) {
    let moved = false;
    for (let i = 0; i < sites.length; i++)
      for (let j = i + 1; j < sites.length; j++) {
        const a = sites[i];
        const b = sites[j];
        let dx = b.x - a.x;
        let dz = b.z - a.z;
        let d = Math.hypot(dx, dz);
        if (d >= MIN_GAP) continue;
        if (d < 1e-3) {
          dx = Math.cos(i + j);
          dz = Math.sin(i + j);
          d = 1;
        }
        const push = (MIN_GAP - d) / 2;
        a.x -= (dx / d) * push;
        a.z -= (dz / d) * push;
        b.x += (dx / d) * push;
        b.z += (dz / d) * push;
        a.nudged = b.nudged = moved = true;
      }
    if (!moved) break;
  }
  return { sites, metresPerDegree: k };
}

/** Sol de l'expédition : régolithe cratérisé (Lune) ou plaines et dunes (Mars), aplani autour des machines. */
export function expeditionField(body: SurfaceBody, sites: Site[]): HeightField {
  const flat = (x: number, z: number) => {
    let f = 1;
    for (const s of sites) {
      const d = Math.hypot(x - s.x, z - s.z);
      if (d < SITE_FLAT * 1.8) f = Math.min(f, Math.max(0, (d - SITE_FLAT) / (SITE_FLAT * 0.8)));
    }
    return f;
  };
  return {
    half: EXPEDITION_HALF,
    heightAt(x, z) {
      const edge = Math.max(0, Math.hypot(x, z) - EXPEDITION_HALF * 0.85) * 0.25;
      const base =
        body === 'moon'
          ? fbm(x * 0.012, z * 0.012, 4) * 6 + craters(x, z, 34, 11) * 2.2 + craters(x, z, 90, 5) * 4 + craters(x, z, 13, 21) * 0.7 + fbm(x * 0.2, z * 0.2, 2) * 0.25
          : fbm(x * 0.008, z * 0.008, 4) * 9 +
            Math.sin(x * 0.05 + fbm(x * 0.02, z * 0.02) * 4) * 0.8 + // rides de sable
            craters(x, z, 120, 3) * 4 +
            craters(x, z, 42, 13) * 2.6 +
            craters(x, z, 15, 29) * 1.1 + // petits trous d'impact
            fbm(x * 0.17, z * 0.17, 3) * 0.55 + // sol rocailleux
            fbm(x * 0.6, z * 0.6, 2) * 0.08;
      return base * (0.25 + 0.75 * flat(x, z)) + edge;
    },
  };
}

/** Taille d'affichage de chaque machine (plus grande dimension, m). Les petites sont un peu agrandies. */
const SIZE: Record<string, number> = {
  'apollo-11-eagle': 9,
  'apollo-15-lrv': 3.1,
  'apollo-15-retroreflector': 1.4,
  'surveyor-3': 3.3,
  'viking-1': 3,
  sojourner: 1.4,
  opportunity: 2.4,
  curiosity: 3,
  perseverance: 3,
  ingenuity: 1.4,
  insight: 6,
};
export const sizeOf = (id: string) => SIZE[id] ?? 3;

/** Distance (m) sous laquelle une machine est « trouvée ». */
export const FIND_DIST = 16;
