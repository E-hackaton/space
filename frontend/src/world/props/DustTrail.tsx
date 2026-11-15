import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '../Player';
import type { HeightField } from '../terrain';

interface Props {
  field: HeightField;
  color: string;
  /** Pesanteur du monde (m/s²) : 1,62 sur la Lune, 3,71 sur Mars. */
  gravity: number;
  /**
   * Freinage par l'air (1/s). Sur la Lune, il n'y a pas d'air : 0. Les grains suivent alors une
   * parabole parfaite et retombent d'un coup ; aucun nuage ne flotte. Sur Mars, l'air ténu freine
   * la poussière et la laisse gonfler en volutes qui dérivent.
   */
  drag: number;
  /** Faut-il émettre (le joueur conduit) ? */
  active: boolean;
  count?: number;
}

/** Points de départ de la poussière : derrière les roues arrière, en repère du rover (avant = −Z). */
const WHEELS: [number, number][] = [
  [-0.75, 0.9],
  [0.75, 0.9],
];

/** Volute de poussière : bords irréguliers et grumeleux (aucun disque net), générée une fois. */
let puffTex: THREE.Texture | null = null;
function puffTexture() {
  if (puffTex) return puffTex;
  const n = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const g = cv.getContext('2d')!;
  let s = 17;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  // Une douzaine de taches floues décalées : la silhouette d'un petit nuage de poussière.
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rnd() * n * 0.22;
    const x = n / 2 + Math.cos(a) * d;
    const y = n / 2 + Math.sin(a) * d;
    const r = n * (0.12 + rnd() * 0.18);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const k = 0.18 + rnd() * 0.22;
    grad.addColorStop(0, `rgba(255,255,255,${k})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, n, n);
  }
  // Grain : de petits trous et mottes dans la volute.
  const img = g.getImageData(0, 0, n, n);
  for (let i = 0; i < img.data.length; i += 4) img.data[i + 3] *= 0.6 + rnd() * 0.6;
  g.putImageData(img, 0, 0);
  puffTex = new THREE.CanvasTexture(cv);
  return puffTex;
}

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aRot;
  varying float vAlpha;
  varying float vRot;
  uniform float uScale;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale / -mv.z;
    vAlpha = aAlpha;
    vRot = aRot;
  }
`;
const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vRot;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float c = cos(vRot), s = sin(vRot);
    vec2 uv = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + 0.5;
    float a = texture2D(uMap, uv).a * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

/**
 * Poussière soulevée par les roues du rover, selon la physique du monde :
 * grains balistiques fins (toujours) et volutes qui gonflent et dérivent (seulement s'il y a de l'air).
 */
export function DustTrail({ field, color, gravity, drag, active, count = 700 }: Props) {
  const airy = drag > 0;
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3).fill(-9999), 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute('aRot', new THREE.BufferAttribute(new Float32Array(count), 1));
    const m = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: { uMap: { value: puffTexture() }, uColor: { value: new THREE.Color(color) }, uScale: { value: 600 } },
    });
    return { geometry: g, material: m };
  }, [count, color]);

  // État de chaque particule : vitesse, âge, durée de vie, taille de départ et de fin, volute ou grain.
  const vel = useMemo(() => new Float32Array(count * 3), [count]);
  const age = useMemo(() => new Float32Array(count), [count]);
  const life = useMemo(() => new Float32Array(count), [count]);
  const size0 = useMemo(() => new Float32Array(count), [count]);
  const size1 = useMemo(() => new Float32Array(count), [count]);
  const spin = useMemo(() => new Float32Array(count), [count]);
  const puff = useMemo(() => new Uint8Array(count), [count]);
  const cursor = useRef(0);
  const toEmit = useRef(0);

  useFrame(({ size }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    material.uniforms.uScale.value = size.height * 0.9;
    const pos = geometry.attributes.position.array as Float32Array;
    const sz = geometry.attributes.aSize.array as Float32Array;
    const al = geometry.attributes.aAlpha.array as Float32Array;
    const rot = geometry.attributes.aRot.array as Float32Array;

    // Émission proportionnelle à la vitesse du rover.
    const speed = Math.abs(player.speed);
    if (active && speed > 1.2) {
      toEmit.current += speed * (airy ? 7 : 12) * dt;
      const sin = Math.sin(player.heading);
      const cos = Math.cos(player.heading);
      while (toEmit.current >= 1) {
        toEmit.current -= 1;
        const i = cursor.current;
        cursor.current = (cursor.current + 1) % count;
        const [lx, lz] = WHEELS[i % 2];
        const x = player.x + lx * cos + lz * sin;
        const z = player.z - lx * sin + lz * cos;
        // Sur Mars, une particule sur deux est une volute ; sur la Lune, presque tout est grain.
        const isPuff = airy ? Math.random() < 0.55 : Math.random() < 0.08;
        puff[i] = isPuff ? 1 : 0;
        pos[i * 3] = x;
        pos[i * 3 + 1] = field.heightAt(x, z) + 0.12;
        pos[i * 3 + 2] = z;
        const back = Math.sign(player.speed) * (0.25 + Math.random() * 0.4) * speed;
        const up = isPuff ? 0.4 + Math.random() * 0.8 : 1.4 + Math.random() * (1.2 + speed * 0.2);
        vel[i * 3] = sin * back + (Math.random() - 0.5) * 1.8;
        vel[i * 3 + 1] = up;
        vel[i * 3 + 2] = cos * back + (Math.random() - 0.5) * 1.8;
        age[i] = 0;
        life[i] = isPuff ? (airy ? 2.2 + Math.random() * 1.6 : 0.6) : 6;
        size0[i] = isPuff ? 0.35 + Math.random() * 0.3 : 0.07 + Math.random() * 0.08;
        size1[i] = isPuff ? (airy ? 2.2 + Math.random() * 1.8 : 0.6) : size0[i];
        spin[i] = (Math.random() - 0.5) * 1.2;
        rot[i] = Math.random() * Math.PI * 2;
      }
    }

    const damping = Math.exp(-drag * dt);
    for (let i = 0; i < count; i++) {
      if (life[i] <= 0) continue;
      age[i] += dt;
      const t = age[i] / life[i];
      if (puff[i] && airy) {
        // Volute : freinée par l'air, elle gonfle, monte un peu et dérive avec le vent.
        vel[i * 3] = vel[i * 3] * damping + 0.25 * dt;
        vel[i * 3 + 1] = vel[i * 3 + 1] * damping - gravity * 0.05 * dt;
        vel[i * 3 + 2] *= damping;
      } else {
        // Grain (et volute lunaire) : pure balistique, sans freinage s'il n'y a pas d'air.
        vel[i * 3] *= damping;
        vel[i * 3 + 2] *= damping;
        vel[i * 3 + 1] = vel[i * 3 + 1] * damping - gravity * dt;
      }
      const x = (pos[i * 3] += vel[i * 3] * dt);
      const y = (pos[i * 3 + 1] += vel[i * 3 + 1] * dt);
      const z = (pos[i * 3 + 2] += vel[i * 3 + 2] * dt);
      const ground = field.heightAt(x, z);
      if (y < ground) {
        if (puff[i] && airy) pos[i * 3 + 1] = ground; // la volute rampe au sol
        else age[i] = life[i]; // le grain retombe et disparaît
      }
      rot[i] += spin[i] * dt;
      sz[i] = size0[i] + (size1[i] - size0[i]) * Math.sqrt(Math.min(1, t));
      // Apparition rapide puis effacement progressif.
      al[i] = puff[i] ? Math.min(1, t * 6) * (1 - t) * (airy ? 0.55 : 0.35) : (1 - t * t) * 0.9;
      if (age[i] >= life[i]) {
        life[i] = 0;
        al[i] = 0;
        pos[i * 3 + 1] = -9999;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
    geometry.attributes.aRot.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
