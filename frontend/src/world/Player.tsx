import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerRover } from './props/Vehicles';
import { drive } from './state';
import type { HeightField } from './terrain';

/** Position partagée du joueur (lue par les autres éléments du monde). */
export const player = {
  x: 0,
  z: 0,
  heading: 0,
  speed: 0,
  active: false,
  /** Secousse après un choc contre un obstacle (0 → 1), qui s'atténue toute seule. */
  bump: 0,
};

/** Obstacles du monde en cours (lus par le pilote automatique). */
export const worldObstacles: { list: Obstacle[] } = { list: [] };

/** Demi-largeur du rover du joueur, pour les collisions (en mètres). */
const ROVER_RADIUS = 1.1;

export interface Obstacle {
  x: number;
  z: number;
  r: number;
}

interface Props {
  field: HeightField;
  start: [number, number];
  startHeading?: number;
  obstacles?: Obstacle[];
  /** Conduite possible (sinon le rover reste immobile, ex. pendant une cinématique). */
  enabled: boolean;
  /** Caméra qui suit le rover. */
  followCamera: boolean;
  animate: boolean;
  visible?: boolean;
}

const MAX_SPEED = 16;
const tmpUp = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpQ2 = new THREE.Quaternion();
const Y = new THREE.Vector3(0, 1, 0);

/**
 * Le rover du joueur : conduite « arcade » (pas de moteur physique, pour rester léger),
 * qui épouse le relief, et caméra de trois quarts qui le suit.
 */
export function Player({ field, start, startHeading = 0, obstacles = [], enabled, followCamera, animate, visible = true }: Props) {
  worldObstacles.list = obstacles;
  const group = useRef<THREE.Group>(null!);
  const spin = useRef(0);
  const steer = useRef(0);
  const camYaw = useRef(startHeading);
  const camTarget = useRef(new THREE.Vector3());
  const first = useRef(true);

  useEffect(() => {
    player.x = start[0];
    player.z = start[1];
    player.heading = startHeading;
    player.speed = 0;
    player.active = true;
    first.current = true;
    return () => {
      player.active = false;
    };
  }, [start, startHeading]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const g = group.current;
    const p = player;

    if (enabled) {
      const throttle = drive.forward - drive.back;
      p.speed += throttle * (throttle * p.speed < 0 ? 40 : 22) * dt;
      p.speed *= 1 - (throttle === 0 ? 1.8 : 0.5) * dt;
      if (drive.brake) p.speed *= 1 - 5 * dt;
      p.speed = THREE.MathUtils.clamp(p.speed, -MAX_SPEED * 0.5, MAX_SPEED);
      const steerInput = drive.left - drive.right;
      steer.current = THREE.MathUtils.lerp(steer.current, steerInput * 0.45, 1 - Math.exp(-dt * 10));
      const grip = THREE.MathUtils.clamp(Math.abs(p.speed) / 5, 0, 1);
      p.heading += steerInput * 2 * grip * Math.sign(p.speed || 1) * dt;
    } else {
      p.speed *= 1 - 4 * dt;
    }

    // Avancer (avant = -Z local).
    p.x += -Math.sin(p.heading) * p.speed * dt;
    p.z += -Math.cos(p.heading) * p.speed * dt;
    // Bords du monde et obstacles.
    const lim = field.half - 4;
    p.x = THREE.MathUtils.clamp(p.x, -lim, lim);
    p.z = THREE.MathUtils.clamp(p.z, -lim, lim);
    // Collision : on repousse le rover hors de l'obstacle. S'il fonce droit dessus il s'arrête ;
    // s'il le frôle, il glisse le long (on ne retire que la part de vitesse dirigée vers l'obstacle).
    const fx = -Math.sin(p.heading) * Math.sign(p.speed || 1);
    const fz = -Math.cos(p.heading) * Math.sign(p.speed || 1);
    let impact = 0;
    for (const o of obstacles) {
      const dx = p.x - o.x;
      const dz = p.z - o.z;
      if (Math.abs(dx) > o.r + ROVER_RADIUS || Math.abs(dz) > o.r + ROVER_RADIUS) continue; // tri rapide
      const d = Math.hypot(dx, dz);
      const min = o.r + ROVER_RADIUS;
      if (d < min && d > 1e-4) {
        p.x = o.x + (dx / d) * min;
        p.z = o.z + (dz / d) * min;
        impact = Math.max(impact, -(fx * dx + fz * dz) / d); // 1 = de face, 0 = en glissant
      }
    }
    if (impact > 0) {
      p.bump = Math.max(p.bump, (Math.abs(p.speed) / MAX_SPEED) * impact);
      p.speed *= 1 - 0.9 * impact;
    }
    p.bump *= Math.exp(-dt * 6);

    // Épouser le relief : hauteur + inclinaison d'après 4 points autour du rover.
    const h = field.heightAt(p.x, p.z);
    const e = 0.9;
    const hx = field.heightAt(p.x + e, p.z) - field.heightAt(p.x - e, p.z);
    const hz = field.heightAt(p.x, p.z + e) - field.heightAt(p.x, p.z - e);
    tmpUp.set(-hx, 2 * e, -hz).normalize();
    g.position.set(p.x, h, p.z);
    tmpQ.setFromUnitVectors(Y, tmpUp);
    tmpQ2.setFromAxisAngle(Y, p.heading);
    g.quaternion.slerp(tmpQ.multiply(tmpQ2), 1 - Math.exp(-dt * 10));
    spin.current -= (p.speed * dt) / 0.32;

    // Caméra de trois quarts, qui tourne doucement avec le rover.
    if (followCamera) {
      const cam = state.camera;
      camYaw.current = THREE.MathUtils.lerp(camYaw.current, p.heading, 1 - Math.exp(-dt * 1.2));
      const dist = 17 + Math.abs(p.speed) * 0.25;
      const want = new THREE.Vector3(p.x + Math.sin(camYaw.current) * dist, h + 11.5, p.z + Math.cos(camYaw.current) * dist);
      camTarget.current.lerp(new THREE.Vector3(p.x, h + 1, p.z), first.current || !animate ? 1 : 1 - Math.exp(-dt * 8));
      cam.position.lerp(want, first.current || !animate ? 1 : 1 - Math.exp(-dt * 3));
      // Petite secousse de caméra au choc (désactivée si l'utilisateur réduit les animations).
      if (animate && p.bump > 0.01) {
        const k = p.bump * 0.6;
        cam.position.x += Math.sin(state.clock.elapsedTime * 47) * k;
        cam.position.y += Math.sin(state.clock.elapsedTime * 61) * k * 0.6;
      }
      cam.up.set(0, 1, 0);
      cam.lookAt(camTarget.current);
      first.current = false;
    }
  });

  return (
    <group visible={visible}>
      <PlayerRover ref={group} spin={spin} steer={steer} />
    </group>
  );
}
