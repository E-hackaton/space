import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Sparkles, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Player, player, type Obstacle } from '../Player';
import { ToonRocket } from '../props/Vehicles';
import { GrassTufts, Rocks, ShipCamera, SkyDome, SunLight } from '../props/Environment';
import { TerrainMesh } from '../TerrainMesh';
import { earthField } from '../terrain';
import { PALETTES } from '../toon';
import { smooth } from '../materials';
import { Atmosphere } from '../../components/3d/Atmosphere';
import { ship, useWorld, type WorldId } from '../state';

export const EARTH_PAD: [number, number] = [22, -18];
const EARTH_START: [number, number] = [EARTH_PAD[0] - 12, EARTH_PAD[1] + 10];
const GRASS_AVOID: [number, number, number][] = [[EARTH_PAD[0], EARTH_PAD[1], 10]];

/** Arbre au feuillage arrondi, qui se balance doucement. */
function Tree({ x, z, s, y, phase }: { x: number; z: number; s: number; y: number; phase: number }) {
  const crown = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    crown.current.rotation.z = Math.sin(clock.elapsedTime * 0.8 + phase) * 0.04;
  });
  return (
    <group position={[x, y, z]} scale={s}>
      <mesh position={[0, 1, 0]} material={smooth('#7a4a2b', { rough: 0.8 })} castShadow>
        <cylinderGeometry args={[0.16, 0.28, 2, 12]} />
      </mesh>
      <group ref={crown} position={[0, 2, 0]}>
        {[
          [0, 0.7, 0, 1.15, '#2f9a52'],
          [0.65, 0.35, 0.2, 0.8, '#3fb563'],
          [-0.55, 0.45, -0.25, 0.85, '#2a8a4a'],
          [0.05, 1.35, 0.1, 0.75, '#4cc46e'],
        ].map(([px, py, pz, r, c], i) => (
          <mesh key={i} position={[px as number, py as number, pz as number]} material={smooth(c as string, { rough: 0.6 })} castShadow>
            <sphereGeometry args={[r as number, 24, 18]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Petites fleurs lumineuses (instanciées). */
function Flowers({ field }: { field: ReturnType<typeof earthField> }) {
  const mats = useMemo(() => {
    let s = 21;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const out: THREE.Matrix4[] = [];
    while (out.length < 220) {
      const a = rnd() * 6.28;
      const r = 8 + Math.sqrt(rnd()) * 48;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.hypot(x - EARTH_PAD[0], z - EARTH_PAD[1]) < 11) continue;
      out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, field.heightAt(x, z) + 0.45, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1).multiplyScalar(0.6 + rnd() * 0.6)));
    }
    return out;
  }, [field]);
  return (
    <instancedMesh
      ref={(r) => {
        if (!r) return;
        mats.forEach((m, i) => r.setMatrixAt(i, m));
        r.instanceMatrix.needsUpdate = true;
      }}
      args={[undefined, undefined, mats.length]}
      material={smooth('#ffd1f0', { emissive: '#ff7ad9', glow: 1.6 })}
    >
      <sphereGeometry args={[0.13, 12, 8]} />
    </instancedMesh>
  );
}

/** Planète cliquable dans le ciel : un clic lance le voyage. */
function SkyPlanet({ texture, position, radius, glow, target, onPick }: { texture: string; position: [number, number, number]; radius: number; glow: string; target: WorldId; onPick: (t: WorldId) => void }) {
  const map = useTexture(texture);
  map.colorSpace = THREE.SRGBColorSpace;
  const ref = useRef<THREE.Group>(null!);
  const hover = useRef(false);
  const sunDir = useMemo(() => new THREE.Vector3(0.6, 0.4, 0.7).normalize(), []);
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.05;
    const s = hover.current ? 1.08 : 1;
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), 1 - Math.exp(-dt * 8));
  });
  return (
    <group ref={ref} position={position}>
      <mesh
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onPick(target);
        }}
        onPointerOver={() => {
          hover.current = true;
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          hover.current = false;
          document.body.style.cursor = '';
        }}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial map={map} roughness={1} fog={false} emissive="#ffffff" emissiveMap={map} emissiveIntensity={0.25} />
      </mesh>
      <Atmosphere radius={radius} color={glow} sunDir={sunDir} scale={1.08} power={2} intensity={1.6} />
    </group>
  );
}

