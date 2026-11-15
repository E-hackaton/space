import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, Html, OrbitControls, PerformanceMonitor, Sparkles, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { Player, player, type Obstacle } from '../../world/Player';
import { TerrainMesh, heightRange } from '../../world/TerrainMesh';
import { extendField } from '../../world/infiniteGround';
import { Pebbles, Rocks, SkyDome, SunLight, scatterRocks, corridor } from '../../world/props/Environment';
import { DustTrail } from '../../world/props/DustTrail';
import { Look } from '../../world/Look';
import { ContextGuard, useCanvasGeneration } from '../../components/3d/ContextGuard';
import { PALETTES } from '../../world/toon';
import { Machine3D } from '../../components/3d/Machine3D';
import { expeditionField, FIND_DIST, sizeOf, type Site } from '../../world/expeditionLayout';
import type { HeightField } from '../../world/terrain';
import type { SurfaceBody } from '../../lib/atlas';
import { useExpedition } from './expedition';
import { ToonLander } from '../../world/props/Vehicles';
import { playLanding } from '../../audio/sfx';

const NO_FLAME = { current: 0 };
import { useParts } from '../../components/3d/InteractiveParts';

/**
 * Repère d'un objet : un petit losange suspendu bien au-dessus de la machine, visible de loin,
 * qui s'efface quand on approche (rien autour de la machine elle-même, pour bien la voir).
 */
function Checkpoint({ site, y, selected, found, animate }: { site: Site; y: number; selected: boolean; found: boolean; animate: boolean }) {
  const active = site.machine.status === 'active';
  const color = selected ? '#ffffff' : active ? '#4BE08A' : '#E0A458';
  const gem = useRef<THREE.Mesh>(null!);
  const tag = useRef<HTMLDivElement>(null);
  const top = sizeOf(site.machine.id) + 9;
  useFrame(({ clock }) => {
    const d = Math.hypot(site.x - player.x, site.z - player.z);
    const far = THREE.MathUtils.clamp((d - 20) / 15, 0, 1);
    gem.current.visible = far > 0.02;
    gem.current.scale.setScalar(far * (selected ? 1.6 : 1.1));
    gem.current.rotation.y = animate ? clock.elapsedTime * 1.2 : 0;
    gem.current.position.y = top + (animate && active ? Math.sin(clock.elapsedTime * 2) * 0.4 : 0);
    if (tag.current) tag.current.style.opacity = d < 140 && d > 6 ? String(Math.min(1, (140 - d) / 40)) : '0';
  });
  return (
    <group position={[site.x, y, site.z]}>
      <mesh ref={gem}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={found ? 0.55 : 1} />
      </mesh>
      <Html position={[0, top + 2.2, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={tag} className={`ground-tag ${active ? 'ground-tag-active' : 'ground-tag-dormant'}`}>
          <span aria-hidden="true">{active ? '●' : '◐'}</span> {site.machine.name}
          {found && <span aria-hidden="true"> ✓</span>}
        </div>
      </Html>
    </group>
  );
}

/**
 * Pendant une histoire : la caméra vient se placer près de la machine, puis on la manipule
 * soi-même (glisser pour tourner, molette ou pincement pour zoomer) ; sinon elle tourne lentement.
 */
function StoryCamera({ site, field, animate }: { site?: Site; field: HeightField; animate: boolean }) {
  const { camera } = useThree();
  const [settled, setSettled] = useState(false);
  const [spin, setSpin] = useState(true);
  const look = useRef(new THREE.Vector3());
  const s = site ? sizeOf(site.machine.id) : 3;
  const centre = useMemo(() => (site ? new THREE.Vector3(site.x, field.heightAt(site.x, site.z) + s * 0.35, site.z) : new THREE.Vector3()), [site, field, s]);
  useEffect(() => {
    setSettled(false);
    setSpin(true);
  }, [site]);
  useFrame((_, dt) => {
    if (!site || settled) return;
    const r = 4 + s * 1.4;
    const want = new THREE.Vector3(site.x + Math.cos(0.7) * r, centre.y + 1.5 + s * 0.5, site.z + Math.sin(0.7) * r);
    const k = 1 - Math.exp(-dt * 2.4);
    camera.position.lerp(want, k);
    look.current.lerp(centre, k);
    camera.up.set(0, 1, 0);
    camera.lookAt(look.current);
    if (camera.position.distanceTo(want) < 0.3) setSettled(true);
  });
  // Double-clic sur une pièce : la caméra vole vers elle (comme dans les figures de docs/mars1).
  const controls = useThree((st) => st.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  useFrame((_, dt) => {
    const f = useParts.getState().focus;
    if (!f || !controls || !settled) return;
    const k = 1 - Math.exp(-dt * 3);
    controls.target.lerp(f.point, k);
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.lerp(controls.target.clone().addScaledVector(dir, f.dist), k);
    controls.update();
    if (controls.target.distanceTo(f.point) < 0.02) useParts.getState().setFocus(null);
  });
  if (!site || !settled) return null;
  return (
    <OrbitControls
      makeDefault
      target={centre}
      enablePan={false}
      enableDamping
      minDistance={0.6}
      maxDistance={s * 6 + 10}
      maxPolarAngle={Math.PI * 0.49}
      autoRotate={animate && spin}
      onStart={() => setSpin(false)}
      autoRotateSpeed={0.5}
      zoomSpeed={0.8}
    />
  );
}

function EarthInSky() {
  const map = useTexture('/textures/earth_color.jpg');
  map.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={[-140, 170, -330]}>
      <sphereGeometry args={[26, 48, 48]} />
      <meshStandardMaterial map={map} emissive="#ffffff" emissiveMap={map} emissiveIntensity={0.25} fog={false} />
    </mesh>
  );
}

/** Détecte la machine la plus proche du véhicule. */
function NearWatcher({ sites }: { sites: Site[] }) {
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.15) return;
    last.current = clock.elapsedTime;
    let best: string | null = null;
    let bestD = FIND_DIST;
    for (const s of sites) {
      const d = Math.hypot(s.x - player.x, s.z - player.z);
      if (d < bestD) {
        bestD = d;
        best = s.machine.id;
      }
    }
    useExpedition.getState().setNear(best);
  });
  return null;
}

