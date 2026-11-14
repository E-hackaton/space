import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { glowTexture } from '../../components/3d/glow';
import { player } from '../Player';
import type { HeightField } from '../terrain';

interface Props {
  field: HeightField;
  color: string;
  /** Pesanteur du monde (m/s²) : 1,62 sur la Lune, 3,71 sur Mars. */
  gravity: number;
  /**
   * Freinage par l'air (1/s). Sur la Lune, il n'y a pas d'air : 0. La poussière suit alors
   * une parabole parfaite et retombe d'un coup, au lieu de flotter en nuage comme sur Terre.
   */
  drag: number;
  /** Faut-il émettre (le joueur conduit) ? */
  active: boolean;
  count?: number;
}

/** Points de départ de la poussière : derrière les roues arrière, en repère du rover (avant = −Z). */
const WHEELS: [number, number][] = [
  [-0.75, 0.9],
  [0.75, 0.9],
];

/**
 * Poussière soulevée par les roues du rover. Chaque grain est lancé vers le haut et l'arrière,
 * puis suit la vraie pesanteur du monde jusqu'à retoucher le sol.
 */
export function DustTrail({ field, color, gravity, drag, active, count = 500 }: Props) {
  // Halo blanc teinté par la couleur du matériau (évite de teinter deux fois).
  const sprite = useMemo(() => glowTexture('#ffffff'), []);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3).fill(-9999), 3));
    return g;
  }, [count]);
  // État de chaque grain : vitesse et durée de vie restante (0 = libre).
  const velocity = useMemo(() => new Float32Array(count * 3), [count]);
  const life = useMemo(() => new Float32Array(count), [count]);
  const cursor = useRef(0);
  const toEmit = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    // Émission proportionnelle à la vitesse du rover.
    const speed = Math.abs(player.speed);
    if (active && speed > 1.2) {
      toEmit.current += speed * 9 * dt;
      const sin = Math.sin(player.heading);
      const cos = Math.cos(player.heading);
      while (toEmit.current >= 1) {
        toEmit.current -= 1;
        const i = cursor.current;
        cursor.current = (cursor.current + 1) % count;
        const [lx, lz] = WHEELS[i % 2];
        // Repère local → monde (rotation autour de Y par `heading`).
        const x = player.x + lx * cos + lz * sin;
        const z = player.z - lx * sin + lz * cos;
        arr[i * 3] = x;
        arr[i * 3 + 1] = field.heightAt(x, z) + 0.15;
        arr[i * 3 + 2] = z;
        // Vers l'arrière (opposé au mouvement), vers le haut, et un peu sur les côtés.
        const back = Math.sign(player.speed) * (0.25 + Math.random() * 0.35) * speed;
        velocity[i * 3] = sin * back + (Math.random() - 0.5) * 1.6;
        velocity[i * 3 + 1] = 1.2 + Math.random() * (1 + speed * 0.18);
        velocity[i * 3 + 2] = cos * back + (Math.random() - 0.5) * 1.6;
        life[i] = 6;
      }
    }

    // Mouvement : pesanteur, éventuel freinage par l'air, arrêt au contact du sol.
    const damping = Math.exp(-drag * dt);
    for (let i = 0; i < count; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt;
      velocity[i * 3] *= damping;
      velocity[i * 3 + 2] *= damping;
      velocity[i * 3 + 1] = velocity[i * 3 + 1] * damping - gravity * dt;
      const x = (arr[i * 3] += velocity[i * 3] * dt);
      const y = (arr[i * 3 + 1] += velocity[i * 3 + 1] * dt);
      const z = (arr[i * 3 + 2] += velocity[i * 3 + 2] * dt);
      if (life[i] <= 0 || y < field.heightAt(x, z)) {
        life[i] = 0;
        arr[i * 3 + 1] = -9999; // retombé : on le cache sous le sol
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial map={sprite} color={color} size={0.75} sizeAttenuation transparent opacity={0.95} depthWrite={false} />
    </points>
  );
}
