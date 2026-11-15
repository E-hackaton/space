import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { PartPins, partHandlers, useHighlight, type PartDef } from '../../components/3d/InteractiveParts';
import { foilNormal, grainNormal } from '../anatomy/surfaces';

/*
 * Sojourner (Mars Pathfinder, 1997), modélisé par l'équipe d'après le schéma NASA annoté
 * (docs/mars1/sources/03-sojourner.jpeg) : la NASA ne publie pas de modèle 3D de ce rover.
 * Pièces du schéma : panneau solaire, boîte électronique chaude, suspension rocker-bogie (6 roues),
 * spectromètre APXS, caméras et lasers, antenne, expérience d'adhérence des matériaux (MAE).
 * Ordres de grandeur seulement (mètres) ; avant du rover vers +x.
 */

const L = 0.65;
const W = 0.48;
const WHEEL_R = 0.065;
const WHEEL_W = 0.07;

/** Cellules solaires : grille bleu nuit aux fins liserés argentés (texture générée). */
let cellsTex: THREE.Texture | null = null;
function cells() {
  if (cellsTex) return cellsTex;
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 192;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#c9cdd4';
  g.fillRect(0, 0, 256, 192);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 12; x++) {
      const shade = 18 + ((x * 7 + y * 3) % 5) * 4;
      g.fillStyle = `rgb(${shade},${shade + 18},${shade + 70})`;
      g.fillRect(x * 21 + 2, y * 24 + 2, 18, 21);
    }
  cellsTex = new THREE.CanvasTexture(cv);
  cellsTex.colorSpace = THREE.SRGBColorSpace;
  return cellsTex;
}

const MAT = {
  panel: () => new THREE.MeshPhysicalMaterial({ map: cells(), metalness: 0.4, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
  frame: () => new THREE.MeshPhysicalMaterial({ color: '#d7dade', metalness: 0.85, roughness: 0.3, normalMap: grainNormal(true), normalScale: new THREE.Vector2(0.3, 0.3) }),
  gold: () => new THREE.MeshPhysicalMaterial({ color: '#d8b25a', metalness: 0.9, roughness: 0.3, normalMap: foilNormal(), normalScale: new THREE.Vector2(0.6, 0.6) }),
  alu: () => new THREE.MeshPhysicalMaterial({ color: '#b8bdc4', metalness: 0.85, roughness: 0.35, normalMap: grainNormal(true), normalScale: new THREE.Vector2(0.3, 0.3) }),
  dark: () => new THREE.MeshPhysicalMaterial({ color: '#25282e', metalness: 0.5, roughness: 0.45 }),
  lens: () => new THREE.MeshPhysicalMaterial({ color: '#0d1420', metalness: 0.2, roughness: 0.05, clearcoat: 1 }),
};

/** Roue crantée : jante et crampons (comme les roues en aluminium du schéma). */
function Wheel({ mat }: { mat: THREE.Material }) {
  const cleats = useMemo(() => Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2), []);
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh material={mat} castShadow>
        <cylinderGeometry args={[WHEEL_R * 0.92, WHEEL_R * 0.92, WHEEL_W, 24]} />
      </mesh>
      {cleats.map((a) => (
        <mesh key={a} position={[Math.cos(a) * WHEEL_R * 0.95, 0, Math.sin(a) * WHEEL_R * 0.95]} rotation={[0, -a, 0]} material={mat}>
          <boxGeometry args={[0.012, WHEEL_W * 0.95, 0.008]} />
        </mesh>
      ))}
      <mesh material={mat}>
        <cylinderGeometry args={[WHEEL_R * 0.35, WHEEL_R * 0.35, WHEEL_W * 1.05, 12]} />
      </mesh>
    </group>
  );
}

/** Barre ajourée (bras du rocker-bogie) entre deux points du plan latéral. */
function Link({ a, b, z, mat }: { a: [number, number]; b: [number, number]; z: number; mat: THREE.Material }) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const holes = Math.max(2, Math.floor(len / 0.04));
  return (
    <group position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} rotation={[0, 0, Math.atan2(dy, dx)]}>
      <RoundedBox args={[len, 0.03, 0.012]} radius={0.004} material={mat} castShadow />
      {Array.from({ length: holes }, (_, i) => (
        <mesh key={i} position={[-len / 2 + ((i + 0.5) * len) / holes, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT_SHARED.dark}>
          <cylinderGeometry args={[0.006, 0.006, 0.014, 10]} />
        </mesh>
      ))}
    </group>
  );
}

const MAT_SHARED = { dark: MAT.dark() };

