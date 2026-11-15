import { Suspense, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { Globe, surfaceQuaternion } from '../../scenes/atlas/PlanetGlobe';
import { Reticle } from '../../scenes/atlas/Reticle';
import type { AtlasPoint, SurfaceBody } from '../../lib/atlas';
import { Icon } from '../ui/Glyphs';
import { usePrefersReducedMotion } from '../../lib/hooks';

/** Le globe tourne doucement ; quand une machine est choisie, il pivote pour l'amener face à soi. */
function Turning({ points, target, animate, children }: { points: AtlasPoint[]; target: string | null; animate: boolean; children: ReactNode }) {
  const g = useRef<THREE.Group>(null!);
  const goal = useMemo(() => {
    const p = points.find((x) => x.machine.id === target);
    if (!p) return null;
    // Rotation qui amène la cible face à la caméra (+z), un peu au-dessus du centre.
    const face = new THREE.Vector3(0, 0.25, 1).normalize();
    return new THREE.Quaternion().setFromUnitVectors(p.shown.clone().normalize(), face);
  }, [points, target]);
  useFrame((_, dt) => {
    if (goal) g.current.quaternion.slerp(goal, 1 - Math.exp(-dt * (animate ? 3 : 30)));
    else if (animate) g.current.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), dt * 0.12);
  });
  return <group ref={g}>{children}</group>;
}

interface Props {
  body: SurfaceBody;
  points: AtlasPoint[];
  found: string[];
  target: string | null;
  onPick: (id: string) => void;
}

/** Mini-carte : le globe de l'astre en 3D, avec une cible de visée sur chaque objet oublié. */
export function MiniGlobe({ body, points, found, target, onPick }: Props) {
  const { t } = useTranslation();
  const animate = !usePrefersReducedMotion();
  const done = points.filter((p) => found.includes(p.machine.id)).length;
  const sel = points.find((p) => p.machine.id === target);
  return (
    <div className="atlas-map">
      <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-1.5">
        <p className="font-display text-sm font-extrabold uppercase tracking-widest">
          <Icon name="map" /> {t('expedition.map', { body: t(`bodies.${body}.name`) })}
          <span className="ml-2 font-sans text-xs font-normal normal-case tracking-normal text-slate-300">
            {done}/{points.length}
          </span>
        </p>
      </div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_45%,#16203f,#03050d_70%)]">
        <Canvas dpr={1} camera={{ fov: 32, position: [0, 0.35, 3.9] }} gl={{ antialias: true, alpha: true }} aria-hidden="true">
          <ambientLight intensity={0.35} />
          <directionalLight position={[3, 2, 4]} intensity={2.4} />
          <Turning points={points} target={target} animate={animate}>
            <Suspense fallback={null}>
              <Globe body={body} radius={1} />
            </Suspense>
            {points.map((p) => (
              <group key={p.machine.id} position={p.shown.clone().multiplyScalar(1.004)} quaternion={surfaceQuaternion(p.shown)}>
                <Reticle active={p.machine.status === 'active'} selected={p.machine.id === target} size={0.075} animate={animate} />
                {/* zone cliquable un peu plus large que la cible */}
                <mesh
                  visible={false}
                  onClick={(e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation();
                    onPick(p.machine.id);
                  }}
                  onPointerOver={() => (document.body.style.cursor = 'pointer')}
                  onPointerOut={() => (document.body.style.cursor = '')}
                >
                  <sphereGeometry args={[0.09, 8, 8]} />
                </mesh>
                {p.machine.id === target && (
                  <Html position={[0, 0.16, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
                    <span className="whitespace-nowrap rounded-[4px] bg-white px-2 py-0.5 text-xs font-bold text-space shadow">{p.machine.name}</span>
                  </Html>
                )}
              </group>
            ))}
          </Turning>
          <OrbitControls enablePan={false} enableZoom={false} rotateSpeed={0.6} />
        </Canvas>
        {sel && <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11px] text-slate-300">{sel.machine.location}</p>}
      </div>
      {/* Version accessible au clavier : la liste des objets */}
      <ul className="sr-only">
        {points.map((p) => (
          <li key={p.machine.id}>
            <button type="button" onClick={() => onPick(p.machine.id)}>
              {p.machine.name} · {p.machine.status === 'active' ? t('status.active') : t('status.dormant')}
              {found.includes(p.machine.id) ? ` · ${t('expedition.found')}` : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
