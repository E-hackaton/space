import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Atmosphere } from './Atmosphere';
import {
  BODIES,
  MOON_ORBIT,
  MOON_SHOWCASE_ANGLE,
  SUN_POSITION,
  SUN_RADIUS,
  bodyRegistry,
  sunDirectionAt,
  type BodyConfig,
  type BodyId,
} from '../../lib/solarSystem';
import { glowTexture } from './glow';

export interface BodyProps {
  animate: boolean;
  /** Astre figé (rotation arrêtée), par exemple pendant une mission. */
  frozen?: boolean;
  /** Astre masqué (il reste chargé et suivi par la caméra). */
  hidden?: boolean;
  label?: string;
  selected?: boolean;
  onSelect?: (id: BodyId) => void;
}

function useRegister(id: BodyId, group: React.RefObject<THREE.Object3D>, surface: React.RefObject<THREE.Object3D>) {
  useEffect(() => {
    if (!group.current || !surface.current) return;
    const handle = { group: group.current, surface: surface.current };
    bodyRegistry.set(id, handle);
    return () => {
      if (bodyRegistry.get(id) === handle) bodyRegistry.delete(id);
    };
  }, [id, group, surface]);
}

function clickHandlers(id: BodyId, onSelect?: (id: BodyId) => void) {
  if (!onSelect) return {};
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(id);
    },
    onPointerOver: () => (document.body.style.cursor = 'pointer'),
    onPointerOut: () => (document.body.style.cursor = ''),
  };
}

