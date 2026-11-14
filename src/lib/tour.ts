import * as THREE from 'three';

export type TourStop = 'overview' | 'earth' | 'moon' | 'mars';
export type BodyId = Exclude<TourStop, 'overview'>;

/**
 * Mise en scène de la visite. Tailles et distances NON à l'échelle :
 * choisies pour que tout tienne à l'écran et que la navigation reste agréable.
 * Seules les tailles relatives Terre / Lune / Mars sont à peu près respectées.
 */
export const SCENE = {
  sunDirection: new THREE.Vector3(1, 0.15, 0.45).normalize(),
  earth: { radius: 1 },
  moon: { radius: 0.27, orbitRadius: 3.2, orbitSpeed: 0.04 },
  mars: { radius: 0.53, position: new THREE.Vector3(14, 0.8, -9) },
  overview: { position: new THREE.Vector3(4, 7, 20), target: new THREE.Vector3(6, 0, -3) },
};

/**
 * Angle d'orbite où la Lune montre sa face visible bien éclairée (phase gibbeuse) :
 * presque à l'opposé du Soleil, décalé pour garder un peu d'ombre rasante sur le relief.
 */
export const MOON_SHOWCASE_ANGLE = Math.atan2(-SCENE.sunDirection.z, -SCENE.sunDirection.x) + 0.6;

export const TOUR_STOPS: TourStop[] = ['overview', 'earth', 'moon', 'mars'];

export function bodyRadius(id: BodyId): number {
  return SCENE[id].radius;
}

/** Direction depuis laquelle la caméra regarde un astre : côté éclairé, un peu en hauteur. */
export const VIEW_DIRECTION = new THREE.Vector3()
  .copy(SCENE.sunDirection)
  .multiplyScalar(0.55)
  .add(new THREE.Vector3(0, 0.2, 1))
  .normalize();

/** Registre des objets 3D des astres, pour que la caméra sache où ils sont. */
export const bodyRegistry = new Map<BodyId, THREE.Object3D>();
