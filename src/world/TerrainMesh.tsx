import { useMemo } from 'react';
import * as THREE from 'three';
import { toonGradient } from './toon';
import { fbm } from './noise';
import type { HeightField } from './terrain';

interface Props {
  field: HeightField;
  /** Trois teintes du bas vers le haut (couleurs logiques du monde). */
  colors: readonly [string, string, string] | readonly string[];
  segments?: number;
}

/** Sol en aplats de couleur (ombrage toon + facettes), teinté selon l'altitude et la pente. */
export function TerrainMesh({ field, colors, segments = 180 }: Props) {
  const geometry = useMemo(() => {
    const size = field.half * 2;
    const plane = new THREE.PlaneGeometry(size, size, segments, segments);
    plane.rotateX(-Math.PI / 2);
    // Sommets non partagés : chaque triangle a sa propre normale, d'où l'aspect à facettes.
    const g = plane.toNonIndexed();
    plane.dispose();
    const pos = g.attributes.position as THREE.BufferAttribute;
    let lo = Infinity;
    let hi = -Infinity;
    const hs = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const h = field.heightAt(pos.getX(i), pos.getZ(i));
      hs[i] = h;
      lo = Math.min(lo, h);
      hi = Math.max(hi, h);
      pos.setY(i, h);
    }
    g.computeVertexNormals();
    const nrm = g.attributes.normal as THREE.BufferAttribute;
    const c = colors.map((x) => new THREE.Color(x));
    const col = new Float32Array(pos.count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = (hs[i] - lo) / Math.max(1e-6, hi - lo);
      const steep = 1 - nrm.getY(i); // pentes plus sombres
      tmp.copy(c[0]).lerp(c[1], Math.min(1, t * 2)).lerp(c[2], Math.max(0, t * 2 - 1));
      // Taches de couleur (sol plus vivant) et pentes plus sombres.
      const patch = fbm(pos.getX(i) * 0.03 + 11, pos.getZ(i) * 0.03 - 7, 3);
      tmp.offsetHSL(0, 0, patch * 0.08);
      tmp.multiplyScalar(1 - Math.min(0.45, steep * 2.2));
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [field, colors, segments]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshToonMaterial vertexColors gradientMap={toonGradient()} />
    </mesh>
  );
}