export default function EarthWorld({ animate, onPickPlanet }: { animate: boolean; onPickPlanet: (t: WorldId) => void }) {
  const field = useMemo(() => earthField(), []);
  const phase = useWorld((s) => s.phase);
  const setOnPad = useWorld((s) => s.setOnPad);
  const flame = useRef(0);
  const rocket = useRef<THREE.Group>(null!);
  const water = useRef<THREE.Mesh>(null!);
  const padY = field.heightAt(...EARTH_PAD);
  const trees = useMemo(() => {
    const out: { x: number; z: number; s: number; phase: number }[] = [];
    let s = 7;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    while (out.length < 46) {
      const a = rnd() * Math.PI * 2;
      const r = 18 + rnd() * 40;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.hypot(x - EARTH_PAD[0], z - EARTH_PAD[1]) < 14 || Math.hypot(x, z) < 10) continue;
      out.push({ x, z, s: 0.8 + rnd() * 0.9, phase: rnd() * 6 });
    }
    return out;
  }, []);
  const obstacles = useMemo<Obstacle[]>(() => [{ x: EARTH_PAD[0], z: EARTH_PAD[1], r: 2.4 }, ...trees.map((t) => ({ x: t.x, z: t.z, r: 0.5 * t.s }))], [trees]);

  useFrame(({ clock }) => {
    flame.current = ship.flame;
    rocket.current.position.y = padY + ship.y;
    water.current.position.y = -1.2 + Math.sin(clock.elapsedTime * 0.6) * 0.08;
    if (phase === 'drive') setOnPad(Math.hypot(player.x - EARTH_PAD[0], player.z - EARTH_PAD[1]) < 8);
  });

  return (
    <>
      <SkyDome bottom="#5a5fc4" top="#0b0c2a" />
      <Stars radius={300} depth={60} count={3000} factor={5} fade speed={animate ? 0.5 : 0} />
      <fog attach="fog" args={['#3a3f8a', 100, 280]} />
      <hemisphereLight args={['#a9c4ff', '#2a4a2a', 0.8]} />
      <SunLight color="#ffe2b8" intensity={2.6} dir={[0.5, 0.8, 0.6]} />

      <TerrainMesh field={field} colors={PALETTES.earth.ground} segments={160} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow material={smooth(PALETTES.earth.sand, { rough: 0.9 })}>
        <ringGeometry args={[60, 70, 96]} />
      </mesh>
      <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} material={smooth('#2a7fd6', { rough: 0.12, clearcoat: 1, opacity: 0.92 })}>
        <circleGeometry args={[400, 96]} />
      </mesh>

      {/* Pas de tir et fusée */}
      <group position={[EARTH_PAD[0], padY, EARTH_PAD[1]]}>
        <mesh position={[0, 0.15, 0]} receiveShadow material={smooth('#c3c7cf', { rough: 0.7 })}>
          <cylinderGeometry args={[8, 8.4, 0.3, 64]} />
        </mesh>
        <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} material={smooth('#ffd24a', { emissive: '#ffb020', glow: 1.2 })}>
          <torusGeometry args={[7, 0.1, 12, 96]} />
        </mesh>
        <mesh position={[-3.2, 6, 0]} material={smooth('#c0392b', { clearcoat: 1, rough: 0.35 })} castShadow>
          <capsuleGeometry args={[0.35, 11.5, 8, 16]} />
        </mesh>
      </group>
      <group ref={rocket} position={[EARTH_PAD[0], padY, EARTH_PAD[1]]}>
        <ToonRocket flame={flame} />
      </group>

      {trees.map((t, i) => (
        <Tree key={i} {...t} y={field.heightAt(t.x, t.z)} />
      ))}
      <GrassTufts field={field} avoid={GRASS_AVOID} />
      <Flowers field={field} />
      <Rocks field={field} color={PALETTES.earth.rock} count={60} seed={3} avoid={[[EARTH_PAD[0], EARTH_PAD[1], 12], [0, 0, 8]]} />
      {/* Lucioles */}
      <Sparkles count={140} scale={[110, 8, 110]} position={[0, 4, 0]} size={4} speed={animate ? 0.4 : 0} color="#d8ff9c" opacity={0.9} />

      {/* L'univers au-dessus de l'île : la Lune et Mars, cliquables */}
      <SkyPlanet texture="/textures/moon_color.jpg" position={[-70, 70, -150]} radius={18} glow="#cfd8ff" target="moon" onPick={onPickPlanet} />
      <SkyPlanet texture="/textures/mars_color.jpg" position={[90, 55, -170]} radius={14} glow="#ff9a6a" target="jezero" onPick={onPickPlanet} />

      <Player field={field} start={EARTH_START} startHeading={0.8} obstacles={obstacles} enabled={phase === 'drive'} followCamera={phase === 'drive'} animate={animate} visible={phase === 'drive'} />
      {phase !== 'drive' && <ShipCamera at={[EARTH_PAD[0], padY, EARTH_PAD[1]]} ship={ship} animate={animate} />}
    </>
  );
}
