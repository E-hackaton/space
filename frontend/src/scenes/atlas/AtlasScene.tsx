import { Suspense, useEffect, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { AtlasLights, Globe, Marker } from './PlanetGlobe';
import { GLOBE_R, type AtlasPoint, type SurfaceBody } from '../../lib/atlas';

/** Vol de caméra vers la machine choisie (le globe reste immobile, c'est la caméra qui tourne autour). */
function FlyTo({ point, controls, animate }: { point?: AtlasPoint; controls: RefObject<OrbitControlsImpl | null>; animate: boolean }) {
  const { camera } = useThree();
  const goal = useRef<THREE.Vector3 | null>(null);
  useEffect(() => {
    goal.current = point ? point.shown.clone().multiplyScalar(GLOBE_R * 2.1) : null;
  }, [point]);
  useFrame((_, dt) => {
    if (!goal.current) return;
    const k = animate ? 1 - Math.exp(-dt * 2.2) : 1;
    // passe par une trajectoire courbe : on interpole la direction, puis la distance
    const dir = camera.position.clone().normalize().lerp(goal.current.clone().normalize(), k).normalize();
    const dist = THREE.MathUtils.lerp(camera.position.length(), goal.current.length(), k);
    camera.position.copy(dir.multiplyScalar(dist));
    controls.current?.update();
    if (camera.position.distanceTo(goal.current) < 0.05) goal.current = null;
  });
  return null;
}

interface Props {
  body: SurfaceBody;
  points: AtlasPoint[];
  selected: string | null;
  found: string[];
  animate: boolean;
  onSelect: (id: string) => void;
}

/** Atlas 3D vivant : le globe tourne lentement, on le fait pivoter du doigt, chaque balise est cliquable. */
export default function AtlasScene({ body, points, selected, found, animate, onSelect }: Props) {
  const controls = useRef<OrbitControlsImpl>(null);
  const point = points.find((p) => p.machine.id === selected);
  return (
    <Canvas dpr={[1, 1.6]} camera={{ fov: 40, position: [0, 6, 34] }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} aria-hidden="true">
      <color attach="background" args={['#03050d']} />
      <Stars radius={200} depth={80} count={6000} factor={6} fade speed={animate ? 0.4 : 0} />
      <AtlasLights body={body} />
      <Suspense fallback={null}>
        <Globe body={body} />
      </Suspense>
      {points.map((p) => (
        <Marker key={p.machine.id} point={p} selected={p.machine.id === selected} discovered={found.includes(p.machine.id)} onSelect={onSelect} animate={animate} scale={0.9} />
      ))}
      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={GLOBE_R * 1.35}
        maxDistance={GLOBE_R * 4.5}
        autoRotate={animate && !selected}
        autoRotateSpeed={0.35}
        rotateSpeed={0.5}
        enableDamping
      />
      <FlyTo point={point} controls={controls} animate={animate} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.8} luminanceThreshold={0.75} mipmapBlur />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