/** Étiquette HTML projetée au-dessus d'un astre (décorative : la navigation clavier passe par le panneau). */
function Label({ radius, children, selected }: { radius: number; children: ReactNode; selected?: boolean }) {
  return (
    <Html position={[0, radius * 1.3 + 0.15, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <span
        aria-hidden="true"
        className={`whitespace-nowrap rounded-full px-2 py-0.5 font-display text-sm uppercase tracking-widest transition ${
          selected ? 'bg-white text-space' : 'bg-space/60 text-white'
        }`}
      >
        {children}
      </span>
    </Html>
  );
}

function useColorTexture(url: string) {
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function Clouds({ url, radius, animate, frozen }: { url: string; radius: number; animate: boolean; frozen?: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  const map = useTexture(url);
  useFrame((_, dt) => {
    if (animate && !frozen) ref.current.rotation.y += dt * 0.015;
  });
  return (
    <mesh ref={ref} scale={1.012} raycast={() => null}>
      <sphereGeometry args={[radius, 96, 96]} />
      <meshStandardMaterial color="#ffffff" alphaMap={map} transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}

function Rings({ cfg }: { cfg: BodyConfig }) {
  const tex = useTexture(cfg.rings!.texture);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geometry = useMemo(() => {
    const { inner, outer } = cfg.rings!;
    const g = new THREE.RingGeometry(cfg.radius * inner, cfg.radius * outer, 128, 1);
    // UV radiales : u = 0 au bord intérieur, 1 au bord extérieur.
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const t = (v.length() - cfg.radius * inner) / (cfg.radius * (outer - inner));
      uv.setXY(i, t, 0.5);
    }
    return g;
  }, [cfg]);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <meshStandardMaterial map={tex} transparent side={THREE.DoubleSide} depthWrite={false} roughness={1} />
    </mesh>
  );
}

/** Une planète texturée générique : surface, nuages, anneaux, atmosphère. */
export function Planet({ id, animate, frozen, hidden, label, selected, onSelect }: BodyProps & { id: Exclude<BodyId, 'moon' | 'deep-space'> }) {
  const cfg = BODIES[id];
  const group = useRef<THREE.Group>(null!);
  const surface = useRef<THREE.Mesh>(null!);
  const map = useColorTexture(cfg.texture!);
  const sunDir = useMemo(() => sunDirectionAt(cfg.position), [cfg]);
  useRegister(id, group, surface);

  useFrame((_, dt) => {
    if (animate && !frozen) surface.current.rotation.y += dt * cfg.spin;
  });

  return (
    <group ref={group} visible={!hidden} position={cfg.position} rotation={[0, 0, THREE.MathUtils.degToRad(cfg.tiltDeg)]}>
      <mesh ref={surface} {...clickHandlers(id, onSelect)}>
        <sphereGeometry args={[cfg.radius, 96, 96]} />
        <meshStandardMaterial map={map} roughness={0.9} metalness={0} />
      </mesh>
      {cfg.clouds && <Clouds url={cfg.clouds} radius={cfg.radius} animate={animate} frozen={frozen} />}
      {cfg.rings && <Rings cfg={cfg} />}
      {cfg.atmosphere && <Atmosphere radius={cfg.radius} sunDir={sunDir} {...cfg.atmosphere} />}
      {label && <Label radius={cfg.radius} selected={selected}>{label}</Label>}
    </group>
  );
}

export function Moon({ animate, hidden, label, selected, onSelect, orbiting = true }: BodyProps & { orbiting?: boolean }) {
  const cfg = BODIES.moon;
  const group = useRef<THREE.Group>(null!);
  const surface = useRef<THREE.Mesh>(null!);
  const angle = useRef(0.9);
  const map = useColorTexture(cfg.texture!);
  const bump = useTexture(cfg.bump!);
  useRegister('moon', group, surface);

  const place = () => {
    const a = angle.current;
    const d = MOON_ORBIT.radius;
    group.current.position.set(d * Math.cos(a), 0.35 * Math.sin(a), d * Math.sin(a));
    // Rotation synchrone : la Lune montre toujours la même face (longitude 0) à la Terre.
    group.current.rotation.y = Math.PI - a;
  };

  useEffect(place, []);
  useFrame((_, dt) => {
    const g = group.current;
    if (orbiting) {
      g.userData.settled = false;
      if (animate) angle.current -= dt * MOON_ORBIT.speed;
    } else {
      // Mise en valeur : la Lune glisse vers une phase où sa face visible est éclairée.
      const delta = Math.atan2(Math.sin(MOON_SHOWCASE_ANGLE - angle.current), Math.cos(MOON_SHOWCASE_ANGLE - angle.current));
      if (!animate || Math.abs(delta) < 0.002) {
        angle.current = MOON_SHOWCASE_ANGLE;
        g.userData.settled = true;
      } else {
        angle.current += delta * Math.min(1, dt * 2.5);
      }
    }
    place();
  });

  return (
    <group ref={group} visible={!hidden}>
      <mesh ref={surface} {...clickHandlers('moon', onSelect)}>
        <sphereGeometry args={[cfg.radius, 64, 64]} />
        <meshStandardMaterial map={map} bumpMap={bump} bumpScale={0.6} roughness={1} metalness={0} />
      </mesh>
      {label && <Label radius={cfg.radius} selected={selected}>{label}</Label>}
    </group>
  );
}

/** L'espace lointain : une balise lumineuse et la bulle du Soleil (héliosphère), symboliques. */
export function DeepSpace({ animate, hidden, label, selected, onSelect }: BodyProps) {
  const cfg = BODIES['deep-space'];
  const group = useRef<THREE.Group>(null!);
  const surface = useRef<THREE.Group>(null!);
  const glow = useMemo(() => glowTexture('#b9b0ff'), []);
  const ring = useRef<THREE.Mesh>(null!);
  useRegister('deep-space', group, surface);
  useFrame(({ clock }) => {
    if (!animate) return;
    const s = 1 + 0.08 * Math.sin(clock.elapsedTime * 1.5);
    ring.current.scale.setScalar(s);
  });
  return (
    <group ref={group} visible={!hidden} position={cfg.position}>
      <group ref={surface}>
        <mesh {...clickHandlers('deep-space', onSelect)}>
          <sphereGeometry args={[cfg.radius, 24, 24]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <sprite scale={2.2} raycast={() => null}>
          <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <mesh ref={ring} rotation={[Math.PI / 2.4, 0.3, 0]} raycast={() => null}>
          <torusGeometry args={[1.6, 0.012, 8, 128]} />
          <meshBasicMaterial color={cfg.color} transparent opacity={0.6} />
        </mesh>
      </group>
      {label && <Label radius={cfg.radius} selected={selected}>{label}</Label>}
    </group>
  );
}

/** Le Soleil : sphère lumineuse + halo. La lumière vient d'une pointLight à sa position. */
export function Sun() {
  const glow = useMemo(() => glowTexture('#ffd27a'), []);
  return (
    <group position={SUN_POSITION}>
      <mesh raycast={() => null}>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <meshBasicMaterial color="#fff1c4" toneMapped={false} />
      </mesh>
      <sprite scale={SUN_RADIUS * 6} raycast={() => null}>
        <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight intensity={2.8} decay={0} distance={0} />
    </group>
  );
}
