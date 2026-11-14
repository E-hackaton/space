import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Outlines, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Player, player, type Obstacle } from '../Player';
import { Beacon, ToonLander } from '../props/Vehicles';
import { Rocks, ShipCamera, SunLight } from '../props/Environment';
import { TerrainMesh } from '../TerrainMesh';
import { moonField } from '../terrain';
import { PALETTES, toon, toonGradient } from '../toon';
import { ship, useWorld } from '../state';

/*
 * Site d'Apollo 11 (mer de la Tranquillité). 1 unité = 1 m.
 * Positions relatives d'après la NASA (NSSDCA) : sismomètre (EASEP) à ~17 m au sud du module,
 * réflecteur laser à ~5 m au nord-nord-ouest de l'EASEP. Nord = -Z.
 */
const LM: [number, number] = [0, 0];
const EASEP: [number, number] = [0, 17];
const LRRR: [number, number] = [EASEP[0] - 5 * Math.sin((22.5 * Math.PI) / 180), EASEP[1] - 5 * Math.cos((22.5 * Math.PI) / 180)];
const LANDING: [number, number] = [24, -10];
// Départ entre le module d'atterrissage et le site d'Apollo 11, tourné vers le site.
const START: [number, number] = [LANDING[0] - 12, LANDING[1] + 5];

/** Position de la Terre dans le ciel lunaire (mise en scène). */
export const EARTH_IN_SKY = new THREE.Vector3(-60, 120, -160);

export const moonMachines = { lm: LM, easep: EASEP, lrrr: LRRR };

/** Étage de descente du module lunaire, resté sur place. */
function DescentStage() {
  return (
    <group>
      <mesh position={[0, 1.6, 0]} material={toon('#c9a24a')} castShadow>
        <cylinderGeometry args={[2.1, 2.1, 1.6, 8]} />
        <Outlines thickness={0.05} color="#1a1033" />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <group key={i}>
            <mesh position={[Math.cos(a) * 2.6, 0.8, Math.sin(a) * 2.6]} rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]} material={toon('#c9ced6')} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 2.2, 6]} />
            </mesh>
            <mesh position={[Math.cos(a) * 3.2, 0.05, Math.sin(a) * 3.2]} material={toon('#c9ced6')}>
              <cylinderGeometry args={[0.45, 0.45, 0.1, 10]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Reflector() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} rotation={[-0.5, 0, 0]} material={toon('#8e98a6')} castShadow>
        <boxGeometry args={[0.65, 0.06, 0.5]} />
        <Outlines thickness={0.02} color="#1a1033" />
      </mesh>
      <mesh position={[0, 0.25, 0.1]} material={toon('#c9ced6')}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
      </mesh>
    </group>
  );
}

function Seismometer() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} material={toon('#c9a24a')} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <Outlines thickness={0.02} color="#1a1033" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.9, 0.5, 0]} material={toon('#3a5aa8')} castShadow>
          <boxGeometry args={[1, 0.03, 0.5]} />
        </mesh>
      ))}
    </group>
  );
}

function EarthInSky() {
  const map = useTexture('/textures/earth_color.jpg');
  map.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={EARTH_IN_SKY}>
      <sphereGeometry args={[14, 48, 48]} />
      <meshToonMaterial map={map} gradientMap={toonGradient()} fog={false} />
      <Outlines thickness={0.5} color="#0b0d26" />
    </mesh>
  );
}

