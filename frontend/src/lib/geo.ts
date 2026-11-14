import * as THREE from 'three';

/**
 * Convertit latitude / longitude (degrés, est positif) en position 3D
 * sur une sphère three.js texturée en équirectangulaire (SphereGeometry standard).
 * Longitude 0 sur l'axe +X local, nord sur +Y.
 */
export function latLonToVector3(lat: number, lon: number, radius = 1): THREE.Vector3 {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) / 180) * Math.PI;
  return new THREE.Vector3(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}
