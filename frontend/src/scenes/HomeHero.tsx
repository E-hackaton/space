import { ContextGuard, useCanvasGeneration } from '../components/3d/ContextGuard';
import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles, useTexture } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Atmosphere } from '../components/3d/Atmosphere';
import { NasaModel } from '../components/3d/NasaModel';
import { ToonRocket } from '../world/props/Vehicles';
import { glowTexture } from '../components/3d/glow';

/*
 * Scène d'accueil : la Terre, la Lune en orbite et Mars au loin ; une fusée part vers la Lune
 * en boucle ; Voyager dérive au premier plan. Au départ du voyage, les étoiles s'étirent (saut).
 * Tailles et distances non à l'échelle.
 */

import { warp } from './warp';

const SUN = new THREE.Vector3(-1, 0.35, 0.55).normalize();
const EARTH = new THREE.Vector3(0, -0.6, 0);
const MOON_R = 6.2;

function Earth({ animate }: { animate: boolean }) {
  const [map, clouds] = useTexture(['/textures/earth_color.jpg', '/textures/earth_clouds.jpg']);
  map.colorSpace = THREE.SRGBColorSpace;
  const g = useRef<THREE.Mesh>(null!);
  const c = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (!animate) return;
    g.current.rotation.y += dt * 0.04;
    c.current.rotation.y += dt * 0.055;
  });
  return (
    <group position={EARTH} rotation={[0.2, 0, 0.41]}>
      <mesh ref={g}>
        <sphereGeometry args={[3, 128, 128]} />
        <meshStandardMaterial map={map} roughness={0.8} metalness={0.05} />
      </mesh>
      <mesh ref={c} scale={1.012}>
        <sphereGeometry args={[3, 96, 96]} />
        <meshStandardMaterial color="#ffffff" alphaMap={clouds} transparent depthWrite={false} opacity={0.9} />
      </mesh>
      <Atmosphere radius={3} color="#5aa8ff" sunDir={SUN} scale={1.07} power={2.2} intensity={2.2} />
    </group>
  );
}

function MoonAndMars({ animate }: { animate: boolean }) {
  const [moonMap, marsMap] = useTexture(['/textures/moon_color.jpg', '/textures/mars_color.jpg']);
  moonMap.colorSpace = THREE.SRGBColorSpace;
  marsMap.colorSpace = THREE.SRGBColorSpace;
  const moon = useRef<THREE.Mesh>(null!);
  const a = useRef(0.6);
  useFrame((_, dt) => {
    if (animate) a.current += dt * 0.06;
    moon.current.position.set(EARTH.x + Math.cos(a.current) * MOON_R, EARTH.y + Math.sin(a.current) * 1.2, EARTH.z + Math.sin(a.current) * MOON_R);
    moon.current.rotation.y = -a.current;
  });
  return (
    <>
      <mesh ref={moon}>
        <sphereGeometry args={[0.8, 64, 64]} />
        <meshStandardMaterial map={moonMap} roughness={1} />
      </mesh>
      <group position={[16, 5, -26]}>
        <mesh rotation={[0.3, 0, 0.44]}>
          <sphereGeometry args={[1.7, 64, 64]} />
          <meshStandardMaterial map={marsMap} roughness={1} />
        </mesh>
        <Atmosphere radius={1.7} color="#ff9a6a" sunDir={SUN} scale={1.05} power={3} intensity={1.1} />
      </group>
    </>
  );
}

