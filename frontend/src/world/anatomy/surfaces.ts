import * as THREE from 'three';

/*
 * Matières réalistes des machines dessinées pièce par pièce, générées dans le navigateur
 * (aucun fichier à télécharger) : feuille d'or isolante froissée, peinture, métal brossé.
 * Les cartes sont des cartes de relief (normal maps), répétées tous les ~50 cm.
 */

const cache = new Map<string, THREE.Texture>();

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

/** Convertit une carte de hauteur (0..1) en carte de normales. */
export function heightToNormal(h: Float32Array, n: number, strength: number) {
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const at = (i: number, j: number) => h[((j + n) % n) * n + ((i + n) % n)];
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const v = new THREE.Vector3(-dx, -dy, 1).normalize();
      const o = (y * n + x) * 4;
      data[o] = (v.x * 0.5 + 0.5) * 255;
      data[o + 1] = (v.y * 0.5 + 0.5) * 255;
      data[o + 2] = (v.z * 0.5 + 0.5) * 255;
      data[o + 3] = 255;
    }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** Feuille froissée : des facettes planes d'inclinaisons variées (cellules de Voronoï). */
export function foilNormal(): THREE.Texture {
  const hit = cache.get('foil');
  if (hit) return hit;
  const n = 256;
  const r = rng(7);
  const seeds = Array.from({ length: 90 }, () => [r() * n, r() * n, (r() - 0.5) * 2, (r() - 0.5) * 2, r()]);
  const h = new Float32Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < seeds.length; i++) {
        let dx = Math.abs(x - seeds[i][0]);
        let dy = Math.abs(y - seeds[i][1]);
        dx = Math.min(dx, n - dx);
        dy = Math.min(dy, n - dy);
        const d = dx * dx + dy * dy;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      const s = seeds[best];
      h[y * n + x] = s[4] + ((x - s[0]) * s[2] + (y - s[1]) * s[3]) * 0.02;
    }
  const t = heightToNormal(h, n, 2.2);
  cache.set('foil', t);
  return t;
}

/** Grain fin (peinture) ou brossage (métal) : bruit, étiré dans une direction pour le métal. */
export function grainNormal(brushed: boolean): THREE.Texture {
  const key = brushed ? 'brushed' : 'grain';
  const hit = cache.get(key);
  if (hit) return hit;
  const n = 256;
  const r = rng(brushed ? 3 : 5);
  const h = new Float32Array(n * n);
  if (brushed) {
    for (let y = 0; y < n; y++) {
      const row = r();
      for (let x = 0; x < n; x++) h[y * n + x] = row * 0.6 + r() * 0.15;
    }
  } else for (let i = 0; i < n * n; i++) h[i] = r();
  const t = heightToNormal(h, n, brushed ? 0.6 : 0.35);
  cache.set(key, t);
  return t;
}

/** Coordonnées de texture par projection sur la face dominante (cubique). `scale` : répétitions par unité. */
export function boxUVs(g: THREE.BufferGeometry, scale: number) {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nor = g.attributes.normal as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    const [u, v] = ax >= ay && ax >= az ? [pos.getZ(i), pos.getY(i)] : ay >= az ? [pos.getX(i), pos.getZ(i)] : [pos.getX(i), pos.getY(i)];
    uv[i * 2] = u * scale;
    uv[i * 2 + 1] = v * scale;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
