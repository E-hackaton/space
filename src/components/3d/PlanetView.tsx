import { SpaceCanvas } from './SpaceCanvas';
import { Planet } from './Planet';
import { webglAvailable } from '../../lib/device';
import { usePrefersReducedMotion } from '../../lib/hooks';

interface PlanetViewProps {
  color: string;
  atmosphere?: string;
}

/** Vue d'une planète en 3D, ou en SVG si WebGL est indisponible (mode léger). */
export default function PlanetView({ color, atmosphere }: PlanetViewProps) {
  const reduced = usePrefersReducedMotion();
  if (!webglAvailable) {
    return (
      <svg viewBox="0 0 200 200" className="h-full w-full bg-space" aria-hidden="true">
        <defs>
          <radialGradient id="shade" cx="70%" cy="40%" r="70%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#060B1A" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="60" fill="url(#shade)" />
      </svg>
    );
  }
  return (
    <SpaceCanvas>
      <Planet color={color} atmosphere={atmosphere} rotate={!reduced} />
    </SpaceCanvas>
  );
}
