import * as THREE from 'three';

const cache = new Map<string, THREE.Material>();

/** Matériau lisse partagé (éclairage physique, reflets doux). */
export function smooth(color: string, o: { rough?: number; metal?: number; emissive?: string; glow?: number; clearcoat?: number; opacity?: number } = {}): THREE.MeshPhysicalMaterial {
  const key = JSON.stringify([color, o]);
  let m = cache.get(key) as THREE.MeshPhysicalMaterial | undefined;
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: o.rough ?? 0.55,
      metalness: o.metal ?? 0,
      clearcoat: o.clearcoat ?? 0,
      clearcoatRoughness: 0.3,
    });
    if (o.emissive) {
      m.emissive = new THREE.Color(o.emissive);
      m.emissiveIntensity = o.glow ?? 2;
    }
    if (o.opacity !== undefined) {
      m.transparent = true;
      m.opacity = o.opacity;
    }
    cache.set(key, m);
  }
  return m;
}
