import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Si la carte graphique perd le contexte WebGL (mémoire saturée, pilote qui se réinitialise),
 * la scène resterait noire. Ce garde l'empêche : il signale la perte et la scène se reconstruit.
 */
export function ContextGuard({ onLost }: { onLost: () => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault(); // autorise la restauration
      onLost();
    };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onLost]);
  return null;
}

/** Clé de reconstruction d'une toile 3D : elle change (après un court délai) à chaque perte de contexte. */
export function useCanvasGeneration(): [number, () => void] {
  const [gen, setGen] = useState(0);
  const bump = useState(() => () => window.setTimeout(() => setGen((g) => g + 1), 400))[0];
  return [gen, bump];
}
