import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { BODIES, OVERVIEW, bodyRegistry, viewDirectionFor, type BodyId, type TourStop } from '../lib/solarSystem';

/**
 * Direction de la caméra autour d'un astre. Pour la Lune, on se place côté Terre
 * pour voir la face visible (celle des sites Apollo), un peu décalé vers le Soleil.
 */
function viewDirection(stop: BodyId, target: THREE.Vector3): THREE.Vector3 {
  const base = viewDirectionFor(target);
  if (stop !== 'moon') return base;
  const toEarth = BODIES.earth.position.clone().sub(target).normalize();
  return toEarth.multiplyScalar(0.8).addScaledVector(base, 0.45).add(new THREE.Vector3(0, 0.15, 0)).normalize();
}

interface FreeCameraProps {
  focus: TourStop;
  animate: boolean;
  /** Distance de la caméra, en rayons de l'astre visé. */
  framing: number;
  /** Décalage vertical de l'astre à l'écran, en rayons (positif = plus haut). */
  liftY: number;
}

/**
 * Caméra libre (rotation, zoom) qui vole vers l'étape demandée : vol fluide,
 * ou coupe nette si mouvement réduit. Rejoue le cadrage tant que l'astre visé
 * n'est pas encore chargé, et suit la Lune pendant qu'elle glisse vers sa phase.
 */
export function FreeCamera({ focus, animate, framing, liftY }: FreeCameraProps) {
  const controls = useRef<CameraControls>(null!);
  const pending = useRef<TourStop | null>(focus);
  const first = useRef(true);
  const follow = useRef<BodyId | null>(null);

  useEffect(() => {
    pending.current = focus;
  }, [focus, framing, liftY]);

  const frameBody = (c: CameraControls, stop: BodyId, transition: boolean): boolean => {
    const handle = bodyRegistry.get(stop);
    if (!handle) return false;
    const target = handle.group.getWorldPosition(new THREE.Vector3());
    const r = BODIES[stop].radius;
    const span = BODIES[stop].rings ? r * BODIES[stop].rings!.outer : r;
    const cam = target.clone().addScaledVector(viewDirection(stop, target), span * framing);
    c.minDistance = r * 1.4;
    c.maxDistance = 200;
    void c.setLookAt(cam.x, cam.y, cam.z, target.x, target.y, target.z, transition);
    void c.setFocalOffset(0, span * liftY, 0, transition);
    return true;
  };

  useFrame(({ camera }) => {
    const c = controls.current;
    if (!c) return;
    if (camera.up.y < 0.999) {
      camera.up.set(0, 1, 0);
      c.updateCameraUp();
    }
    if (follow.current && !pending.current) {
      const handle = bodyRegistry.get(follow.current);
      frameBody(c, follow.current, animate);
      if (!handle || handle.group.userData.settled !== false) follow.current = null;
    }
    const stop = pending.current;
    if (!stop) return;
    // Premier cadrage : pas de vol, on arrive directement.
    const transition = animate && !first.current;
    if (stop === 'overview') {
      const { position: p, target: t } = OVERVIEW;
      c.minDistance = 2;
      c.maxDistance = 200;
      void c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, transition);
      void c.setFocalOffset(0, 0, 0, transition);
      follow.current = null;
    } else {
      if (!frameBody(c, stop, transition)) return; // pas encore chargé
      follow.current = stop === 'moon' ? 'moon' : null;
    }
    pending.current = null;
    first.current = false;
  });

  return <CameraControls ref={controls} makeDefault smoothTime={0.9} draggingSmoothTime={0.15} truckSpeed={0} />;
}
