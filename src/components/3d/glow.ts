import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

/** Texture de halo radial générée à la volée (pas de fichier à télécharger). */
export function glowTexture(color: string): THREE.Texture {
  const hit = cache.get(color);
  if (hit) return hit;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.2, color + 'cc');
  g.addColorStop(0.5, color + '33');
  g.addColorStop(1, color + '00');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(color, tex);
  return tex;
}
