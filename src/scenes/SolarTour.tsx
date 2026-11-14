import { SceneCanvas } from './SceneCanvas';
import { SolarSystemBodies } from './SolarSystemBodies';
import { FreeCamera } from './FreeCamera';
import type { BodyId, TourStop } from '../lib/solarSystem';

interface SolarTourProps {
  focus: TourStop;
  /** Rotation à la souris / au doigt et clic sur les astres. */
  interactive?: boolean;
  /** Animations (rotations, orbite, vols). Désactivées si prefers-reduced-motion. */
  animate?: boolean;
  showLabels?: boolean;
  onSelect?: (id: BodyId) => void;
  framing?: number;
  liftY?: number;
}

/** Système solaire explorable avec une caméra libre. */
export default function SolarTour({ focus, interactive = true, animate = true, showLabels = true, onSelect, framing = 3.4, liftY = 0 }: SolarTourProps) {
  return (
    <SceneCanvas interactive={interactive} animate={animate}>
      <SolarSystemBodies
        animate={animate}
        showLabels={showLabels}
        selected={focus === 'overview' ? null : focus}
        onSelect={interactive ? onSelect : undefined}
        moonOrbiting={focus !== 'moon'}
      />
      <FreeCamera focus={focus} animate={animate} framing={framing} liftY={liftY} />
    </SceneCanvas>
  );
}
