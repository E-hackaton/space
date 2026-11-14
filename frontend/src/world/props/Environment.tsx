import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player, type Obstacle } from '../Player';
import { smooth } from '../materials';
import { valueNoise } from '../noise';
import type { HeightField } from '../terrain';

/** Dôme de ciel en dégradé (du bas vers le haut). */
export function SkyDome({ bottom, top, radius = 400 }: { bottom: string; top: string; radius?: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(radius, 32, 16);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const cb = new THREE.Color(bottom);
    const ct = new THREE.Color(top);
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = THREE.MathUtils.clamp(pos.getY(i) / radius + 0.1, 0, 1);
      c.copy(cb).lerp(ct, Math.pow(t, 0.6));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [bottom, top, radius]);
  return (
    <mesh geometry={geometry} raycast={() => null}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

/** Soleil : lumière directionnelle avec ombres douces qui suivent le joueur. */
export function SunLight({ color = '#fff1d6', intensity = 2.4, dir = [0.6, 1, 0.35] as [number, number, number], shadows = true }) {
  const light = useRef<THREE.DirectionalLight>(null!);
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const l = light.current;
    l.position.set(player.x + dir[0] * 60, 60 * dir[1], player.z + dir[2] * 60);
    target.position.set(player.x, 0, player.z);
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        color={color}
        intensity={intensity}
        target={target}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={4}
      />
    </>
  );
}

/** Géométrie de rocher : une sphère bosselée et lisse (déformée par du bruit). */
function rockGeometry(seed: number) {
  const g = new THREE.IcosahedronGeometry(1, 3);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = valueNoise(v.x * 1.7 + seed, v.y * 1.7 + v.z * 1.3) * 0.45 + valueNoise(v.x * 4 + seed, v.z * 4) * 0.12;
    v.multiplyScalar(0.75 + n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export interface RockField {
  matrices: THREE.Matrix4[];
  /** Rochers assez gros pour bloquer le rover (les petits cailloux se franchissent). */
  obstacles: Obstacle[];
}

/** Taille (échelle) à partir de laquelle un rocher bloque le rover au lieu d'être franchi. */
const BLOCKING_ROCK = 0.55;

/**
 * Disperse des rochers sur le terrain (tirage pseudo-aléatoire reproductible) et renvoie
 * à la fois leur placement 3D et leur empreinte au sol pour les collisions.
 */
export function scatterRocks(field: HeightField, count: number, seed: number, avoid: [number, number, number][] = []): RockField {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const matrices: THREE.Matrix4[] = [];
  const obstacles: Obstacle[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  while (matrices.length < count) {
    const x = (rnd() * 2 - 1) * field.half * 0.95;
    const z = (rnd() * 2 - 1) * field.half * 0.95;
    if (avoid.some(([ax, az, r]) => Math.hypot(x - ax, z - az) < r)) continue;
    const sc = 0.3 + Math.pow(rnd(), 3) * 2.2;
    e.set(rnd() * 3, rnd() * 3, rnd() * 3);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, field.heightAt(x, z) + sc * 0.15, z), q, new THREE.Vector3(sc, sc * 0.65, sc));
    matrices.push(m.clone());
    // La géométrie fait environ 1 unité de rayon : l'empreinte au sol vaut à peu près l'échelle.
    if (sc >= BLOCKING_ROCK) obstacles.push({ x, z, r: sc * 0.95 });
  }
  return { matrices, obstacles };
}

/**
 * Zones sans rochers le long d'un segment (cercles tous les 3 m) : un chemin praticable,
 * par exemple entre le point de départ du joueur et une machine à visiter.
 */
export function corridor(from: [number, number], to: [number, number], width: number): [number, number, number][] {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const steps = Math.max(1, Math.ceil(length / 3));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const k = i / steps;
    return [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, width] as [number, number, number];
  });
}

/** Rochers dispersés (instanciés pour rester légers). Le placement vient de `scatterRocks`. */
export function Rocks({ rocks, color, seed = 1 }: { rocks: RockField; color: string; seed?: number }) {
  const geometry = useMemo(() => rockGeometry(seed), [seed]);
  const { matrices } = rocks;
  return (
    <instancedMesh
      ref={(r) => {
        if (!r) return;
        matrices.forEach((mm, i) => r.setMatrixAt(i, mm));
        r.instanceMatrix.needsUpdate = true;
      }}
      args={[geometry, undefined, matrices.length]}
      castShadow
      receiveShadow
      material={smooth(color, { rough: 0.9 })}
    />
  );
}

/** Touffes d'herbe instanciées, qui ondulent doucement (décor de la Terre). */
export function GrassTufts({ field, count = 1600, radius = 58, avoid = [] as [number, number, number][] }: { field: HeightField; count?: number; radius?: number; avoid?: [number, number, number][] }) {
  const geometry = useMemo(() => {
    const g = new THREE.ConeGeometry(0.22, 1.1, 5, 3);
    g.translate(0, 0.55, 0);
    return g;
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null!);
  const base = useMemo(() => {
    let s = 11;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const out: { p: THREE.Vector3; s: THREE.Vector3; yaw: number; phase: number }[] = [];
    while (out.length < count) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * radius;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (avoid.some(([ax, az, rr]) => Math.hypot(x - ax, z - az) < rr)) continue;
      const sc = 0.4 + rnd() * 0.6;
      out.push({ p: new THREE.Vector3(x, field.heightAt(x, z), z), s: new THREE.Vector3(sc, sc * (1 + rnd()), sc), yaw: rnd() * 6.28, phase: rnd() * 6.28 });
    }
    return out;
  }, [field, count, radius, avoid]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const frame = useRef(0);
  useFrame(({ clock }) => {
    // Ondulation au vent (mise à jour une image sur deux pour rester léger).
    if (frame.current++ % 2) return;
    const t = clock.elapsedTime;
    base.forEach((b, i) => {
      e.set(Math.sin(t * 1.3 + b.phase) * 0.12, b.yaw, Math.cos(t * 1.1 + b.phase) * 0.12);
      q.setFromEuler(e);
      m.compose(b.p, q, b.s);
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geometry, undefined, base.length]} material={smooth('#7cc95a', { rough: 0.7 })} receiveShadow />;
}

/** Caméra de cinématique : regarde le vaisseau depuis le côté pendant le décollage ou l'atterrissage. */
export function ShipCamera({ at, ship, animate }: { at: [number, number, number]; ship: { y: number }; animate: boolean }) {
  useFrame((state, dt) => {
    const cam = state.camera;
    const y = at[1] + ship.y;
    const want = new THREE.Vector3(at[0] + 26, at[1] + 7 + ship.y * 0.75, at[2] + 26);
    cam.position.lerp(want, animate ? 1 - Math.exp(-dt * 3) : 1);
    cam.up.set(0, 1, 0);
    cam.lookAt(at[0], y + 4, at[2]);
  });
  return null;
}