/** Fusée : de la surface de la Terre vers la Lune, en boucle, avec une traînée lumineuse. */
function Launch({ animate }: { animate: boolean }) {
  const rocket = useRef<THREE.Group>(null!);
  const flame = useRef(1);
  const t = useRef(0);
  const TRAIL = 90;
  const trail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    const col = new Float32Array(TRAIL * 3);
    for (let i = 0; i < TRAIL; i++) {
      const k = 1 - i / TRAIL;
      col.set([1 * k, 0.75 * k, 0.4 * k], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  // Traînée : des particules de gaz chaud qui pâlissent derrière la fusée.
  const trailLine = useMemo(
    () => new THREE.Points(trail, new THREE.PointsMaterial({ map: glowTexture('#ffffff'), vertexColors: true, size: 0.32, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })),
    [trail],
  );
  const history = useRef<THREE.Vector3[]>([]);
  const curve = useMemo(() => {
    const from = EARTH.clone().add(new THREE.Vector3(1.6, 2.2, 1.4));
    return new THREE.CubicBezierCurve3(from, new THREE.Vector3(2.6, 3.6, 2.4), new THREE.Vector3(5.2, 3.4, 2.2), new THREE.Vector3(7.5, 1.4, 0.5));
  }, []);
  useFrame((_, dt) => {
    if (!animate) return;
    t.current = (t.current + dt / 9) % 1.25;
    const k = Math.min(1, t.current);
    const p = curve.getPoint(THREE.MathUtils.smoothstep(k, 0, 1));
    const ahead = curve.getPoint(Math.min(1, THREE.MathUtils.smoothstep(k, 0, 1) + 0.01));
    const g = rocket.current;
    g.visible = t.current < 1;
    g.position.copy(p);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ahead.clone().sub(p).normalize());
    flame.current = 0.8 + Math.random() * 0.4;
    const last = history.current[0];
    const steps = last ? Math.min(6, Math.ceil(last.distanceTo(p) / 0.04)) : 1;
    for (let i = steps; i >= 1; i--) history.current.unshift(last ? last.clone().lerp(p, i / steps).add(new THREE.Vector3((Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06, 0)) : p.clone());
    while (history.current.length > TRAIL) history.current.pop();
    const pos = trail.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL; i++) {
      const h = history.current[Math.min(i, history.current.length - 1)] ?? p;
      pos.setXYZ(i, h.x, h.y, h.z);
    }
    pos.needsUpdate = true;
    if (t.current >= 1) history.current = [];
  });
  return (
    <>
      <primitive object={trailLine} />
      <group ref={rocket} scale={0.11}>
        <ToonRocket flame={flame} />
      </group>
    </>
  );
}

/** Voyager dérive lentement au premier plan. */
function Drifter({ animate }: { animate: boolean }) {
  const g = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = animate ? clock.elapsedTime : 0;
    g.current.position.set(-5.5 + Math.sin(t * 0.07) * 1.2, 2.2 + Math.sin(t * 0.21) * 0.3, 4.5);
    g.current.rotation.set(0.3 + Math.sin(t * 0.1) * 0.2, t * 0.12, 0.2);
  });
  return (
    <group ref={g}>
      <Suspense fallback={null}>
        <NasaModel id="voyager" scale={0.35} />
      </Suspense>
    </group>
  );
}

/** Étoiles en couches : au saut, elles s'étirent vers la caméra. */
function WarpStars({ animate }: { animate: boolean }) {
  const lines = useRef<THREE.LineSegments>(null!);
  const N = 2400;
  const { geo, base } = useMemo(() => {
    const base = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 40 + Math.random() * 160;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      base.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    return { geo: g, base };
  }, []);
  const { camera } = useThree();
  useFrame((_, dt) => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const stretch = 0.15 + warp.value * 40;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    for (let i = 0; i < N; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const z = base[i * 3 + 2];
      pos.setXYZ(i * 2, x, y, z);
      pos.setXYZ(i * 2 + 1, x - dir.x * stretch, y - dir.y * stretch, z - dir.z * stretch);
    }
    pos.needsUpdate = true;
    if (animate) lines.current.rotation.y += dt * 0.004;
  });
  return (
    <lineSegments ref={lines} geometry={geo}>
      <lineBasicMaterial color="#dfe8ff" transparent opacity={0.85} toneMapped={false} />
    </lineSegments>
  );
}

/** Caméra : légère dérive, suit la souris ; au saut, elle fonce vers la Lune. */
function Rig({ animate }: { animate: boolean }) {
  const look = useMemo(() => new THREE.Vector3(1.2, 0.6, 0), []);
  useFrame(({ camera, pointer, clock }, dt) => {
    const t = animate ? clock.elapsedTime : 0;
    const w = warp.value;
    const want = new THREE.Vector3(2 + pointer.x * 1.4 + Math.sin(t * 0.05) * 0.6, 1.6 + pointer.y * 0.8, 13.5 - w * 12);
    camera.position.lerp(want, 1 - Math.exp(-dt * 2));
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = THREE.MathUtils.lerp(cam.fov, 42 + w * 40, 1 - Math.exp(-dt * 4));
    cam.updateProjectionMatrix();
    camera.lookAt(look);
  });
  return null;
}

export default function HomeHero({ animate }: { animate: boolean }) {
  const [gen, bump] = useCanvasGeneration();
  return (
    <Canvas key={gen} dpr={[1, 1.25]} camera={{ position: [2, 1.6, 22], fov: 42 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} aria-hidden="true">
      <color attach="background" args={['#03050d']} />
      <ContextGuard onLost={bump} />
      <ambientLight intensity={0.05} />
      <directionalLight position={SUN.clone().multiplyScalar(30)} intensity={3.2} color="#fff3e0" />
      {/* Le Soleil : un point très lumineux (le bloom fait le halo) */}
      <mesh position={SUN.clone().multiplyScalar(90)}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#fff2cc" toneMapped={false} />
      </mesh>
      <WarpStars animate={animate} />
      <Sparkles count={120} scale={[30, 14, 20]} size={2} speed={animate ? 0.25 : 0} color="#9fb6ff" opacity={0.6} />
      <Suspense fallback={null}>
        <Earth animate={animate} />
        <MoonAndMars animate={animate} />
      </Suspense>
      <Launch animate={animate} />
      <Drifter animate={animate} />
      <Rig animate={animate} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.1} luminanceThreshold={0.7} mipmapBlur />
        <Vignette offset={0.2} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
