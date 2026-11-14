import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '../Player';
import { toon } from '../toon';
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

/** Soleil : lumière directionnelle avec ombres qui suivent le joueur. */
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
        shadow-bias={-0.0005}
      />
    </>
  );
}

/** Rochers décoratifs dispersés (instanciés pour rester légers). */
export function Rocks({ field, color, count = 260, seed = 1, avoid = [] as [number, number, number][] }: { field: HeightField; color: string; count?: number; seed?: number; avoid?: [number, number, number][] }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const matrices = useMemo(() => {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const out: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    while (out.length < count) {
      const x = (rnd() * 2 - 1) * field.half * 0.95;
      const z = (rnd() * 2 - 1) * field.half * 0.95;
      if (avoid.some(([ax, az, r]) => Math.hypot(x - ax, z - az) < r)) continue;
      const sc = 0.3 + Math.pow(rnd(), 3) * 2.2;
      e.set(rnd() * 3, rnd() * 3, rnd() * 3);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(x, field.heightAt(x, z) + sc * 0.2, z), q, new THREE.Vector3(sc, sc * 0.7, sc));
      out.push(m.clone());
    }
    return out;
  }, [field, count, seed, avoid]);
  return (
    <instancedMesh
      ref={(r) => {
        if (!r) return;
        mesh.current = r;
        matrices.forEach((m, i) => r.setMatrixAt(i, m));
        r.instanceMatrix.needsUpdate = true;
      }}
      args={[undefined, undefined, matrices.length]}
      castShadow
      receiveShadow
      material={toon(color, { flat: true })}
    >
      <dodecahedronGeometry args={[1, 0]} />
    </instancedMesh>
  );
}

/** Touffes d'herbe instanciées (décor de la Terre). */
export function GrassTufts({ field, count = 1400, radius = 58, avoid = [] as [number, number, number][] }: { field: HeightField; count?: number; radius?: number; avoid?: [number, number, number][] }) {
  const matrices = useMemo(() => {
    let s = 11;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const out: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    while (out.length < count) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * radius;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (avoid.some(([ax, az, rr]) => Math.hypot(x - ax, z - az) < rr)) continue;
      const sc = 0.35 + rnd() * 0.5;
      q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.4, rnd() * 6.28, (rnd() - 0.5) * 0.4));
      m.compose(new THREE.Vector3(x, field.heightAt(x, z), z), q, new THREE.Vector3(sc, sc * (1 + rnd()), sc));
      out.push(m.clone());
    }
    return out;
  }, [field, count, radius, avoid]);
  return (
    <instancedMesh
      ref={(r) => {
        if (!r) return;
        matrices.forEach((mm, i) => r.setMatrixAt(i, mm));
        r.instanceMatrix.needsUpdate = true;
      }}
      args={[undefined, undefined, matrices.length]}
      material={toon('#8fcf5a')}
    >
      <coneGeometry args={[0.35, 1.1, 4]} />
    </instancedMesh>
  );
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
