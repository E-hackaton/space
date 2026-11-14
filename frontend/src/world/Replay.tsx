import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Beacon } from './props/Vehicles';
import { NasaModel, type ModelId } from '../components/3d/NasaModel';
import { useWorld } from './state';
import type { HeightField, SiteData } from './terrain';
import type { Obstacle } from './Player';

/** Temps de la relecture (en sols), partagé et lu à chaque image. */
export const replay = { sol: 0 };

/** Position partagée des machines (pour la fiche « à proximité »). */
export const machinePositions = new Map<string, { x: number; z: number }>();

interface Pt {
  x: number;
  z: number;
  y: number;
  t: number;
}

function findIndex(ts: Float64Array, t: number): number {
  let lo = 0;
  let hi = ts.length - 1;
  if (t <= ts[0]) return 0;
  if (t >= ts[hi]) return hi;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ts[mid] <= t) lo = mid;
    else hi = mid;
  }
  return lo;
}

interface TraverseProps {
  id: string;
  data: SiteData;
  field: HeightField & { toWorld: (x: number, z: number) => [number, number] };
  model: ModelId;
  trackColor: string;
  obstacle: Obstacle;
}

/** Un rover qui rejoue son vrai trajet (données NASA/JPL), en laissant ses traces derrière lui. */
export function Traverse({ id, data, field, model, trackColor, obstacle }: TraverseProps) {
  const rover = useRef<THREE.Group>(null!);
  // Légendes visibles quand le joueur est tout près.
  const annotated = useWorld((s) => s.near === id);
  const { pts, ts, geometry } = useMemo(() => {
    const raw = data.paths[id];
    const pts: Pt[] = raw.map(([mx, mz, , t]) => {
      const [x, z] = field.toWorld(mx, mz);
      return { x, z, y: field.heightAt(x, z), t };
    });
    const ts = new Float64Array(pts.map((p) => p.t));
    // Ruban de traces de roues posé sur le sol.
    const n = pts.length;
    const pos = new Float32Array(n * 2 * 3);
    const w = 0.45;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n - 1, i + 1)];
      let dx = b.x - a.x;
      let dz = b.z - a.z;
      const l = Math.hypot(dx, dz) || 1;
      dx /= l;
      dz /= l;
      const p = pts[i];
      for (const [k, s] of [[0, -1], [1, 1]] as const) {
        const x = p.x + -dz * w * s;
        const z = p.z + dx * w * s;
        pos.set([x, field.heightAt(x, z) + 0.08, z], (i * 2 + k) * 3);
      }
    }
    const index: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setIndex(index);
    geometry.setDrawRange(0, 0);
    return { pts, ts, geometry };
  }, [data, id, field]);

  const heading = useRef(0);
  useFrame((_, dt) => {
    const t = replay.sol;
    const i = findIndex(ts, t);
    const a = pts[i];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const f = b.t > a.t ? THREE.MathUtils.clamp((t - a.t) / (b.t - a.t), 0, 1) : 0;
    const x = a.x + (b.x - a.x) * f;
    const z = a.z + (b.z - a.z) * f;
    const moving = f > 0 && f < 1 && Math.hypot(b.x - a.x, b.z - a.z) > 0.01;
    if (moving) {
      const want = Math.atan2(-(b.x - a.x), -(b.z - a.z));
      const d = Math.atan2(Math.sin(want - heading.current), Math.cos(want - heading.current));
      heading.current += d * Math.min(1, dt * 6);
    }
    rover.current.position.set(x, field.heightAt(x, z), z);
    rover.current.rotation.y = heading.current;
    geometry.setDrawRange(0, Math.max(0, i) * 6);
    obstacle.x = x;
    obstacle.z = z;
    machinePositions.set(id, { x, z });
  });

  return (
    <>
      <mesh geometry={geometry} receiveShadow>
        <meshBasicMaterial color={trackColor} transparent opacity={0.75} depthWrite={false} />
      </mesh>
      <group ref={rover}>
        {/* Modèle NASA ; l'avant du modèle est vers +Z, celui du trajet vers -Z. */}
        <group rotation={[0, Math.PI, 0]}>
          <NasaModel id={model} scale={1.3} annotated={annotated} />
        </group>
        <Beacon active y={4.6} />
      </group>
    </>
  );
}

interface FlightsProps {
  id: string;
  data: SiteData;
  field: HeightField & { toWorld: (x: number, z: number) => [number, number] };
  /** Rover qui le transportait avant son dépôt au sol. */
  carrier: string;
}

/** Ingenuity : rejoue ses vols (d'un point d'atterrissage au suivant), puis s'endort après le dernier. */
export function Flights({ id, data, field, carrier }: FlightsProps) {
  const heli = useRef<THREE.Group>(null!);
  const spinning = useRef(false);
  const beacon = useRef<THREE.Group>(null!);
  const flights = useMemo(
    () =>
      data.flights[id].map((f) => {
        const [x, z] = field.toWorld(f.x, f.z);
        return { ...f, wx: x, wz: z };
      }),
    [data, id, field],
  );
  const last = flights[flights.length - 1];
  const ended = useRef(false);
  const annotated = useWorld((s) => s.near === id);

  useFrame(() => {
    const t = replay.sol;
    const g = heli.current;
    // Avant son dépôt (vol 0 = point de dépôt), Ingenuity voyage sous le rover : on le cache.
    if (t < flights[0].sol) {
      g.visible = false;
      const c = machinePositions.get(carrier);
      if (c) g.position.set(c.x, field.heightAt(c.x, c.z), c.z);
      machinePositions.delete(id);
      return;
    }
    g.visible = true;
    let k = 0;
    while (k < flights.length - 1 && flights[k + 1].sol <= t) k++;
    const cur = flights[k];
    const next = flights[k + 1];
    let x = cur.wx;
    let z = cur.wz;
    let lift = 0;
    spinning.current = false;
    // Un vol dure une petite partie du sol où il a lieu.
    if (next && t >= next.sol - 1 && t < next.sol) {
      const p = t - (next.sol - 1);
      x = cur.wx + (next.wx - cur.wx) * p;
      z = cur.wz + (next.wz - cur.wz) * p;
      // Altitude exagérée pour être visible (le vrai maximum est dans les données).
      lift = Math.sin(Math.PI * p) * (2 + next.maxAlt / 3);
      spinning.current = true;
    }
    g.position.set(x, field.heightAt(x, z) + lift, z);
    ended.current = t >= last.sol;
    beacon.current.children.forEach((c, i) => (c.visible = i === (ended.current ? 1 : 0)));
    machinePositions.set(id, { x, z });
  });

  return (
    <group ref={heli}>
      <NasaModel id="ingenuity" scale={1.6} spinning={spinning} annotated={annotated} />
      <group ref={beacon}>
        <Beacon active y={2.6} />
        <Beacon active={false} y={2.6} />
      </group>
    </group>
  );
}

/** Distance totale d'un trajet jusqu'au temps t (km, d'après les points NASA). */
export function distanceKm(points: [number, number, number, number][], t: number): number {
  let d = 0;
  for (let i = 1; i < points.length && points[i][3] <= t; i++) {
    d += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return d / 1000;
}
