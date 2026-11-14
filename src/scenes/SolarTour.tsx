import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, CameraControls, PerformanceMonitor, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { Earth, Mars, Moon } from '../components/3d/Bodies';
import { SCENE, VIEW_DIRECTION, bodyRadius, bodyRegistry, type BodyId, type TourStop } from '../lib/tour';

interface SolarTourProps {
  focus: TourStop;
  /** Rotation à la souris / au doigt et clic sur les astres. */
  interactive?: boolean;
  /** Animations (rotations, orbite, vols). Désactivées si prefers-reduced-motion. */
  animate?: boolean;
  showLabels?: boolean;
  onSelect?: (id: BodyId) => void;
  /** Distance de la caméra, en rayons de l'astre visé. */
  framing?: number;
  /** Décalage vertical de l'astre à l'écran, en rayons (positif = plus haut). */
  liftY?: number;
}

/**
 * Direction de la caméra autour d'un astre. Pour la Lune, on se place côté Terre
 * pour voir la face visible (celle des sites Apollo), un peu décalé vers le Soleil.
 */
function viewDirection(stop: BodyId, target: THREE.Vector3): THREE.Vector3 {
  if (stop !== 'moon') return VIEW_DIRECTION;
  const toEarth = target.clone().negate().normalize();
  return toEarth.multiplyScalar(0.8).addScaledVector(SCENE.sunDirection, 0.45).add(new THREE.Vector3(0, 0.15, 0)).normalize();
}

/**
 * Déplace la caméra vers l'étape demandée : vol fluide, ou coupe nette si mouvement réduit.
 * Le vol est rejoué à chaque image tant que l'astre visé n'est pas encore chargé (textures en cours).
 */
function CameraRig({ focus, animate, framing, liftY }: { focus: TourStop; animate: boolean; framing: number; liftY: number }) {
  const controls = useRef<CameraControls>(null!);
  const pending = useRef<TourStop | null>(focus);
  const first = useRef(true);
  /** Astre que la caméra suit tant qu'il se déplace (la Lune qui glisse vers sa phase). */
  const follow = useRef<BodyId | null>(null);

  useEffect(() => {
    pending.current = focus;
  }, [focus, framing, liftY]);

  const frameBody = (c: CameraControls, stop: BodyId, transition: boolean): boolean => {
    const obj = bodyRegistry.get(stop);
    if (!obj) return false;
    const target = obj.getWorldPosition(new THREE.Vector3());
    const r = bodyRadius(stop);
    const cam = target.clone().addScaledVector(viewDirection(stop, target), r * framing);
    c.minDistance = r * 1.4;
    c.maxDistance = Math.max(r * 12, 60);
    void c.setLookAt(cam.x, cam.y, cam.z, target.x, target.y, target.z, transition);
    // Remonte l'astre à l'écran pour laisser la place au texte en bas.
    void c.setFocalOffset(0, r * liftY, 0, transition);
    return true;
  };

  useFrame(() => {
    const c = controls.current;
    if (!c) return;
    if (follow.current && !pending.current) {
      const obj = bodyRegistry.get(follow.current);
      frameBody(c, follow.current, animate);
      if (!obj || obj.userData.settled !== false) follow.current = null;
    }
    const stop = pending.current;
    if (!stop) return;
    // Premier cadrage : pas de vol, on arrive directement.
    const transition = animate && !first.current;

    if (stop === 'overview') {
      const { position: p, target: t } = SCENE.overview;
      c.minDistance = 2;
      c.maxDistance = 60;
      void c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, transition);
      void c.setFocalOffset(0, 0, 0, transition);
      follow.current = null;
    } else {
      // Pas encore chargé : on réessaiera à l'image suivante.
      if (!frameBody(c, stop, transition)) return;
      follow.current = stop === 'moon' ? 'moon' : null;
    }
    pending.current = null;
    first.current = false;
  });

  return <CameraControls ref={controls} makeDefault smoothTime={0.9} draggingSmoothTime={0.15} truckSpeed={0} />;
}

export default function SolarTour({
  focus,
  interactive = true,
  animate = true,
  showLabels = true,
  onSelect,
  framing = 3.4,
  liftY = 0,
}: SolarTourProps) {
  const { t } = useTranslation();
  const [dpr, setDpr] = useState(1.5);
  const select = interactive ? onSelect : undefined;
  const label = (id: BodyId) => (showLabels ? t(`chapters.${id}.title`) : undefined);

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: SCENE.overview.position.toArray(), fov: 45, near: 0.05, far: 500 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
      // Scène non interactive : on coupe les événements plutôt que de désactiver CameraControls
      // (désactivé, il ne place plus la caméra du tout).
      style={interactive ? undefined : { pointerEvents: 'none' }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <AdaptiveDpr pixelated />
      <color attach="background" args={['#060B1A']} />
      {/* Le Soleil : une lumière directionnelle latérale, et un peu d'ambiance pour déboucher les ombres. */}
      <directionalLight position={SCENE.sunDirection.clone().multiplyScalar(50).toArray()} intensity={2.6} />
      <ambientLight intensity={0.06} />
      <Stars radius={120} depth={60} count={4000} factor={4} saturation={0} fade speed={animate ? 0.4 : 0} />
      <Suspense fallback={null}>
        <Earth animate={animate} label={label('earth')} selected={focus === 'earth'} onSelect={select} />
        <Moon animate={animate} orbiting={focus !== 'moon'} label={label('moon')} selected={focus === 'moon'} onSelect={select} />
        <Mars animate={animate} label={label('mars')} selected={focus === 'mars'} onSelect={select} />
      </Suspense>
      <CameraRig focus={focus} animate={animate} framing={framing} liftY={liftY} />
    </Canvas>
  );
}
