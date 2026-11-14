import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MachineKind } from '../../lib/machines';

/*
 * Modèles simplifiés et génériques, construits avec des formes de base.
 * Ce ne sont pas des répliques : ils évoquent le type d'engin.
 * Tous mesurent environ 1 unité ; on les met à l'échelle de la scène.
 */

const METAL = { color: '#d9dde3', metalness: 0.6, roughness: 0.4 };
const GOLD = { color: '#c9a24a', metalness: 0.8, roughness: 0.35 };
const PANEL = { color: '#3a5aa8', metalness: 0.4, roughness: 0.35 };

/** Lumière d'état : verte et pulsante si active, ambre et fixe si endormie. */
export function StatusLight({ active, position = [0, 0.6, 0] }: { active: boolean; position?: [number, number, number] }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    mat.current.opacity = active ? 0.55 + 0.45 * Math.sin(clock.elapsedTime * 4) : 1;
  });
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshBasicMaterial ref={mat} color={active ? '#4BE08A' : '#E0A458'} transparent toneMapped={false} />
    </mesh>
  );
}

/** Fusée générique, avec flamme dont l'intensité est pilotée de l'extérieur. */
export function Rocket({ flame }: { flame: { current: number } }) {
  const flameRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const f = flame.current;
    const flicker = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 40);
    flameRef.current.visible = f > 0.01;
    flameRef.current.scale.set(f * flicker, f * (1.2 + 0.3 * flicker), f * flicker);
  });
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.8, 24]} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <coneGeometry args={[0.09, 0.25, 24]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.101, 0.101, 0.06, 24]} />
        <meshStandardMaterial color="#20232a" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * 0.11, -0.22, Math.sin((i * Math.PI) / 2) * 0.11]} rotation={[0, -(i * Math.PI) / 2, 0]}>
          <boxGeometry args={[0.07, 0.16, 0.01]} />
          <meshStandardMaterial color="#c0c4cc" />
        </mesh>
      ))}
      <mesh ref={flameRef} position={[0, -0.42, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.08, 0.4, 16, 1, true]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Capsule de croisière (bouclier + étage), pour les engins qui voyagent repliés. */
function Capsule() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <coneGeometry args={[0.4, 0.35, 32]} />
        <meshStandardMaterial color="#e9e4da" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.3, 0.12, 32]} />
        <meshStandardMaterial color="#8a5a3c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 32]} />
        <meshStandardMaterial {...PANEL} />
      </mesh>
    </group>
  );
}

function Rover() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.5, 0.18, 0.7]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.9, 0.02, 0.8]} />
        <meshStandardMaterial {...PANEL} />
      </mesh>
      {[-0.3, 0, 0.3].flatMap((z) =>
        [-0.32, 0.32].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.08, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.07, 16]} />
            <meshStandardMaterial color="#3a3d44" />
          </mesh>
        )),
      )}
      <mesh position={[0.1, 0.6, 0.28]}>
        <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0.1, 0.84, 0.28]}>
        <boxGeometry args={[0.16, 0.07, 0.07]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
    </group>
  );
}

function Helicopter({ spin }: { spin: boolean }) {
  const rotors = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (spin) rotors.current.rotation.y += dt * 40;
  });
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.22, 0.18, 0.22]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.18, 0.08, Math.sin(a) * 0.18]} rotation={[0, -a, 0.5]}>
            <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <group ref={rotors} position={[0, 0.62, 0]}>
        <mesh>
          <boxGeometry args={[1.0, 0.012, 0.07]} />
          <meshStandardMaterial color="#c9a46a" />
        </mesh>
        <mesh position={[0, 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.0, 0.012, 0.07]} />
          <meshStandardMaterial color="#c9a46a" />
        </mesh>
      </group>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.28, 0.02, 0.28]} />
        <meshStandardMaterial {...PANEL} />
      </mesh>
    </group>
  );
}

/** Sonde générique : corps, grande antenne parabolique, mât d'instruments. */
function Orbiter({ dish = 0.45 }: { dish?: number }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[dish, 32, 8, 0, Math.PI * 2, 0, Math.PI / 5]} />
        <meshStandardMaterial color="#f0f0ee" side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.8, 6]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[-0.3, -0.1, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.25, 12]} />
        <meshStandardMaterial color="#555a63" />
      </mesh>
    </group>
  );
}

/** Réflecteur laser : un panneau incliné de petits prismes. */
function Reflector() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.45]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.27, 0.0]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.54, 0.02, 0.39]} />
        <meshStandardMaterial color="#5b6c88" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.1, 0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.22, 6]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
    </group>
  );
}

function Lander() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.25, 8]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.35, 0.12, Math.sin(a) * 0.35]} rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]}>
            <cylinderGeometry args={[0.015, 0.015, 0.35, 6]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Le modèle d'une machine, à son poste de travail. */
export function MachineModel({ kind, active, flying = false }: { kind: MachineKind; active: boolean; flying?: boolean }) {
  return (
    <group>
      {kind === 'rover' && <Rover />}
      {kind === 'helicopter' && <Helicopter spin={flying} />}
      {kind === 'reflector' && (
        <>
          <Reflector />
          {/* L'étage de descente du module lunaire, resté sur place. */}
          <group position={[1.1, 0, -0.6]} scale={1.6}>
            <Lander />
          </group>
        </>
      )}
      {kind === 'lander' && <Lander />}
      {(kind === 'orbiter' || kind === 'probe') && <Orbiter dish={kind === 'probe' ? 0.55 : 0.4} />}
      <StatusLight active={active} position={kind === 'helicopter' ? [0, 0.82, 0] : kind === 'orbiter' || kind === 'probe' ? [0, -0.3, 0] : [0, 0.62, 0]} />
    </group>
  );
}

/** Ce qui voyage entre la Terre et la destination. */
export function CruiseModel({ kind }: { kind: MachineKind }) {
  if (kind === 'orbiter' || kind === 'probe') return <Orbiter dish={kind === 'probe' ? 0.55 : 0.4} />;
  return <Capsule />;
}
