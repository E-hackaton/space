import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, Html, PerformanceMonitor, Sparkles, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Player, player, type Obstacle } from '../../world/Player';
import { TerrainMesh } from '../../world/TerrainMesh';
import { Pebbles, Rocks, SkyDome, SunLight, scatterRocks, corridor } from '../../world/props/Environment';
import { DustTrail } from '../../world/props/DustTrail';
import { Look } from '../../world/Look';
import { PALETTES } from '../../world/toon';
import { Machine3D } from '../../components/3d/Machine3D';
import { expeditionField, FIND_DIST, sizeOf, type Site } from '../../world/expeditionLayout';
import type { HeightField } from '../../world/terrain';
import type { SurfaceBody } from '../../lib/atlas';
import { useExpedition } from './expedition';

/** Balise d'un objet : colonne de lumière visible de loin, anneau au sol, nom quand on approche. */
function Checkpoint({ site, y, selected, found, animate }: { site: Site; y: number; selected: boolean; found: boolean; animate: boolean }) {
  const active = site.machine.status === 'active';
  const color = selected ? '#ffffff' : active ? '#4BE08A' : '#E0A458';
  const ring = useRef<THREE.Mesh>(null!);
  const pillar = useRef<THREE.Mesh>(null!);
  const tag = useRef<HTMLDivElement>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const k = animate && active ? (t * 0.6) % 1 : 0.4;
    ring.current.scale.setScalar(1 + k * 1.2);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k);
    (pillar.current.material as THREE.MeshBasicMaterial).opacity = (found ? 0.12 : 0.28) + (active && animate ? Math.sin(t * 3) * 0.08 : 0) + (selected ? 0.2 : 0);
    if (tag.current) {
      const d = Math.hypot(site.x - player.x, site.z - player.z);
      tag.current.style.opacity = d < 140 ? String(Math.min(1, (140 - d) / 40)) : '0';
    }
  });
  return (
    <group position={[site.x, y, site.z]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <ringGeometry args={[5, 5.6, 64]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={pillar} position={[0, 30, 0]}>
        <cylinderGeometry args={[0.35, 1.2, 60, 16, 1, true]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, sizeOf(site.machine.id) + 3, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={tag} className={`ground-tag ${active ? 'ground-tag-active' : 'ground-tag-dormant'}`}>
          <span aria-hidden="true">{active ? '●' : '◐'}</span> {site.machine.name}
          {found && <span aria-hidden="true"> ✓</span>}
        </div>
      </Html>
    </group>
  );
}

/** Pendant une histoire : la caméra tourne lentement autour de la machine qui parle. */
function StoryCamera({ site, field, animate }: { site?: Site; field: HeightField; animate: boolean }) {
  const { camera } = useThree();
  const a = useRef(0);
  const look = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    if (!site) return;
    a.current += dt * (animate ? 0.12 : 0);
    const s = sizeOf(site.machine.id);
    const r = 6 + s * 1.6;
    const y = field.heightAt(site.x, site.z);
    const want = new THREE.Vector3(site.x + Math.cos(a.current + 0.7) * r, y + 2.5 + s * 0.7, site.z + Math.sin(a.current + 0.7) * r);
    const k = 1 - Math.exp(-dt * 1.8);
    camera.position.lerp(want, k);
    look.current.lerp(new THREE.Vector3(site.x, y + s * 0.4, site.z), k);
    camera.up.set(0, 1, 0);
    camera.lookAt(look.current);
  });
  return null;
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
export default function ExpeditionGround({ body, sites, start, startHeading, animate }: Props) {
  const field = useMemo(() => expeditionField(body, sites), [body, sites]);
  const story = useExpedition((s) => s.story);
  const target = useExpedition((s) => s.target);
  const found = useExpedition((s) => s.found);
  const effect = useExpedition((s) => s.effect);
  const [dpr, setDpr] = useState(1.5);
  const [shadows, setShadows] = useState(true);
  const pal = PALETTES[body];
  const rocks = useMemo(
    () =>
      scatterRocks(field, body === 'moon' ? 420 : 900, body === 'moon' ? 9 : 4, [
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
      shadows={shadows ? { type: THREE.PCFSoftShadowMap } : false}
      dpr={dpr}
      camera={{ fov: 46, near: 0.1, far: 1400, position: [start[0], 30, start[1] + 40] }}
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

      <TerrainMesh field={field} colors={pal.ground} segments={360} />
      <Rocks rocks={rocks} color={pal.rock} seed={body === 'moon' ? 9 : 4} />
      <Pebbles field={field} color={pal.rock} count={body === 'moon' ? 6000 : 8000} seed={body === 'moon' ? 3 : 8} minSize={0.15} maxSize={1.1} avoid={sites.map((s) => [s.x, s.z, 8] as [number, number, number])} />
      {body === 'moon' ? (
        <DustTrail field={field} color="#f4f6fb" gravity={1.62} drag={0} active={!story} />
      ) : (
        <DustTrail field={field} color="#c98a5a" gravity={3.71} drag={0.8} active={!story} />
      )}

      {sites.map((s) => {
        const y = field.heightAt(s.x, s.z);
        const flying = s.machine.id === story && effect === 'flight';
        return (
          <group key={s.machine.id}>
            <group position={[s.x, y, s.z]} rotation={[0, (s.machine.id.length * 1.3) % (Math.PI * 2), 0]}>
              <Suspense fallback={null}>
                <group position={[0, flying ? 2 : 0, 0]}>
                  <Machine3D id={s.machine.id} kind={s.machine.kind} active={s.machine.status === 'active'} size={sizeOf(s.machine.id)} flying={flying} />
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
      <Player field={field} start={start} startHeading={startHeading} obstacles={obstacles} enabled={!story} followCamera={!story} animate={animate} />
      {storySite && <StoryCamera site={storySite} field={field} animate={animate} />}
    </Canvas>
  );
}
