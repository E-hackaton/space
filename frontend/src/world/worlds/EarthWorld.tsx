import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Player, player, type Obstacle } from '../Player';
import { ToonRocket } from '../props/Vehicles';
import { Rocks, ShipCamera, SkyDome, SunLight, scatterRocks } from '../props/Environment';
import { TerrainMesh } from '../TerrainMesh';
import { earthField } from '../terrain';
import { PALETTES } from '../toon';
import { smooth } from '../materials';
import { Grass, Trees } from '../props/Nature';
import { AdoBridge } from '../props/AdoBridge';
import { Sun3D } from '../props/Sun3D';
import { Atmosphere } from '../../components/3d/Atmosphere';
import { ship, useWorld, type WorldId } from '../state';

export const EARTH_PAD: [number, number] = [22, -18];
const EARTH_START: [number, number] = [EARTH_PAD[0] - 12, EARTH_PAD[1] + 10];
/** Direction du large vue depuis le pas de tir, où se trouve le pont. */
const SEA_DIR = new THREE.Vector2(0.6, -0.8);
const BRIDGE = { x: EARTH_PAD[0] + SEA_DIR.x * 115, z: EARTH_PAD[1] + SEA_DIR.y * 115 };
/** Le tablier perpendiculaire au regard : on voit le pont en entier, de profil. */
const BRIDGE_YAW = Math.atan2(-SEA_DIR.x, -SEA_DIR.y);
const GRASS_AVOID: [number, number, number][] = [[EARTH_PAD[0], EARTH_PAD[1], 10]];

/**
 * Sur le pas de tir : la caméra recule et se baisse pour cadrer la fusée au premier plan
 * et le pont en entier au large, derrière elle.
 */
function PadCamera({ padY, animate }: { padY: number; animate: boolean }) {
  const look = useRef(new THREE.Vector3());
  useFrame(({ camera }, dt) => {
    const want = new THREE.Vector3(EARTH_PAD[0] - SEA_DIR.x * 34, padY + 7, EARTH_PAD[1] - SEA_DIR.y * 34);
    const target = new THREE.Vector3(EARTH_PAD[0] + SEA_DIR.x * 70, padY + 16, EARTH_PAD[1] + SEA_DIR.y * 70);
    const k = animate ? 1 - Math.exp(-dt * 2.2) : 1;
    camera.position.lerp(want, k);
    look.current.lerp(target, k);
    camera.up.set(0, 1, 0);
    camera.lookAt(look.current);
  });
  return null;
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
  const onPad = useWorld((s) => s.onPad);
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
  const rocks = useMemo(() => scatterRocks(field, 60, 3, [[EARTH_PAD[0], EARTH_PAD[1], 12], [0, 0, 8], [EARTH_START[0], EARTH_START[1], 5]]), [field]);
  const obstacles = useMemo<Obstacle[]>(
    () => [{ x: EARTH_PAD[0], z: EARTH_PAD[1], r: 2.4 }, ...trees.map((t) => ({ x: t.x, z: t.z, r: 0.45 * t.s })), ...rocks.obstacles],
    [trees, rocks],
  );

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
      <SunLight color="#ffe2b8" intensity={2.6} dir={[SEA_DIR.x, 0.75, SEA_DIR.y]} />

      <TerrainMesh field={field} colors={PALETTES.earth.ground} segments={160} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow material={smooth(PALETTES.earth.sand, { rough: 0.9 })}>
        <ringGeometry args={[60, 70, 96]} />
      </mesh>
      <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} material={smooth('#2a7fd6', { rough: 0.12, clearcoat: 1, opacity: 0.92 })}>
        <circleGeometry args={[400, 96]} />
      </mesh>

      {/* Le Soleil, au large derrière le pont (vu depuis le pas de tir) */}
      <group position={[EARTH_PAD[0] + SEA_DIR.x * 430, 150, EARTH_PAD[1] + SEA_DIR.y * 430]}>
        <Sun3D radius={20} />
      </group>

      {/* Le pont Alassane-Ouattara (Abidjan), au large dans l'axe du pas de tir, vu de profil */}
      <group position={[BRIDGE.x, -1.2, BRIDGE.z]} rotation={[0, BRIDGE_YAW, 0]}>
        <AdoBridge />
      </group>

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

      <Trees field={field} trees={trees} animate={animate} />
      <Grass field={field} avoid={GRASS_AVOID} animate={animate} />
      <Rocks rocks={rocks} color={PALETTES.earth.rock} seed={3} />

      {/* L'univers au-dessus de l'île : la Lune et Mars, cliquables */}
      <SkyPlanet texture="/textures/moon_color.jpg" position={[-70, 70, -150]} radius={18} glow="#cfd8ff" target="moon" onPick={onPickPlanet} />
      <SkyPlanet texture="/textures/mars_color.jpg" position={[-165, 70, 95]} radius={14} glow="#ff9a6a" target="jezero" onPick={onPickPlanet} />

      <Player field={field} start={EARTH_START} startHeading={0.8} obstacles={obstacles} enabled={phase === 'drive'} followCamera={phase === 'drive' && !onPad} animate={animate} visible={phase === 'drive'} />
      {phase === 'drive' && onPad && <PadCamera padY={padY} animate={animate} />}
      {phase !== 'drive' && <ShipCamera at={[EARTH_PAD[0], padY, EARTH_PAD[1]]} ship={ship} animate={animate} />}
    </>
  );
}
