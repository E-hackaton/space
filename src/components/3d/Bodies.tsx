import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Atmosphere } from './Atmosphere';
import { MOON_SHOWCASE_ANGLE, SCENE, bodyRegistry, type BodyId } from '../../lib/tour';

const TEX = {
  earth: '/textures/earth_color.jpg',
  clouds: '/textures/earth_clouds.jpg',
  moon: '/textures/moon_color.jpg',
  moonBump: '/textures/moon_bump.jpg',
  mars: '/textures/mars_color.jpg',
};
useTexture.preload(Object.values(TEX));

// Vitesses de rotation de mise en scène (rad/s), pas les vraies périodes.
const SPIN = { earth: 0.05, clouds: 0.065, mars: 0.045 };

interface BodyProps {
  animate: boolean;
  label?: string;
  selected?: boolean;
  onSelect?: (id: BodyId) => void;
}

function useRegister(id: BodyId, ref: React.RefObject<THREE.Object3D>) {
  useEffect(() => {
    const obj = ref.current;
    if (!obj) return;
    bodyRegistry.set(id, obj);
    return () => {
      if (bodyRegistry.get(id) === obj) bodyRegistry.delete(id);
    };
  }, [id, ref]);
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
    <Html position={[0, radius * 1.35, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
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

export function Earth({ animate, label, selected, onSelect }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const surface = useRef<THREE.Mesh>(null!);
  const clouds = useRef<THREE.Mesh>(null!);
  const [map, cloudMap] = useTexture([TEX.earth, TEX.clouds]);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  useRegister('earth', group);

  useFrame((_, dt) => {
    if (!animate) return;
    surface.current.rotation.y += dt * SPIN.earth;
    clouds.current.rotation.y += dt * SPIN.clouds;
  });

  const r = SCENE.earth.radius;
  return (
    <group ref={group} rotation={[0, 0, THREE.MathUtils.degToRad(23.4)]}>
      <mesh ref={surface} {...clickHandlers('earth', onSelect)}>
        <sphereGeometry args={[r, 96, 96]} />
        <meshStandardMaterial map={map} roughness={0.85} metalness={0} />
      </mesh>
      <mesh ref={clouds} scale={1.012} raycast={() => null}>
        <sphereGeometry args={[r, 96, 96]} />
        <meshStandardMaterial color="#ffffff" alphaMap={cloudMap} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <Atmosphere radius={r} color="#5FA8FF" scale={1.06} power={2.6} intensity={1.4} />
      {label && <Label radius={r} selected={selected}>{label}</Label>}
    </group>
  );
}

export function Moon({ animate, label, selected, onSelect, orbiting = true }: BodyProps & { orbiting?: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const angle = useRef(0.9);
  const [map, bump] = useTexture([TEX.moon, TEX.moonBump]);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  useRegister('moon', group);

  const place = () => {
    const a = angle.current;
    const d = SCENE.moon.orbitRadius;
    group.current.position.set(d * Math.cos(a), 0.35 * Math.sin(a), d * Math.sin(a));
    // Rotation synchrone : la Lune montre toujours la même face (longitude 0) à la Terre.
    group.current.rotation.y = Math.PI - a;
  };

  useEffect(place, []);
  useFrame((_, dt) => {
    const g = group.current;
    if (orbiting) {
      g.userData.settled = false;
      if (animate) angle.current -= dt * SCENE.moon.orbitSpeed;
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

  const r = SCENE.moon.radius;
  return (
    <group ref={group}>
      <mesh {...clickHandlers('moon', onSelect)}>
        <sphereGeometry args={[r, 64, 64]} />
        <meshStandardMaterial map={map} bumpMap={bump} bumpScale={0.6} roughness={1} metalness={0} />
      </mesh>
      {label && <Label radius={r} selected={selected}>{label}</Label>}
    </group>
  );
}

export function Mars({ animate, label, selected, onSelect }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const surface = useRef<THREE.Mesh>(null!);
  const map = useTexture(TEX.mars);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  useRegister('mars', group);

  useFrame((_, dt) => {
    if (animate) surface.current.rotation.y += dt * SPIN.mars;
  });

  const r = SCENE.mars.radius;
  return (
    <group ref={group} position={SCENE.mars.position} rotation={[0, 0, THREE.MathUtils.degToRad(25.2)]}>
      <mesh ref={surface} {...clickHandlers('mars', onSelect)}>
        <sphereGeometry args={[r, 96, 96]} />
        <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
      </mesh>
      {/* Atmosphère martienne : très fine, légèrement rosée. */}
      <Atmosphere radius={r} color="#E8A27A" scale={1.03} power={4} intensity={0.6} />
      {label && <Label radius={r} selected={selected}>{label}</Label>}
    </group>
  );
}
