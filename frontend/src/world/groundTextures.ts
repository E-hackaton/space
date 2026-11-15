import * as THREE from 'three';
import { heightToNormal } from './anatomy/surfaces';

/*
 * Détail du sol, généré dans le navigateur (aucun fichier) : une tuile de 512 px répétée tous les
 * quelques mètres. Couleur (multipliée par les teintes du terrain) et relief (carte de normales).
 * - régolithe (Lune) : poudre grise, grains clairs et sombres, petites cuvettes d'impact ;
 * - sable (Mars) : poussière fine, graviers et cailloux plus sombres.
 */

export type GroundDetail = 'regolith' | 'sand';

const cache = new Map<GroundDetail, { map: THREE.Texture; normal: THREE.Texture }>();

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export function groundTextures(kind: GroundDetail) {
  const hit = cache.get(kind);
  if (hit) return hit;
  const n = 512;
  const r = rng(kind === 'regolith' ? 21 : 33);
  const h = new Float32Array(n * n);
  const wrap = (v: number) => ((v % n) + n) % n;
  // Relief de fond : bosses douces à plusieurs échelles (tuilable).
  for (const [count, rad, amp] of [[40, 60, 0.25], [220, 18, 0.15], [1800, 4, 0.06]] as const)
    for (let i = 0; i < count; i++) {
      const cx = r() * n;
      const cy = r() * n;
      const a = (r() - 0.5) * 2 * amp;
      for (let dy = -rad; dy <= rad; dy++)
        for (let dx = -rad; dx <= rad; dx++) {
          const d = (dx * dx + dy * dy) / (rad * rad);
          if (d > 1) continue;
          h[wrap(cy + dy) * n + wrap(cx + dx)] += a * (1 - d) * (1 - d);
        }
    }
  // Petites cuvettes (impacts sur la Lune, creux sur Mars), avec un léger rebord.
  const pits = kind === 'regolith' ? 70 : 25;
  for (let i = 0; i < pits; i++) {
    const cx = r() * n;
    const cy = r() * n;
    const rad = 4 + Math.pow(r(), 2) * 22;
    for (let dy = -rad * 1.4; dy <= rad * 1.4; dy++)
      for (let dx = -rad * 1.4; dx <= rad * 1.4; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy) / rad;
        const idx = wrap(Math.round(cy + dy)) * n + wrap(Math.round(cx + dx));
        if (d < 1) h[idx] -= (1 - d * d) * 0.5;
        else if (d < 1.4) h[idx] += Math.sin(((d - 1) / 0.4) * Math.PI) * 0.12;
      }
  }
  // Couleur : suit le relief (creux plus sombres), plus des grains clairs et sombres.
  const cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    let v = 0.86 + h[i] * 0.35 + (r() - 0.5) * 0.08;
    const grain = r();
    if (grain > 0.985) v += 0.18; // grain clair
    else if (grain < (kind === 'sand' ? 0.03 : 0.015)) v -= 0.25; // gravier sombre
    v = Math.max(0.35, Math.min(1, v));
    const warm = kind === 'sand' ? 1 : 0;
    img.data[i * 4] = v * 255;
    img.data[i * 4 + 1] = v * (255 - warm * 12);
    img.data[i * 4 + 2] = v * (255 - warm * 22);
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const map = new THREE.CanvasTexture(cv);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  for (let i = 0; i < n * n; i++) h[i] += (r() - 0.5) * 0.04; // micro-grain dans le relief
  const normal = heightToNormal(h, n, kind === 'regolith' ? 3 : 2);
  const out = { map, normal };
  cache.set(kind, out);
  return out;
}
