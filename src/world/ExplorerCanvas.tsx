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

/** La toile 3D de l'exploration : un monde à la fois, ou l'espace pendant le voyage. */
export default function ExplorerCanvas({ animate, onPickPlanet }: { animate: boolean; onPickPlanet: (w: WorldId) => void }) {
  const world = useWorld((s) => s.world);
  const phase = useWorld((s) => s.phase);
  const target = useWorld((s) => s.target);
  const [dpr, setDpr] = useState(1.5);
  const [shadows, setShadows] = useState(true);

  return (
    <Canvas
      shadows={shadows ? { type: THREE.PCFSoftShadowMap } : false}
      dpr={dpr}
      camera={{ fov: 42, near: 0.1, far: 900, position: [0, 20, 30] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
      // Pas de correction de tons : des couleurs franches, façon dessin animé.
      flat
    >
      {/* Qualité automatique : on baisse la résolution, puis on coupe les ombres si l'appareil peine. */}
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setShadows(false);
        }}
        onIncline={() => setDpr(1.5)}
      />
      <AdaptiveDpr pixelated />
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