interface Props {
  body: SurfaceBody;
  sites: Site[];
  start: [number, number];
  startHeading: number;
  animate: boolean;
}

/** L'expédition au sol : on roule de machine en machine sur la Lune ou sur Mars. */
/**
 * Arrivée en plusieurs temps, sans précipitation :
 *  1. descente du module sur sa rétrofusée (caméra de côté, qui le suit) ;
 *  2. contact avec le sol : moteur coupé, nuage de poussière ;
 *  3. le rover sort du module et roule lentement jusqu'à son point de départ ;
 *  4. courte pause, puis l'expédition commence (pilote auto ou manuel).
 */
const T_DESCENT = 5.5;
const T_SETTLE = 7.2;
const T_ROLL = 10.5;
const T_END = 12;

function Landing({ field, at, to, animate, onStage }: { field: HeightField; at: [number, number]; to: [number, number]; animate: boolean; onStage: (s: 'deploy' | 'done') => void }) {
  const lander = useRef<THREE.Group>(null!);
  const flame = useRef(1);
  const dust = useRef<THREE.Group>(null!);
  const t0 = useRef<number | null>(null);
  const stage = useRef<'descent' | 'deploy' | 'done'>('descent');
  const look = useRef(new THREE.Vector3());
  const ground = field.heightAt(at[0], at[1]);
  // Point de vue latéral, qui voit à la fois le module et le chemin du rover.
  const side = useMemo(() => {
    const dx = to[0] - at[0];
    const dz = to[1] - at[1];
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;
    const mid = [(at[0] + to[0]) / 2, (at[1] + to[1]) / 2] as const;
    return new THREE.Vector3(mid[0] + nx * 17 - (dx / len) * 4, ground + 6, mid[1] + nz * 17 - (dz / len) * 4);
  }, [at, to, ground]);
  const heading = Math.atan2(-(to[0] - at[0]), -(to[1] - at[1]));
  useEffect(() => {
    if (animate) playLanding(soundWorld.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(({ clock, camera }, dt) => {
    t0.current ??= clock.elapsedTime;
    const t = (clock.elapsedTime - t0.current) / (animate ? 1 : 0.12);
    // 1. Descente : rapide en haut, freinée près du sol.
    const k = Math.min(1, t / T_DESCENT);
    const y = 80 * Math.pow(1 - k, 2.4);
    lander.current.position.y = ground + y;
    flame.current = t < T_DESCENT ? 1 : Math.max(0, 1 - (t - T_DESCENT) / 0.7);
    // 2. Poussière soulevée au contact.
    const puff = THREE.MathUtils.clamp((t - (T_DESCENT - 0.4)) / 1.8, 0, 1);
    dust.current.visible = puff > 0 && puff < 1;
    dust.current.scale.setScalar(1 + puff * 3);
    dust.current.children.forEach((c) => (((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - puff)));
    // 3. Le rover sort du module et roule jusqu'à son point de départ.
    if (t >= T_SETTLE && stage.current === 'descent') {
      stage.current = 'deploy';
      onStage('deploy');
    }
    if (stage.current !== 'descent') {
      const r = THREE.MathUtils.smoothstep(t, T_SETTLE, T_ROLL);
      player.x = THREE.MathUtils.lerp(at[0], to[0], r);
      player.z = THREE.MathUtils.lerp(at[1], to[1], r);
      player.heading = heading;
      player.speed = r > 0 && r < 1 ? 2 : 0;
    }
    if (t >= T_END && stage.current === 'deploy') {
      stage.current = 'done';
      onStage('done');
    }
    // Caméra : suit la descente de côté, puis cadre le module et le rover.
    const want =
      stage.current === 'descent'
        ? new THREE.Vector3(at[0] + 24, ground + 6 + y * 0.6, at[1] + 24)
        : side;
    const target = stage.current === 'descent' ? new THREE.Vector3(at[0], ground + y + 3, at[1]) : new THREE.Vector3(player.x, ground + 1.5, player.z).lerp(new THREE.Vector3(at[0], ground + 2, at[1]), 0.35);
    const s = animate ? 1 - Math.exp(-dt * 2.5) : 1;
    camera.position.lerp(want, s);
    look.current.lerp(target, s);
    camera.up.set(0, 1, 0);
    camera.lookAt(look.current);
  });
  return (
    <>
      <group ref={lander} position={[at[0], ground + 80, at[1]]}>
        <ToonLander flame={flame} />
      </group>
      <group ref={dust} position={[at[0], ground + 0.4, at[1]]} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, i]} position={[0, i * 0.3, 0]}>
            <ringGeometry args={[1.2 + i * 0.8, 3 + i * 1.2, 40]} />
            <meshBasicMaterial color={soundWorld.current === 'moon' ? '#c9ccd2' : '#c98a5a'} transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </>
  );
}
const soundWorld = { current: 'mars' as 'mars' | 'moon' };

export default function ExpeditionGround({ body, sites, start, startHeading, animate }: Props) {
  soundWorld.current = body;
  // Le module se pose à côté du point de départ ; le rover en sort une fois posé.
  const [arrival, setArrival] = useState<'descent' | 'deploy' | 'done'>('descent');
  const landed = arrival === 'done';
  const landerAt = useMemo<[number, number]>(() => [start[0] + 9, start[1] + 6], [start]);
  // Terrain détaillé (zone des machines), prolongé à l'infini par un relief lointain.
  const inner = useMemo(() => expeditionField(body, sites), [body, sites]);
  const field = useMemo(() => extendField(inner, { amp: body === 'moon' ? 7 : 10, freq: 0.004, craterCell: 220, roam: 1900, seed: body === 'moon' ? 11 : 3 }), [inner, body]);
  const range = useMemo(() => heightRange(field, inner.half), [field, inner]);
  const story = useExpedition((s) => s.story);
  const target = useExpedition((s) => s.target);
  const found = useExpedition((s) => s.found);
  const effect = useExpedition((s) => s.effect);
  const quality = useStore((st) => st.quality);
  const maxDpr = quality === 'high' ? Math.min(2, window.devicePixelRatio || 1) : quality === 'low' ? 1 : Math.min(1.25, window.devicePixelRatio || 1);
  const [dpr, setDpr] = useState(maxDpr);
  const [gen, bump] = useCanvasGeneration();
  const [shadows, setShadows] = useState(quality !== 'low');
  const pal = PALETTES[body];
  const rocks = useMemo(
    () =>
      scatterRocks(inner, body === 'moon' ? 300 : 450, body === 'moon' ? 9 : 4, [
        ...sites.map((s) => [s.x, s.z, 18] as [number, number, number]),
        [start[0], start[1], 12],
        ...sites.flatMap((s, i) => (i ? corridor([sites[i - 1].x, sites[i - 1].z], [s.x, s.z], 7) : [])),
        ...(sites[0] ? corridor(start, [sites[0].x, sites[0].z], 7) : []),
      ]),
    [field, body, sites, start],
  );
  const obstacles = useMemo<Obstacle[]>(() => [...sites.map((s) => ({ x: s.x, z: s.z, r: sizeOf(s.machine.id) * 0.45 + 0.6 })), ...rocks.obstacles], [sites, rocks]);
  const storySite = sites.find((s) => s.machine.id === story);

  return (
    <Canvas
      key={gen}
      shadows={shadows ? { type: THREE.PCFSoftShadowMap } : false}
      dpr={dpr}
      camera={{ fov: 46, near: 0.1, far: 3000, position: [start[0], 30, start[1] + 40] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: body === 'moon' ? 0.82 : 1 }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setShadows(false);
        }}
      />
      <AdaptiveDpr pixelated />
      <ContextGuard onLost={bump} />
      {body === 'moon' ? (
        <>
          <color attach="background" args={[pal.sky]} />
          <Stars radius={500} depth={80} count={5000} factor={7} fade speed={animate ? 0.3 : 0} />
          <hemisphereLight args={['#c9d4ff', '#101014', 0.18]} />
          <SunLight color="#ffffff" intensity={2.6} dir={[0.85, 0.32, 0.25]} shadows={shadows} />
          <Suspense fallback={null}>
            <EarthInSky />
          </Suspense>
        </>
      ) : (
        <>
          <SkyDome bottom="#e8b27a" top="#8a5a48" radius={900} />
          <color attach="background" args={[pal.sky]} />
          <fog attach="fog" args={[pal.fog, 90, 420]} />
          <hemisphereLight args={['#ffd9b0', '#5a2a18', 0.85]} />
          <SunLight color="#ffe2c2" intensity={2.3} dir={[-0.7, 0.6, 0.45]} shadows={shadows} />
          <Sparkles count={700} scale={[600, 16, 600]} position={[0, 7, 0]} size={3} speed={animate ? 0.5 : 0} color="#e4a774" opacity={0.6} />
        </>
      )}
      <Look tint={body === 'moon' ? '#ffffff' : '#ffd9b0'} ground={body === 'moon' ? '#3a3c42' : '#6a3420'} bloom={0.55} effects={shadows} />

      <TerrainMesh field={field} extent={inner.half} range={range} colors={pal.ground} segments={240} detail={body === 'moon' ? 'regolith' : 'sand'} tile={6} />
      {/* Le sol continue jusqu'à l'horizon */}
      <TerrainMesh field={field} extent={2400} warp holeHalf={inner.half - 1} range={range} colors={pal.ground} segments={160} detail={body === 'moon' ? 'regolith' : 'sand'} tile={6} />
      <Rocks rocks={rocks} color={pal.rock} seed={body === 'moon' ? 9 : 4} />
      <Pebbles field={inner} color={pal.rock} count={body === 'moon' ? 2500 : 3500} seed={body === 'moon' ? 3 : 8} minSize={0.15} maxSize={1.1} avoid={sites.map((s) => [s.x, s.z, 8] as [number, number, number])} />
      {body === 'moon' ? (
        <DustTrail field={field} color="#c3c6cc" gravity={1.62} drag={0} active={!story} />
      ) : (
        <DustTrail field={field} color="#b97a4e" gravity={3.71} drag={0.8} active={!story} />
      )}

      {sites.map((s) => {
        const y = field.heightAt(s.x, s.z);
        const flying = s.machine.id === story && effect === 'flight';
        return (
          <group key={s.machine.id}>
            <group position={[s.x, y, s.z]} rotation={[0, (s.machine.id.length * 1.3) % (Math.PI * 2), 0]}>
              <Suspense fallback={null}>
                <group position={[0, flying ? 2 : 0, 0]}>
                  <Machine3D id={s.machine.id} kind={s.machine.kind} active={s.machine.status === 'active'} size={sizeOf(s.machine.id)} flying={flying} annotated={s.machine.id === story} />
                </group>
              </Suspense>
            </group>
            <Checkpoint site={s} y={y} selected={s.machine.id === target} found={found.includes(s.machine.id)} animate={animate} />
          </group>
        );
      })}
      {storySite && effect === 'dust-storm' && (
        <Sparkles position={[storySite.x, field.heightAt(storySite.x, storySite.z) + 4, storySite.z]} count={400} scale={[30, 10, 30]} size={8} speed={animate ? 2 : 0} color="#d9894f" opacity={0.9} noise={3} />
      )}

      <NearWatcher sites={sites} />
      {landed ? (
        <group position={[landerAt[0], field.heightAt(landerAt[0], landerAt[1]), landerAt[1]]}>
          <ToonLander flame={NO_FLAME} />
        </group>
      ) : (
        <Landing field={field} at={landerAt} to={start} animate={animate} onStage={setArrival} />
      )}
      <Player field={field} start={start} startHeading={startHeading} obstacles={landed ? [...obstacles, { x: landerAt[0], z: landerAt[1], r: 2.4 }] : []} enabled={landed && !story} followCamera={landed && !story} visible={arrival !== 'descent'} animate={animate} />
      {storySite && <StoryCamera site={storySite} field={field} animate={animate} />}
    </Canvas>
  );
}
