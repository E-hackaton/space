import * as THREE from 'three';

/** Dégradé en 3 paliers : donne l'éclairage en aplats « dessin animé ». */
let gradient: THREE.DataTexture | null = null;
export function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

const cache = new Map<string, THREE.MeshToonMaterial>();

/** Matériau « toon » partagé pour une couleur donnée. */
export function toon(color: string, opts: { emissive?: string; flat?: boolean } = {}): THREE.MeshToonMaterial {
  // « flat » : les polyèdres simples (rochers, feuillages) ont déjà des normales par face.
  const key = `${color}|${opts.emissive ?? ''}|${opts.flat ? 1 : 0}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: toonGradient() });
    if (opts.emissive) {
      m.emissive = new THREE.Color(opts.emissive);
      m.emissiveIntensity = 1.2;
    }
    cache.set(key, m);
  }
  return m;
}

/** Palettes des mondes : couleurs logiques (Mars rouille, Lune grise, Terre verte). */
export const PALETTES = {
  earth: { sky: '#1b1f4a', fog: '#2b2f66', ground: ['#3d8a45', '#56a64f', '#78c05c'], sand: '#e8c98a', water: '#2f7fd1', rock: '#8b8f99' },
  mars: { sky: '#d9a066', fog: '#d39a63', ground: ['#74321a', '#b4582f', '#dd9058'], rock: '#7a3a22', track: '#6b2e18' },
  moon: { sky: '#05060d', fog: '#05060d', ground: ['#5d6066', '#7a7e85', '#979ba2'], rock: '#4d5157', track: '#3f4247' },
} as const;