/** Tir laser : la lumière part de la Terre, touche le réflecteur et revient (~2,5 s aller-retour). */
export const laser = { firing: false, t0: 0 };
function LaserShot({ field }: { field: ReturnType<typeof moonField> }) {
  const pulse = useRef<THREE.Mesh>(null!);
  const beam = useRef<THREE.Mesh>(null!);
  const target = useMemo(() => new THREE.Vector3(LRRR[0], field.heightAt(...LRRR) + 0.5, LRRR[1]), [field]);
  useFrame(() => {
    const on = laser.firing;
    pulse.current.visible = on;
    beam.current.visible = on;
    if (!on) return;
    const t = performance.now() / 1000 - laser.t0;
    if (t > 2.5) {
      laser.firing = false;
      return;
    }
    const f = t < 1.25 ? t / 1.25 : (2.5 - t) / 1.25;
    pulse.current.position.copy(EARTH_IN_SKY).lerp(target, f);
  });
  const beamGeom = useMemo(() => {
    const dir = target.clone().sub(EARTH_IN_SKY);
    const g = new THREE.CylinderGeometry(0.08, 0.08, dir.length(), 6, 1, true);
    g.translate(0, dir.length() / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
    g.translate(EARTH_IN_SKY.x, EARTH_IN_SKY.y, EARTH_IN_SKY.z);
    return g;
  }, [target]);
  return (
    <>
      <mesh ref={beam} geometry={beamGeom} visible={false}>
        <meshBasicMaterial color="#4be08a" transparent opacity={0.35} toneMapped={false} fog={false} />
      </mesh>
      <mesh ref={pulse} visible={false}>
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshBasicMaterial color="#b6ffd2" toneMapped={false} fog={false} />
      </mesh>
    </>
  );
}

export default function MoonWorld({ animate }: { animate: boolean }) {
  const field = useMemo(() => moonField(), []);
  const phase = useWorld((s) => s.phase);
  const setNear = useWorld((s) => s.setNear);
  const flame = useRef(0);
  const lander = useRef<THREE.Group>(null!);
  const landingY = field.heightAt(...LANDING);
  const obstacles = useMemo<Obstacle[]>(() => [{ x: LANDING[0], z: LANDING[1], r: 2.2 }, { x: LM[0], z: LM[1], r: 3.4 }, { x: EASEP[0], z: EASEP[1], r: 1.4 }, { x: LRRR[0], z: LRRR[1], r: 0.7 }], []);
  const last = useRef(0);

  useFrame(({ clock }) => {
    flame.current = ship.flame;
    lander.current.position.y = landingY + ship.y;
    if (clock.elapsedTime - last.current > 0.1) {
      last.current = clock.elapsedTime;
      const spots: [string, [number, number]][] = [['apollo-11-lm', LM], ['apollo-11-easep', EASEP], ['apollo-11', LRRR]];
      let near: string | null = null;
      let best = 7;
      for (const [id, [x, z]] of spots) {
        const d = Math.hypot(x - player.x, z - player.z);
        if (d < best) {
          best = d;
          near = id;
        }
      }
      setNear(phase === 'drive' ? near : null);
    }
  });

  const at = (p: [number, number]) => [p[0], field.heightAt(...p), p[1]] as [number, number, number];
  return (
    <>
      <color attach="background" args={[PALETTES.moon.sky]} />
      <Stars radius={300} depth={60} count={4000} factor={5} fade speed={animate ? 0.3 : 0} />
      <hemisphereLight args={['#c9d4ff', '#202024', 0.35]} />
      <SunLight color="#ffffff" intensity={3.2} dir={[0.85, 0.5, 0.25]} />
      <TerrainMesh field={field} colors={PALETTES.moon.ground} segments={200} />
      <Rocks field={field} color={PALETTES.moon.rock} count={220} seed={9} avoid={[[0, 8, 16], [LANDING[0], LANDING[1], 8]]} />
      <EarthInSky />
      <LaserShot field={field} />

      <group position={at(LM)}>
        <DescentStage />
      </group>
      <group position={at(EASEP)}>
        <Seismometer />
      </group>
      <group position={at(LRRR)}>
        <Reflector />
        <Beacon active y={1.4} />
      </group>

      <group ref={lander} position={[LANDING[0], landingY, LANDING[1]]}>
        <ToonLander flame={flame} />
      </group>
      <Player field={field} start={START} startHeading={1.25} obstacles={obstacles} enabled={phase === 'drive'} followCamera={phase === 'drive'} animate={animate} visible={phase === 'drive'} />
      {phase !== 'drive' && <ShipCamera at={[LANDING[0], landingY, LANDING[1]]} ship={ship} animate={animate} />}
    </>
  );
}
