import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Player, player, type Obstacle } from '../Player';
import { Beacon, ToonLander } from '../props/Vehicles';
import { Rocks, ShipCamera, SunLight, corridor, scatterRocks } from '../props/Environment';
import { DustTrail } from '../props/DustTrail';
import { TerrainMesh } from '../TerrainMesh';
import { moonField } from '../terrain';
import { PALETTES } from '../toon';
import { Atmosphere } from '../../components/3d/Atmosphere';
import { AnatomyModel, type Label } from '../anatomy/AnatomyModel';
import { Retroreflector } from '../props/Retroreflector';
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
// Cap de départ : le rover regarde le module d'Apollo 11 (l'avant du rover est vers −Z).
const START_HEADING = Math.atan2(-(LM[0] - START[0]), -(LM[1] - START[1]));

/** Position de la Terre dans le ciel lunaire (mise en scène). */
export const EARTH_IN_SKY = new THREE.Vector3(-60, 120, -160);

export const moonMachines = { lm: LM, easep: EASEP, lrrr: LRRR };

/*
 * Machines d'Apollo 11 dessinées pièce par pièce (figures FORBITS Anatomy, vraies cotes) :
 * l'étage de descente d'Eagle (l'étage de remontée est reparti), le réflecteur laser et le sismomètre.
 */
const LM_LABELS: Label[] = [
  { piece: 'descent', label: 'parts.descentStage' },
  { piece: 'gear', label: 'parts.landingLegs' },
  { piece: 'gear.pad0', label: 'parts.footpad' },
  { piece: 'ladder', label: 'parts.ladder' },
];
const PSEP_LABELS: Label[] = [
  { piece: 'psep.body', label: 'parts.seismometer' },
  { piece: 'psep.panel1', label: 'parts.seismoPanels' },
];

function EarthInSky() {
  const map = useTexture('/textures/earth_color.jpg');
  map.colorSpace = THREE.SRGBColorSpace;
  const sunDir = useMemo(() => new THREE.Vector3(0.85, 0.5, 0.25).normalize(), []);
  return (
    <group position={EARTH_IN_SKY}>
      <mesh>
        <sphereGeometry args={[14, 64, 64]} />
        <meshStandardMaterial map={map} roughness={0.9} fog={false} emissive="#ffffff" emissiveMap={map} emissiveIntensity={0.2} />
      </mesh>
      <Atmosphere radius={14} color="#6fb4ff" sunDir={sunDir} scale={1.07} power={2.2} intensity={1.8} />
    </group>
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
  const near = useWorld((s) => s.near);
  const part = useWorld((s) => s.part);
  const flame = useRef(0);
  const lander = useRef<THREE.Group>(null!);
  const landingY = field.heightAt(...LANDING);
  // Rochers partout, sauf sur le site d'Apollo 11, autour du vaisseau et sur le chemin qui y mène.
  const rocks = useMemo(
    () => scatterRocks(field, 220, 9, [[0, 8, 16], [LANDING[0], LANDING[1], 8], ...corridor(LANDING, START, 4), ...corridor(START, LM, 4)]),
    [field],
  );
  const obstacles = useMemo<Obstacle[]>(
    () => [{ x: LANDING[0], z: LANDING[1], r: 2.2 }, { x: LM[0], z: LM[1], r: 4.4 }, { x: EASEP[0], z: EASEP[1], r: 1.4 }, { x: LRRR[0], z: LRRR[1], r: 0.7 }, ...rocks.obstacles],
    [rocks],
  );
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
      <TerrainMesh field={field} colors={PALETTES.moon.ground} segments={200} detail="regolith" tile={5} />
      <Rocks rocks={rocks} color={PALETTES.moon.rock} seed={9} />
      {/* Poussière des roues : sans air, elle suit une parabole parfaite (pesanteur lunaire 1,62 m/s²). */}
      <DustTrail field={field} color="#c3c6cc" gravity={1.62} drag={0} active={phase === 'drive'} />
      <EarthInSky />
      {/* Fine poussière de régolithe soulevée, très discrète */}
      <Sparkles count={60} scale={[60, 3, 60]} position={[0, 1.5, 0]} size={2} speed={animate ? 0.15 : 0} color="#e8ecf5" opacity={0.5} />
      <LaserShot field={field} />

      <group position={at(LM)}>
        <AnatomyModel id="lunar-module" excludeGroups={['asc', 'flag']} exclude={['lrrr', 'psep']} labels={LM_LABELS} annotated={near === 'apollo-11-lm'} focusPart={near === 'apollo-11-lm' ? part : null} />
      </group>
      <group position={at(EASEP)}>
        <AnatomyModel id="lunar-module" pieces={['psep']} labels={PSEP_LABELS} annotated={near === 'apollo-11-easep'} focusPart={near === 'apollo-11-easep' ? part : null} />
      </group>
      <group position={at(LRRR)}>
        <Retroreflector variant="a11" annotated={near === 'apollo-11'} />
        <Beacon active y={1.4} />
      </group>

      <group ref={lander} position={[LANDING[0], landingY, LANDING[1]]}>
        <ToonLander flame={flame} />
      </group>
      <Player field={field} start={START} startHeading={START_HEADING} obstacles={obstacles} enabled={phase === 'drive'} followCamera={phase === 'drive'} animate={animate} visible={phase === 'drive'} />
      {phase !== 'drive' && <ShipCamera at={[LANDING[0], landingY, LANDING[1]]} ship={ship} animate={animate} />}
    </>
  );
}
