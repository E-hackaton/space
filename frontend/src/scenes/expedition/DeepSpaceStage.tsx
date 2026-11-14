import { Suspense, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Stars } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Machine3D } from '../../components/3d/Machine3D';
import type { MachineKind } from '../../lib/machines';
import { valueNoise } from '../../world/noise';
import { smooth } from '../../world/materials';

/** Un petit corps rocheux allongé (forme stylisée, pas un relevé d'Éros). */
function Asteroid() {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 5);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = valueNoise(v.x * 2.1 + 3, v.y * 2.1 + v.z * 1.7) * 0.28 + valueNoise(v.x * 6, v.z * 6 + 1) * 0.06;
      v.multiplyScalar(0.85 + n);
      v.x *= 2.1;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return <mesh geometry={geo} material={smooth('#8a7a68', { rough: 0.95 })} castShadow receiveShadow position={[0, -1.05, 0]} />;
}

function Turn({ animate, children }: { animate: boolean; children: ReactNode }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (animate) g.current.rotation.y += dt * 0.15;
  });
  return <group ref={g}>{children}</group>;
}

/** Scène d'une machine de l'espace lointain : elle flotte parmi les étoiles (ou repose sur son astéroïde). */
export default function DeepSpaceStage({ id, kind, active, animate }: { id: string; kind: MachineKind; active: boolean; animate: boolean }) {
  const landed = id === 'near-shoemaker';
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: [3.2, 1.4, 4.2], fov: 42 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }} aria-hidden="true">
      <color attach="background" args={['#02040b']} />
      <Stars radius={120} depth={60} count={6000} factor={5} fade speed={animate ? 0.6 : 0} />
      <Sparkles count={80} scale={[14, 8, 14]} size={2} speed={animate ? 0.2 : 0} color="#9fb6ff" opacity={0.6} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[6, 3, 4]} intensity={2.8} castShadow />
      <Turn animate={animate}>
        <Suspense fallback={null}>
          {landed ? (
            <>
              <Asteroid />
              <group position={[0, -0.1, 0]} rotation={[0, 0, 0.25]}>
                <Machine3D id={id} kind={kind} active={active} size={1.2} />
              </group>
            </>
          ) : (
            <Float speed={animate ? 1.2 : 0} rotationIntensity={0.4} floatIntensity={0.6}>
              <Machine3D id={id} kind={kind} active={active} size={1.8} />
            </Float>
          )}
        </Suspense>
      </Turn>
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.7} luminanceThreshold={0.7} mipmapBlur />
        <Vignette offset={0.25} darkness={0.8} />
      </EffectComposer>
    </Canvas>
  );
}
