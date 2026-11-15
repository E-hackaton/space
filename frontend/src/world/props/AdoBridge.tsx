import { useMemo } from 'react';
import * as THREE from 'three';
import { smooth } from '../materials';

/*
 * Le pont Alassane-Ouattara (Abidjan), évoqué en 3D au-dessus de l'eau qui entoure l'île :
 * un pont à haubans avec un seul grand pylône blanc incliné, deux nappes de câbles en éventail
 * et un long tablier sur piles. Silhouette fidèle à la photo, pas une maquette à l'échelle :
 * aucune cote n'est affichée.
 *
 * Repère : tablier le long de x, centre à l'origine, surface de l'eau à y = 0.
 */

const L = 170; // longueur du tablier
const W = 13; // largeur
const DECK_Y = 7; // hauteur du tablier au-dessus de l'eau
const PYLON_X = -L * 0.18; // pied du pylône
const PYLON_H = 62; // hauteur du pylône
const LEAN = 0.24; // inclinaison vers l'arrière (rad)

/** Matériaux propres au pont, sans brume : il reste net au large. */
const noFog = (m: THREE.MeshPhysicalMaterial) => {
  const c = m.clone();
  c.fog = false;
  return c;
};
const MATS = {
  concrete: noFog(smooth('#f2f1ec', { rough: 0.55, clearcoat: 0.2 })),
  road: noFog(smooth('#4a4d55', { rough: 0.9 })),
  steel: noFog(smooth('#e8eaee', { metal: 0.6, rough: 0.3 })),
  paint: noFog(smooth('#f4f1e6', { rough: 0.6 })),
};
const concrete = () => MATS.concrete;
const road = () => MATS.road;
const steel = () => MATS.steel;

/** Un câble (cylindre fin) entre deux points. */
function cable(a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const dir = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r, r, dir.length(), 5, 1, true);
  g.translate(0, dir.length() / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}

export function AdoBridge() {
  // Haubans : de la tête du pylône vers les bords du tablier (avant), et vers l'ancrage (arrière).
  const cables = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const top = (k: number) => new THREE.Vector3(PYLON_X - Math.sin(LEAN) * PYLON_H * k, DECK_Y + Math.cos(LEAN) * PYLON_H * k, 0);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 14; i++) {
        const k = 0.55 + (i / 13) * 0.42;
        const anchor = top(k).add(new THREE.Vector3(0, 0, side * 0.9));
        const deckX = PYLON_X + 12 + i * ((L / 2 - PYLON_X - 18) / 13);
        geos.push(cable(anchor, new THREE.Vector3(deckX, DECK_Y + 0.6, side * (W / 2 - 0.4)), 0.09));
      }
      for (let i = 0; i < 6; i++) {
        const k = 0.6 + (i / 5) * 0.35;
        const anchor = top(k).add(new THREE.Vector3(0, 0, side * 0.9));
        geos.push(cable(anchor, new THREE.Vector3(PYLON_X - 14 - i * 4, DECK_Y + 0.6, side * 2.4), 0.12));
      }
    }
    const merged = mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    return merged;
  }, []);

  // Pylône : un fût effilé, incliné vers l'arrière, d'une seule pièce.
  const pylon = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.9, 2.6, PYLON_H, 6, 8);
    g.scale(1, 1, 0.75);
    g.translate(0, PYLON_H / 2, 0);
    return g;
  }, []);

  const piers = useMemo(() => {
    const xs: number[] = [];
    for (let x = -L / 2 + 6; x <= L / 2 - 6; x += 22) if (Math.abs(x - PYLON_X) > 8) xs.push(x);
    return xs;
  }, []);

  return (
    <group>
      {/* Tablier : caisson, chaussée en deux sens, terre-plein et trottoirs */}
      <mesh position={[0, DECK_Y - 0.9, 0]} material={concrete()} castShadow receiveShadow>
        <boxGeometry args={[L, 1.6, W]} />
      </mesh>
      <mesh position={[0, DECK_Y + 0.02, 0]} material={road()} receiveShadow>
        <boxGeometry args={[L, 0.08, W - 2.4]} />
      </mesh>
      <mesh position={[0, DECK_Y + 0.15, 0]} material={concrete()}>
        <boxGeometry args={[L, 0.3, 1.2]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh position={[0, DECK_Y + 0.55, sd * (W / 2 - 0.15)]} material={steel()}>
            <boxGeometry args={[L, 0.9, 0.12]} />
          </mesh>
          {/* lignes de marquage */}
          <mesh position={[0, DECK_Y + 0.07, sd * 2.6]} material={MATS.paint}>
            <boxGeometry args={[L, 0.02, 0.12]} />
          </mesh>
        </group>
      ))}
      {/* Lampadaires */}
      {Array.from({ length: 12 }, (_, i) => -L / 2 + 8 + i * ((L - 16) / 11)).map((x) => (
        <mesh key={x} position={[x, DECK_Y + 2.5, 0]} material={steel()}>
          <cylinderGeometry args={[0.07, 0.09, 5, 6]} />
        </mesh>
      ))}
      {/* Piles dans l'eau */}
      {piers.map((x) => (
        <mesh key={x} position={[x, (DECK_Y - 1.7) / 2 - 3, 0]} material={concrete()} castShadow>
          <cylinderGeometry args={[1.3, 1.6, DECK_Y - 1.7 + 6, 16]} />
        </mesh>
      ))}
      {/* Pied du pylône et pylône incliné */}
      <mesh position={[PYLON_X, (DECK_Y - 1.7) / 2 - 3, 0]} material={concrete()} castShadow>
        <boxGeometry args={[7, DECK_Y + 4.3, W + 2]} />
      </mesh>
      <mesh geometry={pylon} position={[PYLON_X, DECK_Y, 0]} rotation={[0, 0, LEAN]} material={concrete()} castShadow />
      {/* Haubans */}
      <mesh geometry={cables} material={steel()} />
    </group>
  );
}

/** Fusionne des géométries non indexées de mêmes attributs (position, normale, uv). */
function mergeGeometries(geos: THREE.BufferGeometry[]) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const count = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal'] as const) {
    const arr = new Float32Array(count * 3);
    let o = 0;
    for (const g of parts) {
      arr.set(g.attributes[name].array as Float32Array, o);
      o += g.attributes[name].count * 3;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, 3));
  }
  return out;
}
