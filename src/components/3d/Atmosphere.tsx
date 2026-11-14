import { useMemo } from 'react';
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vNormalWorld;
  void main() {
    vNormalView = normalize(normalMatrix * normal);
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunDir;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vNormalWorld;
  void main() {
    // Effet Fresnel : plus lumineux sur le bord du disque.
    float fresnel = pow(1.0 - abs(dot(vNormalView, vViewDir)), uPower);
    // Le halo s'éteint du côté nuit.
    float day = smoothstep(-0.35, 0.5, dot(vNormalWorld, uSunDir));
    gl_FragColor = vec4(uColor, fresnel * day * uIntensity);
  }
`;

interface AtmosphereProps {
  radius: number;
  color: string;
  scale?: number;
  power?: number;
  intensity?: number;
  /** Direction du Soleil (repère monde). */
  sunDir: THREE.Vector3;
}

/** Halo atmosphérique (shader Fresnel), éclairé seulement côté jour. */
export function Atmosphere({ radius, color, sunDir, scale = 1.04, power = 3, intensity = 1.2 }: AtmosphereProps) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uSunDir: { value: sunDir.clone() },
      uPower: { value: power },
      uIntensity: { value: intensity },
    }),
    [color, power, intensity, sunDir],
  );
  return (
    <mesh scale={scale} raycast={() => null}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
