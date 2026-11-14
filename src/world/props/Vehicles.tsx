import { forwardRef, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { toon } from '../toon';

/*
 * Engins stylisés, en formes simples (originales, pas des répliques).
 * Origine : au sol, avant vers -Z.
 */

const INK = '#1a1033';
const O = ({ t = 0.035 }: { t?: number }) => <Outlines thickness={t} color={INK} screenspace={false} />;

export function Wheel({ r = 0.32, w = 0.26, spin, steer }: { r?: number; w?: number; spin?: { current: number }; steer?: { current: number } }) {
  const g = useRef<THREE.Group>(null!);
  const s = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (spin) g.current.rotation.x = spin.current;
    if (steer && s.current) s.current.rotation.y = steer.current;
  });
  return (
    <group ref={s}>
      <group ref={g}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={toon('#2b2d3a')} castShadow>
          <cylinderGeometry args={[r, r, w, 10]} />
          <O t={0.02} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={toon('#c9ced6')}>
          <cylinderGeometry args={[r * 0.45, r * 0.45, w * 1.05, 6]} />
        </mesh>
      </group>
    </group>
  );
}

/** Le rover du joueur : un buggy d'exploration à six roues, phares allumés. */
export const PlayerRover = forwardRef<THREE.Group, { spin: { current: number }; steer: { current: number }; body?: string }>(
  function PlayerRover({ spin, steer, body = '#f2f4f7' }, ref) {
    return (
      <group ref={ref}>
        <mesh position={[0, 0.62, 0]} material={toon(body)} castShadow>
          <boxGeometry args={[1.1, 0.34, 1.9]} />
          <O />
        </mesh>
        <mesh position={[0, 0.86, 0.15]} material={toon('#2aa8a1')} castShadow>
          <boxGeometry args={[0.9, 0.18, 1.1]} />
          <O t={0.025} />
        </mesh>
        <mesh position={[0, 1.02, 0.2]} material={toon('#3a5aa8')} castShadow>
          <boxGeometry args={[1.4, 0.05, 1.0]} />
          <O t={0.02} />
        </mesh>
        {/* Mât et « tête » */}
        <mesh position={[0.3, 1.25, -0.6]} material={toon('#c9ced6')}>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
        </mesh>
        <mesh position={[0.3, 1.58, -0.6]} material={toon(body)} castShadow>
          <boxGeometry args={[0.36, 0.18, 0.22]} />
          <O t={0.02} />
        </mesh>
        {/* Phares */}
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, 0.62, -0.96]} material={toon('#fff2b3', { emissive: '#ffd36b' })}>
            <boxGeometry args={[0.24, 0.1, 0.04]} />
          </mesh>
        ))}
        {/* Six roues */}
        {[-0.7, 0, 0.7].map((z, i) =>
          [-0.68, 0.68].map((x) => (
            <group key={`${x}${z}`} position={[x, 0.32, z]}>
              <Wheel spin={spin} steer={i === 0 ? steer : undefined} />
            </group>
          )),
        )}
      </group>
    );
  },
);

/** Grand rover scientifique (pour Perseverance et Curiosity) : bras, mât, générateur à l'arrière. */
export function ScienceRover({ color = '#f0eee8', accent = '#c9a24a', spin }: { color?: string; accent?: string; spin?: { current: number } }) {
  return (
    <group>
      <mesh position={[0, 0.8, 0]} material={toon(color)} castShadow>
        <boxGeometry args={[1.5, 0.5, 2.2]} />
        <O />
      </mesh>
      <mesh position={[0, 1.08, 0.2]} material={toon('#d8d3c4')} castShadow>
        <boxGeometry args={[1.3, 0.06, 1.6]} />
      </mesh>
      <mesh position={[0, 0.95, 1.25]} rotation={[0.5, 0, 0]} material={toon(accent)} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.6, 8]} />
        <O t={0.025} />
      </mesh>
      <mesh position={[-0.5, 1.6, -0.85]} material={toon('#c9ced6')}>
        <cylinderGeometry args={[0.05, 0.05, 1.1, 6]} />
      </mesh>
      <mesh position={[-0.5, 2.2, -0.85]} material={toon(color)} castShadow>
        <boxGeometry args={[0.55, 0.26, 0.3]} />
        <O t={0.025} />
      </mesh>
      <mesh position={[0.55, 0.75, -1.25]} rotation={[0.9, 0, 0]} material={toon('#c9ced6')}>
        <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
      </mesh>
      {[-0.85, 0, 0.85].map((z) =>
        [-0.9, 0.9].map((x) => (
          <group key={`${x}${z}`} position={[x, 0.35, z]}>
            <Wheel r={0.35} w={0.3} spin={spin} />
          </group>
        )),
      )}
    </group>
  );
}

