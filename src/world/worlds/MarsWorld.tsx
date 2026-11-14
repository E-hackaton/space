import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Player, player, type Obstacle } from '../Player';
import { ToonLander } from '../props/Vehicles';
import { Rocks, ShipCamera, SkyDome, SunLight } from '../props/Environment';
import { Flights, Traverse, machinePositions, replay } from '../Replay';
import { TerrainMesh } from '../TerrainMesh';
import { siteField, type SiteData } from '../terrain';
import { PALETTES } from '../toon';
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
export const SITE_MACHINES: Record<'jezero' | 'gale', { rovers: { id: string; color: string; accent: string }[]; helis: { id: string; carrier: string }[] }> = {
  jezero: { rovers: [{ id: 'perseverance', color: '#f3f1ea', accent: '#d0d4dc' }], helis: [{ id: 'ingenuity', carrier: 'perseverance' }] },
  gale: { rovers: [{ id: 'curiosity', color: '#ece6da', accent: '#c9a24a' }], helis: [] },
};

/** Fin des données pour un site (dernier sol connu). */
export function lastSol(data: SiteData): number {
  return Math.max(...Object.values(data.paths).map((p) => p[p.length - 1][3]), ...Object.values(data.flights).map((f) => f[f.length - 1].sol));
}

export default function MarsWorld({ site, animate }: { site: 'jezero' | 'gale'; animate: boolean }) {
  const data = useSiteData(site);
  if (!data) return <SkyDome bottom={PALETTES.mars.sky} top="#7a4a3a" />;
  return <MarsSite data={data} site={site} animate={animate} />;
}

function MarsSite({ data, site, animate }: { data: SiteData; site: 'jezero' | 'gale'; animate: boolean }) {
  const field = useMemo(() => siteField(data), [data]);
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

  const obstacles = useMemo<Obstacle[]>(() => [{ x: landing[0], z: landing[2], r: 2.2 }, ...machines.rovers.map(() => ({ x: 0, z: 0, r: 1.4 }))], [landing, machines]);
  const lander = useRef<THREE.Group>(null!);
  const flame = useRef(0);
  const lastUi = useRef(0);

  useEffect(() => {
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

      <TerrainMesh field={field} colors={PALETTES.mars.ground} segments={200} />
      <Rocks field={field} color={PALETTES.mars.rock} count={520} seed={site === 'gale' ? 5 : 2} avoid={[[landing[0], landing[2], 10]]} />

      {machines.rovers.map((r, i) => (
        <Traverse key={r.id} id={r.id} data={data} field={field} color={r.color} accent={r.accent} trackColor={PALETTES.mars.track} obstacle={obstacles[i + 1]} />
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
