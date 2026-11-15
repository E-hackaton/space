import { forwardRef, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { smooth } from '../materials';

/*
 * Engins originaux dessinés en formes lisses (profils tournés, arrondis, tores).
 * Origine : au sol, avant vers -Z.
 */

/** Profil tourné autour de l'axe vertical (fusées, capsules) : des points [rayon, hauteur]. */
function useLathe(points: [number, number][], segments = 48) {
  return useMemo(() => new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments), [points, segments]);
}

export function Wheel({ r = 0.34, w = 0.26, spin, steer }: { r?: number; w?: number; spin?: { current: number }; steer?: { current: number } }) {
  const g = useRef<THREE.Group>(null!);
  const s = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (spin) g.current.rotation.x = spin.current;
    if (steer) s.current.rotation.y = steer.current;
  });
  return (
    <group ref={s}>
      <group ref={g} rotation={[0, 0, 0]}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={smooth('#23252d', { rough: 0.9 })} castShadow>
          <torusGeometry args={[r * 0.72, r * 0.3, 16, 32]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={smooth('#d6dbe3', { metal: 0.7, rough: 0.3 })}>
          <cylinderGeometry args={[r * 0.5, r * 0.5, w * 0.7, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={smooth('#ff8a3d', { metal: 0.3, rough: 0.35 })}>
          <cylinderGeometry args={[r * 0.18, r * 0.18, w * 0.9, 16]} />
        </mesh>
      </group>
    </group>
  );
}

/** Le rover du joueur : un explorateur arrondi, carrosserie laquée et phares lumineux. */
export const PlayerRover = forwardRef<THREE.Group, { spin: { current: number }; steer: { current: number } }>(function PlayerRover({ spin, steer }, ref) {
  const head = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    head.current.rotation.y = Math.sin(clock.elapsedTime * 0.7) * 0.5;
  });
  return (
    <group ref={ref}>
      {/* Châssis et carrosserie */}
      <RoundedBox args={[1.25, 0.42, 2.0]} radius={0.18} smoothness={4} position={[0, 0.66, 0]} material={smooth('#f4f6fa', { clearcoat: 1, rough: 0.35 })} castShadow />
      <RoundedBox args={[1.0, 0.26, 1.2]} radius={0.12} smoothness={4} position={[0, 0.98, 0.18]} material={smooth('#21b3a8', { clearcoat: 1, rough: 0.3 })} castShadow />
      {/* Bulle du cockpit */}
      <mesh position={[0, 1.05, -0.48]} scale={[0.48, 0.3, 0.42]} material={smooth('#9fe7ff', { rough: 0.05, metal: 0.1, clearcoat: 1, opacity: 0.75 })} castShadow>
        <sphereGeometry args={[1, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Panneau solaire bombé */}
      <RoundedBox args={[1.5, 0.05, 1.0]} radius={0.025} smoothness={2} position={[0, 1.16, 0.45]} material={smooth('#2b4fb8', { metal: 0.5, rough: 0.25, clearcoat: 1 })} castShadow />
      {/* Mât et tête qui regarde autour */}
      <mesh position={[0.36, 1.45, 0.55]} material={smooth('#d6dbe3', { metal: 0.6, rough: 0.3 })}>
        <capsuleGeometry args={[0.045, 0.6, 6, 12]} />
      </mesh>
      <group ref={head} position={[0.36, 1.85, 0.55]}>
        <RoundedBox args={[0.42, 0.22, 0.26]} radius={0.08} smoothness={4} material={smooth('#f4f6fa', { clearcoat: 1, rough: 0.35 })} castShadow />
        {[-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 0, -0.14]} material={smooth('#0d1b2a', { emissive: '#62e6ff', glow: 1.6 })}>
            <sphereGeometry args={[0.055, 16, 12]} />
          </mesh>
        ))}
      </group>
      {/* Phares */}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.66, -1.0]} material={smooth('#fff4c2', { emissive: '#ffd36b', glow: 3 })}>
          <sphereGeometry args={[0.09, 16, 12]} />
        </mesh>
      ))}
      {/* Bras de suspension et six roues */}
      {[-0.72, 0, 0.72].map((z, i) =>
        [-0.74, 0.74].map((x) => (
          <group key={`${x}${z}`} position={[x, 0.34, z]}>
            <mesh position={[-Math.sign(x) * 0.12, 0.2, 0]} rotation={[0, 0, Math.sign(x) * 0.6]} material={smooth('#c4cad4', { metal: 0.6, rough: 0.35 })}>
              <capsuleGeometry args={[0.04, 0.32, 4, 8]} />
            </mesh>
            <Wheel spin={spin} steer={i === 0 ? steer : undefined} />
          </group>
        )),
      )}
    </group>
  );
});

