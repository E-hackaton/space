import { useMemo } from 'react';
import * as THREE from 'three';
import { fbm } from './noise';
import type { HeightField } from './terrain';
import { groundTextures, type GroundDetail } from './groundTextures';

interface Props {
  field: HeightField;
  /** Trois teintes du bas vers le haut (couleurs logiques du monde). */
  colors: readonly [string, string, string] | readonly string[];
  segments?: number;
  /** Détail du sol (texture de près) : régolithe lunaire ou sable martien. */
  detail?: GroundDetail;
  /** Taille d'une répétition de la texture (m). */
  tile?: number;
}

/** Sol lisse, teinté selon l'altitude et la pente, avec des taches de couleur. */
export function TerrainMesh({ field, colors, segments = 180, detail, tile = 6 }: Props) {
  const geometry = useMemo(() => {
    const size = field.half * 2;
    const g = new THREE.PlaneGeometry(size, size, segments, segments);
    g.rotateX(-Math.PI / 2);
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
      tmp.offsetHSL(0, 0, patch * 0.1);
      tmp.multiplyScalar(1 - Math.min(0.45, steep * 2.2));
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [field, colors, segments]);

  const tex = useMemo(() => {
    if (!detail) return null;
    const { map, normal } = groundTextures(detail);
    const rep = (field.half * 2) / tile;
    const m = map.clone();
    const nm = normal.clone();
    for (const t of [m, nm]) {
      t.repeat.set(rep, rep);
      t.needsUpdate = true;
    }
    return { map: m, normal: nm };
  }, [detail, tile, field.half]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0} map={tex?.map ?? null} normalMap={tex?.normal ?? null} normalScale={new THREE.Vector2(0.9, 0.9)} />
    </mesh>
  );
}
