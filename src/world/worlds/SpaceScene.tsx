import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, useTexture } from '@react-three/drei';
import { Atmosphere } from '../../components/3d/Atmosphere';
import * as THREE from 'three';
import { ToonRocket } from '../props/Vehicles';
import { ship, type WorldId } from '../state';

/** Positions des astres pendant le voyage (mise en scène, pas à l'échelle). */
const SPOTS = {
  earth: { pos: new THREE.Vector3(0, 0, 0), r: 10, tex: '/textures/earth_color.jpg', glow: '#5fa8ff' },
  moon: { pos: new THREE.Vector3(-34, 8, -40), r: 3.5, tex: '/textures/moon_color.jpg', glow: '#c9d3ff' },
  mars: { pos: new THREE.Vector3(70, -6, -110), r: 6, tex: '/textures/mars_color.jpg', glow: '#ff9a6a' },
};
const SUN_DIR = new THREE.Vector3(-60, 30, 40).normalize();
const bodyOf = (w: WorldId) => (w === 'earth' ? 'earth' : w === 'moon' ? 'moon' : 'mars');

function Planet({ id }: { id: keyof typeof SPOTS }) {
  const s = SPOTS[id];
  const map = useTexture(s.tex);
  map.colorSpace = THREE.SRGBColorSpace;
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.08));
  return (
    <group position={s.pos}>
      <mesh ref={ref}>
        <sphereGeometry args={[s.r, 64, 64]} />
        <meshStandardMaterial map={map} roughness={0.9} />
      </mesh>
      <Atmosphere radius={s.r} color={s.glow} sunDir={SUN_DIR} scale={1.06} power={2.4} intensity={1.5} />
    </group>
  );
}

/** Le voyage entre deux mondes : la fusée suit un arc d'un astre à l'autre. */
export default function SpaceScene({ from, to, animate }: { from: WorldId; to: WorldId; animate: boolean }) {
  const rocket = useRef<THREE.Group>(null!);
  const flame = useRef(1);
  const curve = useMemo(() => {
    const a = SPOTS[bodyOf(from)];
    const b = SPOTS[bodyOf(to)];
    const dir = b.pos.clone().sub(a.pos).normalize();
    const p0 = a.pos.clone().addScaledVector(dir, a.r + 2);
    const p2 = b.pos.clone().addScaledVector(dir, -(b.r + 2));
    const p1 = p0.clone().lerp(p2, 0.5).add(new THREE.Vector3(0, 14, 0));
    return new THREE.QuadraticBezierCurve3(p0, p1, p2);
  }, [from, to]);

  useFrame((state, dt) => {
    const t = ship.travel;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(Math.min(0.999, t));
    rocket.current.position.copy(p);
    rocket.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
    const cam = state.camera;
    const want = p.clone().addScaledVector(tan, -16).add(new THREE.Vector3(6, 7, 6));
    cam.position.lerp(want, animate ? 1 - Math.exp(-dt * 3) : 1);
    cam.up.set(0, 1, 0);
    cam.lookAt(p.clone().lerp(curve.v2, 0.35));
  });

  return (
    <>
      <color attach="background" args={['#060B1A']} />
      <Stars radius={250} depth={80} count={6000} factor={6} fade speed={animate ? 1 : 0} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-60, 30, 40]} intensity={2.6} color="#fff3dc" />
      <Planet id="earth" />
      <Planet id="moon" />
      <Planet id="mars" />
      <group ref={rocket} scale={0.35}>
        <ToonRocket flame={flame} />
      </group>
    </>
  );
}
