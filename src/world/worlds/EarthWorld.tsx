import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Outlines, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Player, player, type Obstacle } from '../Player';
import { ToonRocket } from '../props/Vehicles';
import { GrassTufts, Rocks, ShipCamera, SkyDome, SunLight } from '../props/Environment';
import { TerrainMesh } from '../TerrainMesh';
import { earthField } from '../terrain';
import { PALETTES, toon, toonGradient } from '../toon';
import { ship, useWorld, type WorldId } from '../state';

export const EARTH_PAD: [number, number] = [22, -18];
const EARTH_START: [number, number] = [EARTH_PAD[0] - 12, EARTH_PAD[1] + 10];
const GRASS_AVOID: [number, number, number][] = [[EARTH_PAD[0], EARTH_PAD[1], 10]];

function Tree({ x, z, s, y }: { x: number; z: number; s: number; y: number }) {
  return (
    <group position={[x, y, z]} scale={s}>
      <mesh position={[0, 0.8, 0]} material={toon('#7a4a2b')} castShadow>
        <cylinderGeometry args={[0.18, 0.25, 1.6, 6]} />
      </mesh>
      <mesh position={[0, 2.3, 0]} material={toon('#2f8f4e', { flat: true })} castShadow>
        <icosahedronGeometry args={[1.2, 0]} />
        <Outlines thickness={0.04} color="#12301c" />
      </mesh>
      <mesh position={[0.5, 3.1, 0.2]} material={toon('#3fae5c', { flat: true })} castShadow>
        <icosahedronGeometry args={[0.8, 0]} />
      </mesh>
    </group>
  );
}

/** Planète cliquable dans le ciel : un clic lance le voyage. */
function SkyPlanet({ texture, position, radius, target, onPick }: { texture: string; position: [number, number, number]; radius: number; target: WorldId; onPick: (t: WorldId) => void }) {
  const map = useTexture(texture);
  map.colorSpace = THREE.SRGBColorSpace;
  const ref = useRef<THREE.Mesh>(null!);
  const hover = useRef(false);
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.05;
    const s = hover.current ? 1.08 : 1;
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), 1 - Math.exp(-dt * 8));
  });
  return (
    <mesh
      ref={ref}
      position={position}
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
      <sphereGeometry args={[radius, 48, 48]} />
      <meshToonMaterial map={map} gradientMap={toonGradient()} fog={false} />
      <Outlines thickness={0.6} color="#0b0d26" />
    </mesh>
  );
}

export default function EarthWorld({ animate, onPickPlanet }: { animate: boolean; onPickPlanet: (t: WorldId) => void }) {
  const field = useMemo(() => earthField(), []);
  const phase = useWorld((s) => s.phase);
  const setOnPad = useWorld((s) => s.setOnPad);
  const flame = useRef(0);
  const rocket = useRef<THREE.Group>(null!);
  const padY = field.heightAt(...EARTH_PAD);
  const obstacles = useMemo<Obstacle[]>(() => [{ x: EARTH_PAD[0], z: EARTH_PAD[1], r: 2.4 }], []);
  const trees = useMemo(() => {
    const out: { x: number; z: number; s: number }[] = [];
    let s = 7;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    while (out.length < 46) {
      const a = rnd() * Math.PI * 2;
      const r = 18 + rnd() * 40;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.hypot(x - EARTH_PAD[0], z - EARTH_PAD[1]) < 14 || Math.hypot(x, z) < 10) continue;
      out.push({ x, z, s: 0.8 + rnd() * 0.9 });
    }
    return out;
  }, []);
  const allObstacles = useMemo(() => [...obstacles, ...trees.map((t) => ({ x: t.x, z: t.z, r: 0.5 * t.s }))], [obstacles, trees]);

  useFrame(() => {
    flame.current = ship.flame;
    rocket.current.position.y = padY + ship.y;
    if (phase === 'drive') setOnPad(Math.hypot(player.x - EARTH_PAD[0], player.z - EARTH_PAD[1]) < 8);
  });

  return (
    <>
      <SkyDome bottom="#3b3f8f" top="#0a0b24" />
      <Stars radius={300} depth={60} count={3000} factor={5} fade speed={animate ? 0.5 : 0} />
      <fog attach="fog" args={[PALETTES.earth.fog, 90, 260]} />
      <hemisphereLight args={['#9db7ff', '#2a3a2a', 0.9]} />
      <SunLight color="#ffe9c4" intensity={2.2} dir={[0.5, 1, 0.6]} />

      <TerrainMesh field={field} colors={PALETTES.earth.ground} segments={140} />
      {/* Plage et océan */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow material={toon(PALETTES.earth.sand)}>
        <ringGeometry args={[60, 70, 64]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <circleGeometry args={[400, 64]} />
        <meshToonMaterial color={PALETTES.earth.water} gradientMap={toonGradient()} />
      </mesh>

      {/* Pas de tir et fusée */}
      <group position={[EARTH_PAD[0], padY, EARTH_PAD[1]]}>
        <mesh position={[0, 0.15, 0]} receiveShadow material={toon('#b9bcc4')}>
          <cylinderGeometry args={[8, 8.4, 0.3, 24]} />
          <Outlines thickness={0.05} color="#1a1033" />
        </mesh>
        <mesh position={[0, 0.32, 0]} material={toon('#f0c34a')}>
          <torusGeometry args={[7, 0.12, 6, 48]} />
        </mesh>
        <mesh position={[-3.2, 6, 0]} material={toon('#c0392b')} castShadow>
          <boxGeometry args={[0.8, 12, 0.8]} />
          <Outlines thickness={0.04} color="#1a1033" />
        </mesh>
      </group>
      <group ref={rocket} position={[EARTH_PAD[0], padY, EARTH_PAD[1]]}>
        <ToonRocket flame={flame} />
      </group>

      {trees.map((t, i) => (
        <Tree key={i} {...t} y={field.heightAt(t.x, t.z)} />
      ))}
      <GrassTufts field={field} avoid={GRASS_AVOID} />
      <Rocks field={field} color={PALETTES.earth.rock} count={60} seed={3} avoid={[[EARTH_PAD[0], EARTH_PAD[1], 12], [0, 0, 8]]} />

      {/* L'univers au-dessus de l'île : la Lune et Mars, cliquables */}
      <SkyPlanet texture="/textures/moon_color.jpg" position={[-70, 70, -150]} radius={18} target="moon" onPick={onPickPlanet} />
      <SkyPlanet texture="/textures/mars_color.jpg" position={[90, 55, -170]} radius={14} target="jezero" onPick={onPickPlanet} />

      <Player
        field={field}
        start={EARTH_START}
        startHeading={0.8}
        obstacles={allObstacles}
        enabled={phase === 'drive'}
        followCamera={phase === 'drive'}
        animate={animate}
        visible={phase === 'drive'}
      />
      {phase !== 'drive' && <ShipCamera at={[EARTH_PAD[0], padY, EARTH_PAD[1]]} ship={ship} animate={animate} />}
    </>
  );
}
