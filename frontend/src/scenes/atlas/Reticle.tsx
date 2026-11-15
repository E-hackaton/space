import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/*
 * Cible de visée posée à plat sur la surface d'un globe : double anneau, quatre repères,
 * point central, et une onde qui pulse si la machine est active. Vert : active ; ambre : endormie.
 * Repère local : la surface est le plan XZ, la normale est +Y.
 */
export function Reticle({ active, selected, size = 1, animate }: { active: boolean; selected?: boolean; size?: number; animate: boolean }) {
  const color = selected ? '#ffffff' : active ? '#4BE08A' : '#E0A458';
  const wave = useRef<THREE.Mesh>(null!);
  const spin = useRef<THREE.Group>(null!);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }), [color]);
  const waveMat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }), [color]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (spin.current) spin.current.rotation.y = animate ? t * (selected ? 1.4 : 0.6) : 0;
    if (wave.current) {
      const k = animate && active ? (t * 0.7) % 1 : 0;
      wave.current.visible = active;
      wave.current.scale.setScalar(1 + k * 1.6);
      waveMat.opacity = 0.8 * (1 - k);
    }
  });
  const s = size * (selected ? 1.5 : 1);
  return (
    <group scale={s}>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        {/* anneau intérieur, point central */}
        <mesh material={mat}>
          <ringGeometry args={[0.32, 0.4, 40]} />
        </mesh>
        <mesh material={mat}>
          <circleGeometry args={[0.1, 20]} />
        </mesh>
        {/* onde */}
        <mesh ref={wave} material={waveMat}>
          <ringGeometry args={[0.55, 0.6, 48]} />
        </mesh>
      </group>
      {/* anneau extérieur en tirets et repères de visée, qui tournent lentement */}
      <group ref={spin}>
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          {Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} material={mat}>
              <ringGeometry args={[0.66, 0.72, 6, 1, (i / 12) * Math.PI * 2, (Math.PI * 2) / 12 - 0.18]} />
            </mesh>
          ))}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={`t${i}`} material={mat} rotation={[0, 0, (i * Math.PI) / 2]} position={[Math.cos((i * Math.PI) / 2) * 0.86, Math.sin((i * Math.PI) / 2) * 0.86, 0]}>
              <planeGeometry args={[0.24, 0.05]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
