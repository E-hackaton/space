import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { Player, player, type Obstacle } from '../Player';
import { ToonLander } from '../props/Vehicles';
import { Pebbles, Rocks, ShipCamera, SkyDome, SunLight, scatterRocks } from '../props/Environment';
import { DustTrail } from '../props/DustTrail';
import { Flights, Traverse, machinePositions, replay } from '../Replay';
import { TerrainMesh, heightRange } from '../TerrainMesh';
import { extendField } from '../infiniteGround';
import { siteField, type SiteData } from '../terrain';
import { PALETTES } from '../toon';
import { preloadModel, type ModelId } from '../../components/3d/NasaModel';
import { ship, useWorld } from '../state';

const cache = new Map<string, SiteData>();

/** Charge les trajets d'un site (fichier produit à partir des données NASA/JPL). */
export function useSiteData(site: string): SiteData | null {
  const [data, setData] = useState<SiteData | null>(cache.get(site) ?? null);
  useEffect(() => {
    if (cache.has(site)) return setData(cache.get(site)!);
    let alive = true;
    fetch(`/data/${site}.json`)
      .then((r) => r.json())
      .then((d: SiteData) => {
        cache.set(site, d);
        if (alive) setData(d);
      });
    return () => {
      alive = false;
    };
  }, [site]);
  return data;
}

/** Les machines de chaque site (identifiants des trajets dans les données). */
export const SITE_MACHINES: Record<'jezero' | 'gale', { rovers: { id: string; model: ModelId }[]; helis: { id: string; carrier: string }[] }> = {
  jezero: { rovers: [{ id: 'perseverance', model: 'perseverance' }], helis: [{ id: 'ingenuity', carrier: 'perseverance' }] },
  gale: { rovers: [{ id: 'curiosity', model: 'curiosity' }], helis: [] },
};

/** Fin des données pour un site (dernier sol connu). */
export function lastSol(data: SiteData): number {
  return Math.max(...Object.values(data.paths).map((p) => p[p.length - 1][3]), ...Object.values(data.flights).map((f) => f[f.length - 1].sol));
}

function DustMotes({ animate }: { animate: boolean }) {
  const g = useRef<THREE.Group>(null!);
  useFrame(() => g.current.position.set(player.x, 0, player.z));
  return (
    <group ref={g}>
      <Sparkles count={120} scale={[70, 10, 70]} position={[0, 5, 0]} size={3} speed={animate ? 0.6 : 0} color="#ffd2a8" opacity={0.7} />
    </group>
  );
}

export default function MarsWorld({ site, animate }: { site: 'jezero' | 'gale'; animate: boolean }) {
  const data = useSiteData(site);
  if (!data) return <SkyDome bottom={PALETTES.mars.sky} top="#7a4a3a" />;
  return <MarsSite data={data} site={site} animate={animate} />;
}

