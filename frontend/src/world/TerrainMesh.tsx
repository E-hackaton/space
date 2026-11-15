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
  /** Taille d'une répétition de la texture (unités de scène). */
  tile?: number;
  /** Demi-taille du maillage (par défaut celle du terrain). */
  extent?: number;
  /** Grille resserrée au centre et lâche au loin (pour le sol qui file jusqu'à l'horizon). */
  warp?: boolean;
  /** Zone carrée creusée (cachée sous un autre maillage plus fin). */
  holeHalf?: number;
  /** Plage d'altitudes des teintes, commune à plusieurs maillages pour qu'ils se raccordent. */
  range?: [number, number];
}

/** Altitudes minimale et maximale d'un terrain (échantillonnées), pour accorder les teintes. */
export function heightRange(field: HeightField, half: number): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (let j = 0; j <= 48; j++)
    for (let i = 0; i <= 48; i++) {
      const h = field.heightAt(-half + (i / 48) * 2 * half, -half + (j / 48) * 2 * half);
      lo = Math.min(lo, h);
      hi = Math.max(hi, h);
    }
  return [lo, hi];
}

/** Sol lisse, teinté selon l'altitude et la pente, avec des taches de couleur. */
export function TerrainMesh({ field, colors, segments = 180, detail, tile = 6, extent, warp = false, holeHalf, range }: Props) {
  const half = extent ?? field.half;
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(2, 2, segments, segments);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    // Coordonnées de grille [-1, 1] → monde ; avec `warp`, les mailles grandissent vers le bord.
    const map = (u: number) => (warp ? Math.sign(u) * u * u : u) * half;
    const hs = new Float32Array(pos.count);
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const x = map(pos.getX(i));
      const z = map(pos.getZ(i));
      let h = field.heightAt(x, z);
      if (holeHalf && Math.abs(x) < holeHalf && Math.abs(z) < holeHalf) h -= 3; // caché sous le terrain fin
      pos.setXYZ(i, x, h, z);
      hs[i] = h;
      lo = Math.min(lo, h);
      hi = Math.max(hi, h);
    }
    if (range) [lo, hi] = range;
    g.computeVertexNormals();
    // Texture calée sur le sol (et pas sur la grille) : elle se raccorde d'un maillage à l'autre.
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / tile, pos.getZ(i) / tile);
    const nrm = g.attributes.normal as THREE.BufferAttribute;
    const c = colors.map((x) => new THREE.Color(x));
    const col = new Float32Array(pos.count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = THREE.MathUtils.clamp((hs[i] - lo) / Math.max(1e-6, hi - lo), 0, 1);
      const steep = 1 - nrm.getY(i); // pentes plus sombres
      tmp.copy(c[0]).lerp(c[1], Math.min(1, t * 2)).lerp(c[2], Math.max(0, t * 2 - 1));
      // Taches de couleur (sol plus vivant) et pentes plus sombres.
      const patch = fbm(pos.getX(i) * 0.03 + 11, pos.getZ(i) * 0.03 - 7, 3);
      tmp.offsetHSL(0, 0, patch * 0.1);
      tmp.multiplyScalar(1 - Math.min(0.45, steep * 2.2));
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeBoundingSphere();
    return g;
  }, [field, colors, segments, half, warp, holeHalf, tile, range]);

  const tex = useMemo(() => (detail ? groundTextures(detail) : null), [detail]);
  const normalScale = useMemo(() => new THREE.Vector2(0.9, 0.9), []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0} map={tex?.map ?? null} normalMap={tex?.normal ?? null} normalScale={normalScale} />
    </mesh>
  );
}
