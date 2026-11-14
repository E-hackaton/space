/** Détecte si WebGL est utilisable ; sinon on bascule en mode léger (2D). */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export const webglAvailable = typeof document !== 'undefined' && hasWebGL();