export function Sojourner({ size, annotated = false }: { size?: number; annotated?: boolean }) {
  const { t } = useTranslation();
  const k = size ? size / L : 1;
  const group = useRef<THREE.Group>(null);
  const refs = {
    solar: useRef<THREE.Group>(null),
    web: useRef<THREE.Group>(null),
    rocker: useRef<THREE.Group>(null),
    apxs: useRef<THREE.Group>(null),
    cams: useRef<THREE.Group>(null),
    antenna: useRef<THREE.Group>(null),
    mae: useRef<THREE.Group>(null),
  };
  // Matériaux propres à cette instance : chaque pièce peut s'allumer seule au survol.
  const m = useMemo(() => ({ panel: MAT.panel(), frame: MAT.frame(), gold: MAT.gold(), alu: MAT.alu(), dark: MAT.dark(), lens: MAT.lens(), wheel: MAT.alu() }), []);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const wheelY = WHEEL_R;
  const wheels: [number, number][] = [
    [0.27, wheelY],
    [0.0, wheelY],
    [-0.27, wheelY],
  ];
  const zSide = W / 2 + 0.02;

  const parts = useMemo<PartDef[]>(() => {
    if (!ready || !annotated) return [];
    const meshesOf = (g: THREE.Group | null) => {
      const out: THREE.Mesh[] = [];
      g?.traverse((o) => (o as THREE.Mesh).isMesh && out.push(o as THREE.Mesh));
      return out;
    };
    const def = (key: keyof typeof refs, at: [number, number, number], reach: number): PartDef => ({
      key,
      name: t(`sojourner.${key}.name`),
      desc: t(`sojourner.${key}.desc`),
      anchors: [new THREE.Vector3(...at)],
      reach,
      zoom: Math.max(0.5, reach * 4 * k),
      meshes: meshesOf(refs[key].current),
    });
    return [
      def('solar', [0, 0.3, 0], 0.25),
      def('web', [0, 0.18, W / 2 - 0.08], 0.15),
      def('rocker', [0.1, 0.12, zSide], 0.15),
      def('apxs', [-L / 2 - 0.06, 0.15, -0.1], 0.08),
      def('cams', [L / 2 - 0.02, 0.2, 0], 0.08),
      def('antenna', [-0.12, 0.5, W / 2 - 0.06], 0.12),
      def('mae', [L / 2 - 0.07, 0.305, W / 2 - 0.07], 0.06),
    ];
  }, [ready, annotated, t, k]); // eslint-disable-line react-hooks/exhaustive-deps
  useHighlight(parts);
  const handlers = useMemo(() => (parts.length ? partHandlers(parts, group) : {}), [parts]);

  return (
    <group ref={group} scale={k} {...handlers}>
      {/* Panneau solaire */}
      <group ref={refs.solar}>
        <mesh position={[0, 0.29, 0]} material={m.panel} castShadow receiveShadow>
          <boxGeometry args={[L, 0.008, W]} />
        </mesh>
        <mesh position={[0, 0.283, 0]} material={m.frame}>
          <boxGeometry args={[L + 0.01, 0.006, W + 0.01]} />
        </mesh>
      </group>
      {/* Expérience d'adhérence des matériaux, au coin avant du panneau */}
      <group ref={refs.mae}>
        <RoundedBox args={[0.05, 0.01, 0.05]} radius={0.003} position={[L / 2 - 0.07, 0.298, W / 2 - 0.07]} material={m.frame} />
        <mesh position={[L / 2 - 0.07, 0.304, W / 2 - 0.07]} material={m.dark}>
          <boxGeometry args={[0.03, 0.003, 0.03]} />
        </mesh>
      </group>
      {/* Boîte électronique chaude */}
      <group ref={refs.web}>
        <RoundedBox args={[0.42, 0.13, 0.3]} radius={0.01} position={[0, 0.2, 0]} material={m.gold} castShadow receiveShadow />
        <mesh position={[0, 0.272, 0]} material={m.frame}>
          <boxGeometry args={[0.44, 0.014, 0.32]} />
        </mesh>
      </group>
      {/* Caméras et lasers, à l'avant */}
      <group ref={refs.cams}>
        <RoundedBox args={[0.05, 0.05, 0.12]} radius={0.006} position={[L / 2 - 0.08, 0.2, 0]} material={m.dark} castShadow />
        {[-0.03, 0.03].map((zz) => (
          <mesh key={zz} position={[L / 2 - 0.054, 0.205, zz]} rotation={[0, 0, Math.PI / 2]} material={m.lens}>
            <cylinderGeometry args={[0.009, 0.009, 0.006, 12]} />
          </mesh>
        ))}
      </group>
      {/* Spectromètre APXS, à l'arrière sur son support */}
      <group ref={refs.apxs}>
        <mesh position={[-L / 2 - 0.02, 0.18, -0.1]} rotation={[0, 0, 0.5]} material={m.alu}>
          <boxGeometry args={[0.09, 0.015, 0.02]} />
        </mesh>
        <mesh position={[-L / 2 - 0.065, 0.15, -0.1]} rotation={[0, 0, Math.PI / 2]} material={m.frame} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.05, 16]} />
        </mesh>
      </group>
      {/* Antenne fouet */}
      <group ref={refs.antenna}>
        <mesh position={[-0.12, 0.3, W / 2 - 0.06]} material={m.dark}>
          <cylinderGeometry args={[0.008, 0.01, 0.03, 10]} />
        </mesh>
        <mesh position={[-0.12, 0.47, W / 2 - 0.06]} material={m.alu}>
          <cylinderGeometry args={[0.002, 0.003, 0.34, 6]} />
        </mesh>
      </group>
      {/* Suspension rocker-bogie : de chaque côté, un rocker (roue avant) et un bogie (roues milieu et arrière) */}
      <group ref={refs.rocker}>
        {[-1, 1].map((side) => {
          const z = side * zSide;
          const pivot: [number, number] = [0.05, 0.18];
          const bogie: [number, number] = [-0.14, 0.12];
          return (
            <group key={side}>
              <Link a={pivot} b={[wheels[0][0], wheelY]} z={z} mat={m.alu} />
              <Link a={pivot} b={bogie} z={z} mat={m.alu} />
              <Link a={bogie} b={[wheels[1][0], wheelY]} z={z} mat={m.alu} />
              <Link a={bogie} b={[wheels[2][0], wheelY]} z={z} mat={m.alu} />
              {wheels.map(([x, y]) => (
                <group key={x} position={[x, y, z + side * 0.045]}>
                  <Wheel mat={m.wheel} />
                </group>
              ))}
            </group>
          );
        })}
      </group>
      {annotated && parts.length > 0 && <PartPins parts={parts} group={group} />}
    </group>
  );
}