/** Voyant d'état : vert qui pulse si actif, ambre fixe si endormi. */
export function Beacon({ active, y = 2.8 }: { active: boolean; y?: number }) {
  const m = useRef<THREE.Mesh>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const p = active ? 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3.5) : 0.6;
    m.current.position.y = Math.sin(clock.elapsedTime * 1.6) * 0.08;
    halo.current.scale.setScalar(1 + p * 0.8);
    (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + 0.25 * p;
  });
  const color = active ? '#4BE08A' : '#E0A458';
  return (
    <group position={[0, y, 0]}>
      <mesh ref={m} material={smooth(color, { emissive: color, glow: 3, rough: 0.2 })}>
        <octahedronGeometry args={[0.2, 2]} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

const ROCKET_BODY: [number, number][] = [
  [0, 0], [1.05, 0], [1.12, 0.4], [1.12, 5.6], [1.05, 6.6], [0.85, 7.7], [0.55, 8.6], [0.22, 9.3], [0, 9.6],
];
const FLAME: [number, number][] = [[0, -3.4], [0.35, -2.2], [0.75, -0.8], [0.9, 0], [0, 0]];

function Flame({ flame, scale = 1 }: { flame: { current: number }; scale?: number }) {
  const outer = useRef<THREE.Mesh>(null!);
  const inner = useRef<THREE.Mesh>(null!);
  const geo = useLathe(FLAME, 24);
  useFrame(({ clock }) => {
    const k = flame.current;
    const f = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 47) + 0.05 * Math.sin(clock.elapsedTime * 13);
    for (const [ref, s] of [[outer, 1], [inner, 0.55]] as const) {
      ref.current.visible = k > 0.01;
      ref.current.scale.set(k * s * scale, k * f * s * scale * 1.2, k * s * scale);
    }
  });
  return (
    <>
      <mesh ref={outer} geometry={geo}>
        <meshBasicMaterial color="#ff9a3c" transparent opacity={0.85} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={inner} geometry={geo}>
        <meshBasicMaterial color="#fff2c4" toneMapped={false} />
      </mesh>
    </>
  );
}

/** Aileron profilé (bord d'attaque en flèche), extrudé avec des arêtes adoucies. */
function useFin() {
  return useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.lineTo(0, 3.2);
    sh.bezierCurveTo(0.6, 2.4, 1.3, 1.2, 1.55, -0.35);
    sh.lineTo(1.35, -0.6);
    sh.quadraticCurveTo(0.6, -0.2, 0, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 24 });
    g.translate(0, 0, -0.04);
    return g;
  }, []);
}

const ROCKET_NOSE: [number, number][] = [[1.065, 6.6], [0.865, 7.7], [0.565, 8.6], [0.232, 9.3], [0, 9.62]];
const ROCKET_BELL: [number, number][] = [[0.42, 0], [0.5, -0.25], [0.68, -0.7], [0.86, -1.05], [0.8, -1.05], [0.62, -0.68], [0.45, -0.25], [0.36, 0]];

