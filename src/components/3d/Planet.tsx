import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlanetProps {
  color: string;
  radius?: number;
  atmosphere?: string;
  rotate?: boolean;
}

/**
 * Planète simple (sphère colorée). Les textures NASA (LRO, Blue Marble, MOLA)
 * remplaceront la couleur unie dans les chapitres dédiés.
 */
export function Planet({ color, radius = 1, atmosphere, rotate = true }: PlanetProps) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (rotate && mesh.current) mesh.current.rotation.y += delta * 0.05;
  });
  return (
    <group>
      <mesh ref={mesh}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      {atmosphere && (
        <mesh scale={1.06}>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshBasicMaterial color={atmosphere} transparent opacity={0.12} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}
