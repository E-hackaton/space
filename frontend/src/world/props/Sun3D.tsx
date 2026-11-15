import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/*
 * Le Soleil en 3D : une sphère dont la surface bouillonne (granulation animée), entourée d'une
 * couronne lumineuse et de rayons qui tournent lentement (calculés dans un shader, sans texture). Tout est calculé sur la carte graphique.
 */

const surfaceVS = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const surfaceFS = /* glsl */ `
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float n = mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                  mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    return n;
  }
  float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
  void main() {
    vec3 p = normalize(vPos) * 3.0;
    float g = fbm(p + vec3(uTime * 0.05, uTime * 0.03, -uTime * 0.04));
    float cells = fbm(p * 3.0 - vec3(0.0, uTime * 0.1, 0.0));
    float heat = g * 0.7 + cells * 0.5;
    vec3 hot = vec3(1.0, 0.98, 0.86);
    vec3 warm = vec3(1.0, 0.72, 0.22);
    vec3 cool = vec3(0.95, 0.38, 0.06);
    vec3 col = mix(cool, warm, smoothstep(0.35, 0.7, heat));
    col = mix(col, hot, smoothstep(0.62, 0.95, heat));
    // Assombrissement centre-bord (comme sur le vrai Soleil), puis très lumineux pour le bloom.
    float mu = clamp(dot(vNormal, vView), 0.0, 1.0);
    col *= 0.55 + 0.45 * pow(mu, 0.5);
    gl_FragColor = vec4(col * 2.4, 1.0);
  }
`;

const raysVS = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Toujours face à la caméra.
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy;
    gl_Position = projectionMatrix * mv;
  }
`;
const raysFS = /* glsl */ `
  uniform float uTime;
  uniform float uCore;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float a = atan(p.y, p.x);
    // Rayons : plusieurs fréquences qui tournent à des vitesses différentes, et scintillent.
    float rays = pow(abs(sin(a * 9.0 + uTime * 0.15)), 18.0) * 0.8
               + pow(abs(sin(a * 14.0 - uTime * 0.1 + 1.3)), 26.0) * 0.6
               + pow(abs(sin(a * 23.0 + uTime * 0.22)), 40.0) * 0.4;
    rays *= 0.8 + 0.2 * sin(uTime * 2.0 + a * 5.0);
    float fall = 1.0 - smoothstep(uCore, 1.0, r);
    float glow = exp(-(r - uCore) * 5.0) * step(uCore * 0.9, r);
    // Couronne : halo doux autour du disque, calculé ici (pas de texture, donc aucun bord visible).
    float corona = exp(-max(r - uCore, 0.0) * 4.0) * 0.55 + exp(-max(r - uCore, 0.0) * 12.0) * 0.6;
    float alpha = (rays * fall * 0.9 + glow * 0.9 + corona) * (1.0 - smoothstep(0.85, 1.0, r));
    gl_FragColor = vec4(vec3(1.0, 0.82, 0.45) * alpha * 1.6, alpha);
  }
`;

export function Sun3D({ radius = 18 }: { radius?: number }) {
  const surf = useRef<THREE.ShaderMaterial>(null!);
  const rays = useRef<THREE.ShaderMaterial>(null!);
  useFrame(({ clock }) => {
    surf.current.uniforms.uTime.value = clock.elapsedTime;
    rays.current.uniforms.uTime.value = clock.elapsedTime;
  });
  const size = radius * 7;
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 64, 48]} />
        <shaderMaterial ref={surf} vertexShader={surfaceVS} fragmentShader={surfaceFS} uniforms={{ uTime: { value: 0 } }} toneMapped={false} fog={false} />
      </mesh>
      {/* Rayons */}
      <mesh renderOrder={2}>
        <planeGeometry args={[size, size]} />
        <shaderMaterial
          ref={rays}
          vertexShader={raysVS}
          fragmentShader={raysFS}
          uniforms={{ uTime: { value: 0 }, uCore: { value: (radius * 2) / size } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}