/** Fusée : corps à profil tourné, jupe et tuyère, ailerons profilés, coiffe, hublot cerclé et flamme. */
export function ToonRocket({ flame, children }: { flame: { current: number }; children?: ReactNode }) {
  const body = useLathe(ROCKET_BODY, 64);
  const bell = useLathe(ROCKET_BELL, 40);
  const nose = useLathe(ROCKET_NOSE, 64);
  const fin = useFin();
  const white = smooth('#f6f6f3', { clearcoat: 1, rough: 0.3 });
  const red = smooth('#d8392f', { clearcoat: 1, rough: 0.28 });
  const seam = smooth('#c9ccd2', { metal: 0.6, rough: 0.35 });
  const dark = smooth('#2b2f36', { metal: 0.8, rough: 0.4 });
  return (
    <group position={[0, 0.9, 0]}>
      <group position={[0, 1.15, 0]}>
        <mesh geometry={body} material={white} castShadow />
        {/* lignes de panneaux et bande rouge */}
        {[1.6, 3.0, 4.4].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={seam}>
            <torusGeometry args={[1.125, 0.018, 8, 64]} />
          </mesh>
        ))}
        <mesh position={[0, 5.15, 0]} material={red}>
          <cylinderGeometry args={[1.125, 1.125, 0.5, 64, 1, true]} />
        </mesh>
        {/* coiffe rouge */}
        <mesh geometry={nose} material={red} castShadow />
        {/* hublot cerclé */}
        <group position={[0, 3.7, -1.08]}>
          <mesh rotation={[0, 0, 0]} material={smooth('#123049', { emissive: '#5fd2ff', glow: 1.2, clearcoat: 1, rough: 0.05 })}>
            <sphereGeometry args={[0.34, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={seam}>
            <torusGeometry args={[0.36, 0.05, 12, 48]} />
          </mesh>
        </group>
        {/* ailerons */}
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2 + Math.PI / 4, 0]}>
            <mesh geometry={fin} position={[1.02, 0.15, 0]} material={red} castShadow />
          </group>
        ))}
      </group>
      {/* jupe moteur et tuyère */}
      <mesh position={[0, 0.85, 0]} material={dark} castShadow>
        <cylinderGeometry args={[1.05, 0.7, 0.6, 48]} />
      </mesh>
      <mesh geometry={bell} position={[0, 0.55, 0]} material={dark} castShadow />
      <group position={[0, -0.5, 0]}>
        <Flame flame={flame} />
      </group>
      {children}
    </group>
  );
}

const LANDER_BODY: [number, number][] = [[0, 0.9], [1.9, 0.9], [2.1, 1.3], [1.9, 2.6], [1.3, 3.4], [0.6, 3.8], [0, 3.9]];

/** Module d'atterrissage arrondi (capsule à pieds) avec rétrofusée. */
export function ToonLander({ flame }: { flame: { current: number } }) {
  const body = useLathe(LANDER_BODY);
  return (
    <group>
      <mesh geometry={body} material={smooth('#f2efe8', { clearcoat: 0.8, rough: 0.35 })} castShadow />
      <mesh position={[0, 2.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={smooth('#e2473b', { clearcoat: 1, rough: 0.3 })}>
        <torusGeometry args={[1.95, 0.08, 12, 48]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <group key={i} rotation={[0, -a, 0]}>
            <mesh position={[2.1, 0.55, 0]} rotation={[0, 0, 0.55]} material={smooth('#c9ced6', { metal: 0.7, rough: 0.3 })} castShadow>
              <capsuleGeometry args={[0.08, 1.4, 6, 12]} />
            </mesh>
            <mesh position={[2.45, 0.05, 0]} scale={[1, 0.25, 1]} material={smooth('#c9ced6', { metal: 0.7, rough: 0.3 })}>
              <sphereGeometry args={[0.38, 20, 12]} />
            </mesh>
          </group>
        );
      })}
      <group position={[0, 0.9, 0]}>
        <Flame flame={flame} scale={0.7} />
      </group>
    </group>
  );
}
