import { craters, fbm } from './noise';
import type { HeightField } from './terrain';

/*
 * Sol sans limite visible : le terrain détaillé se prolonge jusqu'à l'horizon par un relief lointain
 * (grandes ondulations et cratères), avec un raccord progressif au bord du terrain détaillé.
 */

export interface FarRelief {
  /** Amplitude des ondulations (unités de scène). */
  amp: number;
  /** Fréquence des ondulations (1 / unités de scène). */
  freq: number;
  /** Taille des cellules de cratères (unités de scène). */
  craterCell: number;
  /** Demi-taille de la zone où l'on peut rouler (unités de scène). */
  roam: number;
  seed?: number;
}

export interface InfiniteField extends HeightField {
  /** Le terrain détaillé d'origine. */
  inner: HeightField;
}

/** Le terrain prolongé garde toutes les propriétés de l'original (ex. `toWorld` des sites martiens). */
export function extendField<T extends HeightField>(inner: T, r: FarRelief): T & InfiniteField {
  const seed = r.seed ?? 7;
  // Altitude moyenne au bord du terrain détaillé : le sol lointain s'y accroche.
  let sum = 0;
  let n = 0;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    sum += inner.heightAt(Math.cos(a) * inner.half * 0.9, Math.sin(a) * inner.half * 0.9);
    n++;
  }
  const base = sum / n;
  const far = (x: number, z: number) =>
    base + fbm(x * r.freq, z * r.freq, 4) * r.amp + craters(x, z, r.craterCell, seed) * (r.amp / 6) + craters(x, z, r.craterCell * 0.3, seed + 5) * (r.amp / 14);
  const start = inner.half * 0.72;
  return {
    ...inner,
    inner,
    half: r.roam,
    heightAt(x, z) {
      const d = Math.max(Math.abs(x), Math.abs(z));
      if (d <= start) return inner.heightAt(x, z);
      if (d >= inner.half) return far(x, z);
      const t = (d - start) / (inner.half - start);
      const s = t * t * (3 - 2 * t);
      return inner.heightAt(x, z) * (1 - s) + far(x, z) * s;
    },
  };
}
