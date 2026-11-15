import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { useState } from 'react';
import * as THREE from 'three';
import { useWorld, type WorldId } from './state';
import EarthWorld from './worlds/EarthWorld';
import MarsWorld from './worlds/MarsWorld';
import MoonWorld from './worlds/MoonWorld';
import SpaceScene from './worlds/SpaceScene';
import { Look } from './Look';
import { ContextGuard, useCanvasGeneration } from '../components/3d/ContextGuard';

const LOOK: Record<WorldId | 'space', { tint: string; ground: string; bloom: number }> = {
  earth: { tint: '#ffe6c4', ground: '#2b4a2b', bloom: 0.7 },
  moon: { tint: '#ffffff', ground: '#3a3c42', bloom: 0.5 },
  jezero: { tint: '#ffd9b0', ground: '#6a3420', bloom: 0.5 },
  gale: { tint: '#ffd9b0', ground: '#6a3420', bloom: 0.5 },
  space: { tint: '#ffffff', ground: '#060b1a', bloom: 0.9 },
};

/** La toile 3D de l'exploration : un monde à la fois, ou l'espace pendant le voyage. */
export default function ExplorerCanvas({ animate, onPickPlanet }: { animate: boolean; onPickPlanet: (w: WorldId) => void }) {
  const world = useWorld((s) => s.world);
  const phase = useWorld((s) => s.phase);
  const target = useWorld((s) => s.target);
  const [dpr, setDpr] = useState(Math.min(1.25, window.devicePixelRatio || 1));
  const [gen, bump] = useCanvasGeneration();
  const [shadows, setShadows] = useState(true);

  return (
    <Canvas
      key={gen}
      shadows={shadows ? { type: THREE.PCFSoftShadowMap } : false}
      dpr={dpr}
      camera={{ fov: 42, near: 0.1, far: 3000, position: [0, 20, 30] }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      aria-hidden="true"
    >
      {/* Qualité automatique : on baisse la résolution, puis on coupe les ombres si l'appareil peine. */}
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setShadows(false);
        }}
        onIncline={() => setDpr(Math.min(1.25, window.devicePixelRatio || 1))}
      />
      <AdaptiveDpr pixelated />
      <ContextGuard onLost={bump} />
      <Look {...LOOK[phase === 'space' ? 'space' : world]} effects={shadows} />
      <Suspense fallback={null}>
        {phase === 'space' && target ? (
          <SpaceScene from={world} to={target} animate={animate} />
        ) : world === 'earth' ? (
          <EarthWorld animate={animate} onPickPlanet={onPickPlanet} />
        ) : world === 'moon' ? (
          <MoonWorld animate={animate} />
        ) : (
          <MarsWorld key={world} site={world} animate={animate} />
        )}
      </Suspense>
    </Canvas>
  );
}
