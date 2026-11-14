import { useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor, Stars } from '@react-three/drei';
import { OVERVIEW } from '../lib/solarSystem';

/** Toile 3D commune : fond spatial, étoiles, qualité adaptative. */
export function SceneCanvas({ children, interactive = true, animate = true }: { children: ReactNode; interactive?: boolean; animate?: boolean }) {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: OVERVIEW.position.toArray(), fov: 45, near: 0.01, far: 800 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
      style={interactive ? undefined : { pointerEvents: 'none' }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <AdaptiveDpr pixelated />
      <color attach="background" args={['#060B1A']} />
      <ambientLight intensity={0.05} />
      <Stars radius={300} depth={80} count={5000} factor={6} saturation={0} fade speed={animate ? 0.4 : 0} />
      {children}
    </Canvas>
  );
}
