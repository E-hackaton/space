import { Suspense, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor, Stars } from '@react-three/drei';

/** Canvas commun à toutes les scènes : fond spatial, étoiles, lumière solaire latérale. */
export function SpaceCanvas({ children, cameraZ = 3.2 }: { children: ReactNode; cameraZ?: number }) {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, cameraZ], fov: 45 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <AdaptiveDpr pixelated />
      <color attach="background" args={['#060B1A']} />
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 1.5, 2]} intensity={2.2} />
      <Stars radius={80} depth={40} count={2500} factor={3} fade speed={0.3} />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
