import { craters, fbm } from './noise';

/** Un champ de hauteur continu : le sol sur lequel on roule. */
export interface HeightField {
  /** Demi-taille du monde (unités de scène). */
  half: number;
  heightAt(x: number, z: number): number;
}

/** Données d'un site martien (produites par scripts/build_traverses.py à partir des données NASA/JPL). */
export interface SiteData {
  id: string;
  origin: { lon: number; lat: number };
  paths: Record<string, [number, number, number, number][]>;
  flights: Record<string, { flight: number; sol: number; x: number; z: number; alt: number; maxAlt: number; date: string }[]>;
  terrain: { bounds: [number, number, number, number]; size: number; heights: number[][] };
}

/** Échelle des sites martiens : 1 unité de scène = 40 m (les engins, eux, sont agrandis). */
export const SITE_SCALE = 40;

/** Terrain d'un site : altitude réelle lissée autour des trajets + petit relief décoratif. */
export function siteField(data: SiteData): HeightField & { alt0: number; toWorld: (x: number, z: number) => [number, number] } {
  const { bounds, size, heights } = data.terrain;
  const [x0, z0, x1, z1] = bounds;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const half = (x1 - x0) / 2 / SITE_SCALE;
  // Altitude de référence : le point de départ du premier trajet.
  const firstPath = Object.values(data.paths)[0];
  const alt0 = firstPath[0][2];
  const sample = (mx: number, mz: number) => {
    const u = Math.min(size - 1.001, Math.max(0, ((mx - x0) / (x1 - x0)) * (size - 1)));
    const v = Math.min(size - 1.001, Math.max(0, ((mz - z0) / (z1 - z0)) * (size - 1)));
    const i = Math.floor(u);
    const j = Math.floor(v);
    const fu = u - i;
    const fv = v - j;
    const h00 = heights[j][i];
    const h10 = heights[j][i + 1];
    const h01 = heights[j + 1][i];
    const h11 = heights[j + 1][i + 1];
    return h00 * (1 - fu) * (1 - fv) + h10 * fu * (1 - fv) + h01 * (1 - fu) * fv + h11 * fu * fv;
  };
  return {
    half,
    alt0,
    /** Mètres locaux (NASA) → coordonnées de scène. */
    toWorld: (mx, mz) => [(mx - cx) / SITE_SCALE, (mz - cz) / SITE_SCALE],
    heightAt(x, z) {
      const mx = x * SITE_SCALE + cx;
      const mz = z * SITE_SCALE + cz;
      const real = (sample(mx, mz) - alt0) / SITE_SCALE;
      const detail = fbm(x * 0.05, z * 0.05) * 1.2 + fbm(x * 0.3, z * 0.3, 2) * 0.12 + craters(x, z, 36, 3) * 0.6;
      return real + detail;
    },
  };
}

/** Terre : une île plate (on y roule avant de décoller). */
export function earthField(): HeightField {
  return {
    half: 90,
    heightAt(x, z) {
      const r = Math.hypot(x, z);
      const island = r < 62 ? 0 : -Math.pow((r - 62) / 10, 2);
      const bumps = fbm(x * 0.04, z * 0.04) * 0.8 * Math.max(0, 1 - Math.hypot(x - 0, z - 0) / 70);
      // Pas de tir bien plat.
      const pad = Math.hypot(x - 22, z + 18) < 9 ? 0 : bumps;
      return Math.max(-4, island + pad);
    },
  };
}

/** Lune (site d'Apollo 11) : 1 unité = 1 m, cratères et régolithe. */
export function moonField(): HeightField {
  return {
    half: 110,
    heightAt(x, z) {
      const quiet = Math.min(1, Math.hypot(x, z) / 25); // le site d'alunissage est assez plat
      return (fbm(x * 0.025, z * 0.025, 3) * 2 + craters(x, z, 22, 7) * 1.3) * quiet;
    },
  };
}