/** Petit hélicoptère à deux rotors. */
export function Helicopter({ spinning }: { spinning: { current: boolean } }) {
  const rot = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (spinning.current) rot.current.rotation.y += dt * 30;
  });
  return (
    <group>
      <mesh position={[0, 0.5, 0]} material={toon('#c9a24a')} castShadow>
        <boxGeometry args={[0.45, 0.4, 0.45]} />
        <O t={0.025} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.38, 0.18, Math.sin(a) * 0.38]} rotation={[Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45]} material={toon('#c9ced6')}>
            <cylinderGeometry args={[0.025, 0.025, 0.6, 5]} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.0, 0]} material={toon('#c9ced6')}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
      </mesh>
      <group ref={rot} position={[0, 1.2, 0]}>
        <mesh material={toon('#e0c27a')} castShadow>
          <boxGeometry args={[2.2, 0.03, 0.16]} />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation={[0, Math.PI / 2, 0]} material={toon('#e0c27a')} castShadow>
          <boxGeometry args={[2.2, 0.03, 0.16]} />
        </mesh>
      </group>
      <mesh position={[0, 1.42, 0]} material={toon('#3a5aa8')} castShadow>
        <boxGeometry args={[0.6, 0.04, 0.6]} />
      </mesh>
    </group>
  );
}

/** Voyant d'état : vert qui pulse si actif, ambre fixe si endormi. */
export function Beacon({ active, y = 2.8 }: { active: boolean; y?: number }) {
  const m = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const s = active ? 1 + 0.25 * Math.sin(clock.elapsedTime * 4) : 1;
    m.current.scale.setScalar(s);
  });
  return (
    <group position={[0, y, 0]}>
      <mesh ref={m} material={toon(active ? '#4BE08A' : '#E0A458', { emissive: active ? '#4BE08A' : '#E0A458' })}>
        <octahedronGeometry args={[0.22, 0]} />
        <O t={0.02} />
      </mesh>
    </group>
  );
}

/** Fusée stylisée, avec flamme pilotée de l'extérieur. */
export function ToonRocket({ flame, children }: { flame: { current: number }; children?: ReactNode }) {
  const f = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const k = flame.current;
    f.current.visible = k > 0.01;
    const flick = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 45);
    f.current.scale.set(k * flick, k * (1 + 0.4 * flick), k * flick);
  });
  return (
    <group>
      <mesh position={[0, 4.2, 0]} material={toon('#f4f4f2')} castShadow>
        <cylinderGeometry args={[1, 1.1, 7, 12]} />
        <O t={0.05} />
      </mesh>
      <mesh position={[0, 8.7, 0]} material={toon('#e2473b')} castShadow>
        <coneGeometry args={[1, 2.2, 12]} />
        <O t={0.05} />
      </mesh>
      <mesh position={[0, 6.4, 0]} material={toon('#e2473b')}>
        <cylinderGeometry args={[1.02, 1.02, 0.4, 12]} />
      </mesh>
      <mesh position={[0, 5.2, -1.01]} material={toon('#9fd8ff', { emissive: '#4aa3df' })}>
        <circleGeometry args={[0.38, 16]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * 1.15, 1.2, Math.sin((i * Math.PI) / 2) * 1.15]} rotation={[0, -(i * Math.PI) / 2, 0]} material={toon('#e2473b')} castShadow>
          <boxGeometry args={[0.9, 2, 0.12]} />
          <O t={0.03} />
        </mesh>
      ))}
      <mesh ref={f} position={[0, -0.9, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.9, 3.2, 12, 1, true]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.95} toneMapped={false} />
      </mesh>
      {children}
    </group>
  );
}

/** Module d'atterrissage stylisé (capsule à pieds) avec rétrofusée. */
export function ToonLander({ flame }: { flame: { current: number } }) {
  const f = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const k = flame.current;
    f.current.visible = k > 0.01;
    f.current.scale.setScalar(k * (0.85 + 0.15 * Math.sin(clock.elapsedTime * 40)));
  });
  return (
    <group>
      <mesh position={[0, 2.2, 0]} material={toon('#f4f4f2')} castShadow>
        <cylinderGeometry args={[1.2, 2, 2.2, 10]} />
        <O t={0.05} />
      </mesh>
      <mesh position={[0, 3.6, 0]} material={toon('#e2473b')} castShadow>
        <cylinderGeometry args={[0.6, 1.2, 0.8, 10]} />
        <O t={0.04} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 2, 0.6, Math.sin(a) * 2]} rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]} material={toon('#c9ced6')} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.8, 6]} />
          </mesh>
        );
      })}
      <mesh ref={f} position={[0, 0.4, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.8, 2.4, 10, 1, true]} />
        <meshBasicMaterial color="#ffcf7a" transparent opacity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}