function MarsSite({ data, site, animate }: { data: SiteData; site: 'jezero' | 'gale'; animate: boolean }) {
  // Site martien (détaillé, 1 unité = 40 m), prolongé à l'infini par un relief lointain.
  const inner = useMemo(() => siteField(data), [data]);
  const field = useMemo(() => extendField(inner, { amp: 0.6, freq: 0.06, craterCell: 8, roam: 600, seed: 3 }), [inner]);
  const range = useMemo(() => heightRange(field, inner.half), [field, inner]);
  const phase = useWorld((s) => s.phase);
  const setSol = useWorld((s) => s.setSol);
  const setNear = useWorld((s) => s.setNear);
  const machines = SITE_MACHINES[site];
  const end = useMemo(() => lastSol(data), [data]);

  // Point d'atterrissage : début du premier trajet (le vrai site d'atterrissage).
  const landing = useMemo(() => {
    const first = Object.values(data.paths)[0][0];
    const [x, z] = field.toWorld(first[0], first[1]);
    return [x + 8, field.heightAt(x + 8, z + 6), z + 6] as [number, number, number];
  }, [data, field]);
  const start = useMemo<[number, number]>(() => [landing[0] - 6, landing[2] + 4], [landing]);

  const rocks = useMemo(
    () => scatterRocks(inner, 850, site === 'gale' ? 5 : 2, [[landing[0], landing[2], 10], [start[0], start[1], 5]]),
    [field, site, landing, start],
  );
  // Ordre important : [atterrisseur, rovers (positions mises à jour par Traverse), rochers].
  const obstacles = useMemo<Obstacle[]>(
    () => [{ x: landing[0], z: landing[2], r: 2.2 }, ...machines.rovers.map(() => ({ x: 0, z: 0, r: 1.4 })), ...rocks.obstacles],
    [landing, machines, rocks],
  );
  const lander = useRef<THREE.Group>(null!);
  const flame = useRef(0);
  const lastUi = useRef(0);

  useEffect(() => {
    machines.rovers.forEach((r) => preloadModel(r.model));
    if (machines.helis.length) preloadModel('ingenuity');
    replay.sol = 0;
    machinePositions.clear();
  }, [site]);

  useFrame((state, dt) => {
    const st = useWorld.getState();
    if (st.playing && phase === 'drive') replay.sol = Math.min(end, replay.sol + dt * st.speed);
    if (state.clock.elapsedTime - lastUi.current > 0.1) {
      lastUi.current = state.clock.elapsedTime;
      setSol(replay.sol);
      let near: string | null = null;
      let best = 9;
      machinePositions.forEach((p, id) => {
        const d = Math.hypot(p.x - player.x, p.z - player.z);
        if (d < best) {
          best = d;
          near = id;
        }
      });
      setNear(phase === 'drive' ? near : null);
    }
    flame.current = ship.flame;
    lander.current.position.y = landing[1] + ship.y;
  });

  return (
    <>
      <SkyDome bottom="#e8b27a" top="#8a5a48" />
      <color attach="background" args={[PALETTES.mars.sky]} />
      <fog attach="fog" args={[PALETTES.mars.fog, 60, 230]} />
      <hemisphereLight args={['#ffd9b0', '#5a2a18', 0.85]} />
      <SunLight color="#ffe2c2" intensity={2.3} dir={[-0.7, 0.6, 0.45]} />

      <TerrainMesh field={field} extent={inner.half} range={range} colors={PALETTES.mars.ground} segments={200} detail="sand" tile={0.15} />
      {/* Le sol continue jusqu'à l'horizon */}
      <TerrainMesh field={field} extent={900} warp holeHalf={inner.half - 0.5} range={range} colors={PALETTES.mars.ground} segments={240} detail="sand" tile={0.15} />
      {/* Poussière en suspension qui suit le joueur */}
      <DustMotes animate={animate} />
      <Rocks rocks={rocks} color={PALETTES.mars.rock} seed={site === 'gale' ? 5 : 2} />
      <Pebbles field={inner} color={PALETTES.mars.rock} count={6000} minSize={0.12} maxSize={0.9} seed={site === 'gale' ? 6 : 9} />
      {/* Poussière des roues : l'air martien, très léger, la freine un peu (pesanteur 3,71 m/s²). */}
      <DustTrail field={field} color="#b97a4e" gravity={3.71} drag={0.8} active={phase === 'drive'} />

      {machines.rovers.map((r, i) => (
        <Traverse key={r.id} id={r.id} data={data} field={field} model={r.model} trackColor={PALETTES.mars.track} obstacle={obstacles[i + 1]} />
      ))}
      {machines.helis.map((h) => (
        <Flights key={h.id} id={h.id} data={data} field={field} carrier={h.carrier} />
      ))}

      <group ref={lander} position={landing}>
        <ToonLander flame={flame} />
      </group>

      <Player field={field} start={start} startHeading={0.6} obstacles={obstacles} enabled={phase === 'drive'} followCamera={phase === 'drive'} animate={animate} visible={phase === 'drive'} />
      {phase !== 'drive' && <ShipCamera at={landing} ship={ship} animate={animate} />}
    </>
  );
}
