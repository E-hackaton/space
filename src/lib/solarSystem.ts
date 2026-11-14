import * as THREE from 'three';

export type BodyId = 'mercury' | 'venus' | 'earth' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'deep-space';
export type TourStop = 'overview' | BodyId;

export interface BodyConfig {
  id: BodyId;
  /** Rayon dans la scène (PAS à l'échelle). */
  radius: number;
  /** Position dans la scène (PAS à l'échelle). La Lune l'ignore : elle orbite autour de la Terre. */
  position: THREE.Vector3;
  texture?: string;
  bump?: string;
  clouds?: string;
  color: string;
  /** Inclinaison de l'axe, en degrés (valeurs connues, à vérifier avant publication). */
  tiltDeg: number;
  /** Vitesse de rotation de mise en scène (rad/s), pas la vraie période. */
  spin: number;
  atmosphere?: { color: string; scale: number; power: number; intensity: number };
  rings?: { inner: number; outer: number; texture: string };
}

/**
 * Mise en scène du Système solaire. Tailles et distances NON à l'échelle :
 * les astres sont alignés du plus proche du Soleil au plus lointain, assez près
 * pour que la navigation reste agréable.
 */
export const SUN_POSITION = new THREE.Vector3(-52, 3, -14);
export const SUN_RADIUS = 5;

export const BODIES: Record<BodyId, BodyConfig> = {
  mercury: {
    id: 'mercury', radius: 0.38, position: new THREE.Vector3(-21, 0, -3),
    texture: '/textures/mercury_color.jpg', color: '#9a9a9a', tiltDeg: 0, spin: 0.03,
  },
  venus: {
    id: 'venus', radius: 0.95, position: new THREE.Vector3(-12, 0.3, 1),
    texture: '/textures/venus_clouds.jpg', color: '#e3c58f', tiltDeg: 177, spin: 0.01,
    atmosphere: { color: '#ffd9a0', scale: 1.05, power: 2.4, intensity: 1.1 },
  },
  earth: {
    id: 'earth', radius: 1, position: new THREE.Vector3(0, 0, 0),
    texture: '/textures/earth_color.jpg', clouds: '/textures/earth_clouds.jpg', color: '#2F6FD0', tiltDeg: 23.4, spin: 0.05,
    atmosphere: { color: '#5FA8FF', scale: 1.06, power: 2.6, intensity: 1.4 },
  },
  moon: {
    id: 'moon', radius: 0.27, position: new THREE.Vector3(),
    texture: '/textures/moon_color.jpg', bump: '/textures/moon_bump.jpg', color: '#C9CED6', tiltDeg: 0, spin: 0,
  },
  mars: {
    id: 'mars', radius: 0.53, position: new THREE.Vector3(11, 0.6, -4),
    texture: '/textures/mars_color.jpg', color: '#C1440E', tiltDeg: 25.2, spin: 0.045,
    atmosphere: { color: '#E8A27A', scale: 1.03, power: 4, intensity: 0.6 },
  },
  jupiter: {
    id: 'jupiter', radius: 3.4, position: new THREE.Vector3(25, -0.5, 4),
    texture: '/textures/jupiter_color.jpg', color: '#d8b48a', tiltDeg: 3.1, spin: 0.08,
    atmosphere: { color: '#f5dcb8', scale: 1.025, power: 3, intensity: 0.5 },
  },
  saturn: {
    id: 'saturn', radius: 2.8, position: new THREE.Vector3(42, 1, -3),
    texture: '/textures/saturn_color.jpg', color: '#e2cd9f', tiltDeg: 26.7, spin: 0.07,
    atmosphere: { color: '#f5e6c0', scale: 1.025, power: 3, intensity: 0.4 },
    rings: { inner: 1.25, outer: 2.3, texture: '/textures/saturn_ring.png' },
  },
  'deep-space': {
    id: 'deep-space', radius: 0.6, position: new THREE.Vector3(60, 3, 2),
    color: '#8A7CFF', tiltDeg: 0, spin: 0,
  },
};

export const BODY_ORDER: BodyId[] = ['mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'deep-space'];
export const TOUR_STOPS: TourStop[] = ['overview', ...BODY_ORDER];

export const MOON_ORBIT = { radius: 3.2, speed: 0.04 };

export const OVERVIEW = {
  position: new THREE.Vector3(14, 20, 52),
  target: new THREE.Vector3(16, 0, 0),
};

/** Direction du Soleil vue depuis un point de la scène. */
export function sunDirectionAt(p: THREE.Vector3): THREE.Vector3 {
  return SUN_POSITION.clone().sub(p).normalize();
}

/**
 * Angle d'orbite où la Lune montre sa face visible bien éclairée (phase gibbeuse) :
 * presque à l'opposé du Soleil, décalé pour garder un peu d'ombre rasante sur le relief.
 */
const sunFromEarth = sunDirectionAt(BODIES.earth.position);
export const MOON_SHOWCASE_ANGLE = Math.atan2(-sunFromEarth.z, -sunFromEarth.x) + 0.6;

/** Direction de vue par défaut autour d'un astre : côté éclairé, un peu en hauteur. */
export function viewDirectionFor(p: THREE.Vector3): THREE.Vector3 {
  return sunDirectionAt(p).multiplyScalar(0.55).add(new THREE.Vector3(0, 0.2, 1)).normalize();
}

export interface BodyHandle {
  /** Groupe positionné (et incliné) de l'astre. */
  group: THREE.Object3D;
  /** Surface qui tourne : les machines posées y sont rattachées. */
  surface: THREE.Object3D;
}

/** Registre des objets 3D des astres, pour que caméra et missions sachent où ils sont. */
export const bodyRegistry = new Map<BodyId, BodyHandle>();
