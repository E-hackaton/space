import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HeightField } from '../terrain';

/*
 * Végétation de l'île : de vrais brins d'herbe et des arbres à branches et à feuilles.
 * Le vent est calculé sur la carte graphique (aucune mise à jour image par image côté processeur) :
 * - les brins et les branches plient d'autant plus qu'ils sont hauts (attribut « flex ») ;
 * - chaque feuille frissonne en plus autour de sa tige.
 */

const wind = { value: 0 };
function WindClock({ animate }: { animate: boolean }) {
  useFrame((_, dt) => {
    if (animate) wind.value += dt;
  });
  return null;
}

const WIND_GLSL = /* glsl */ `
uniform float uWind;
attribute float aFlex;
vec3 windOffset(vec3 p, float flex) {
  float gust = 0.55 + 0.45 * sin(uWind * 0.35 + p.x * 0.015);
  float w = sin(uWind * 1.7 + p.x * 0.21 + p.z * 0.17) * 0.6 + sin(uWind * 2.9 + p.x * 0.5 - p.z * 0.37) * 0.25;
  return vec3(w * gust, -abs(w) * 0.25 * gust, w * gust * 0.55) * flex;
}
`;

/**
 * Ajoute le vent à un matériau (et à son matériau d'ombre) : `amp` règle l'ampleur,
 * `flutter` le frisson des feuilles (selon la position dans la feuille, uv.y).
 */
function windify<M extends THREE.Material>(material: M, amp: number, flutter = 0): M {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${WIND_GLSL}`).replace(
      '#include <project_vertex>',
      /* glsl */ `
      vec4 mvPosition = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
      #endif
      vec4 wp = modelMatrix * mvPosition;
      mvPosition.xyz += windOffset(wp.xyz, aFlex * ${amp.toFixed(3)});
      ${flutter > 0 ? `mvPosition.xyz += vec3(sin(uWind * 7.0 + wp.x * 3.1), sin(uWind * 9.0 + wp.z * 2.7) * 0.6, cos(uWind * 8.0 + wp.y * 2.3)) * uv.y * ${flutter.toFixed(3)};` : ''}
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;
      `,
    );
  };
  material.customProgramCacheKey = () => `wind-${amp}-${flutter}`;
  return material;
}

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

/* ------------------------------------------------------------------ herbe */

/** Un brin : effilé, légèrement courbé, plus sombre au pied qu'à la pointe. */
function bladeGeometry() {
  const seg = 5;
  const pos: number[] = [];
  const uv: number[] = [];
  const flex: number[] = [];
  const col: number[] = [];
  const root = new THREE.Color('#2f6b25');
  const tip = new THREE.Color('#b6e36a');
  const c = new THREE.Color();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const w = 0.045 * (1 - t * 0.92);
    const bend = t * t * 0.28;
    for (const side of [-1, 1]) {
      pos.push(side * w, t, bend);
      uv.push(side < 0 ? 0 : 1, t);
      flex.push(t * t);
      c.copy(root).lerp(tip, Math.pow(t, 0.8));
      col.push(c.r, c.g, c.b);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < seg; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aFlex', new THREE.Float32BufferAttribute(flex, 1));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Prairie : des touffes de brins d'herbe, chacun orienté, incliné et coloré différemment. */
export function Grass({ field, clumps = 4200, radius = 58, avoid = [], animate }: { field: HeightField; clumps?: number; radius?: number; avoid?: [number, number, number][]; animate: boolean }) {
  const { geometry, material, matrices, colors } = useMemo(() => {
    const rnd = rng(11);
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const tint = new THREE.Color();
    let guard = 0;
    while (matrices.length < clumps * 7 && guard++ < clumps * 40) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * radius;
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r;
      if (avoid.some(([ax, az, rr]) => Math.hypot(cx - ax, cz - az) < rr)) continue;
      const tall = 0.45 + rnd() * 0.75;
      // teinte de la touffe : vert tendre, vert profond ou herbe un peu sèche
      const k = rnd();
      tint.setHSL(0.22 + rnd() * 0.08 - (k > 0.85 ? 0.07 : 0), 0.45 + rnd() * 0.2, k > 0.85 ? 0.62 : 0.5 + rnd() * 0.12);
      for (let b = 0; b < 7; b++) {
        const x = cx + (rnd() - 0.5) * 0.5;
        const z = cz + (rnd() - 0.5) * 0.5;
        e.set((rnd() - 0.5) * 0.5, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.5);
        q.setFromEuler(e);
        const h = tall * (0.6 + rnd() * 0.6);
        m.compose(new THREE.Vector3(x, field.heightAt(x, z) - 0.03, z), q, new THREE.Vector3(1, h, 1));
        matrices.push(m.clone());
        colors.push(tint.clone().multiplyScalar(0.85 + rnd() * 0.3));
      }
    }
    const material = windify(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 }), 0.35);
    return { geometry: bladeGeometry(), material, matrices, colors };
  }, [field, clumps, radius, avoid]);
  return (
    <>
      <WindClock animate={animate} />
      <instancedMesh
        args={[geometry, material, matrices.length]}
        receiveShadow
        frustumCulled={false}
        ref={(r) => {
          if (!r) return;
          matrices.forEach((mm, i) => {
            r.setMatrixAt(i, mm);
            r.setColorAt(i, colors[i]);
          });
          r.instanceMatrix.needsUpdate = true;
          if (r.instanceColor) r.instanceColor.needsUpdate = true;
        }}
      />
    </>
  );
}

/* ----------------------------------------------------------------- arbres */

export interface TreeSpot {
  x: number;
  z: number;
  s: number;
  phase: number;
}

/** Texture d'une feuille (forme en amande, nervure centrale, dégradé), dessinée une fois. */
function leafTexture() {
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 128;
  const g = cv.getContext('2d')!;
  const grad = g.createLinearGradient(0, 128, 0, 0);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#dfe8d8');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(32, 124);
  g.bezierCurveTo(2, 96, 4, 34, 32, 4);
  g.bezierCurveTo(60, 34, 62, 96, 32, 124);
  g.fill();
  g.strokeStyle = 'rgba(70,90,50,0.55)';
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(32, 124);
  g.lineTo(32, 10);
  g.stroke();
  g.lineWidth = 1.2;
  for (let y = 30; y < 110; y += 16) {
    g.beginPath();
    g.moveTo(32, y + 8);
    g.lineTo(14, y - 4);
    g.moveTo(32, y + 8);
    g.lineTo(50, y - 4);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Ajoute une branche effilée (tube dont le rayon diminue) le long d'une courbe. */
function addLimb(pos: number[], nor: number[], col: number[], flex: number[], idx: number[], curve: THREE.Curve<THREE.Vector3>, r0: number, r1: number, f0: number, f1: number, bark: THREE.Color) {
  const steps = 6;
  const radial = 7;
  const frames = curve.computeFrenetFrames(steps, false);
  const base = pos.length / 3;
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    curve.getPointAt(t, p);
    const r = THREE.MathUtils.lerp(r0, r1, t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      n.copy(frames.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a)).normalize();
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
      nor.push(n.x, n.y, n.z);
      const shade = 0.8 + 0.2 * Math.sin(a * 3 + t * 5);
      col.push(bark.r * shade, bark.g * shade, bark.b * shade);
      flex.push(THREE.MathUtils.lerp(f0, f1, t));
    }
  }
  for (let i = 0; i < steps; i++)
    for (let j = 0; j < radial; j++) {
      const a = base + i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
}

/** Forêt : troncs et branches fusionnés en un seul maillage, feuilles instanciées. */
export function Trees({ field, trees, animate }: { field: HeightField; trees: TreeSpot[]; animate: boolean }) {
  const { wood, woodMat, leafGeo, leafMat, leafDepth, leaves, leafColors, leafFlex } = useMemo(() => {
    const pos: number[] = [];
    const nor: number[] = [];
    const col: number[] = [];
    const flex: number[] = [];
    const idx: number[] = [];
    const leaves: THREE.Matrix4[] = [];
    const leafColors: THREE.Color[] = [];
    const leafFlex: number[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const up = new THREE.Vector3(0, 1, 0);

    trees.forEach((tree, ti) => {
      const rnd = rng(100 + ti * 7);
      const ground = field.heightAt(tree.x, tree.z);
      const height = (3.4 + rnd() * 1.4) * tree.s;
      const bark = new THREE.Color().setHSL(0.07 + rnd() * 0.02, 0.35, 0.22 + rnd() * 0.06);
      const hue = 0.25 + rnd() * 0.08;
      const tips: { p: THREE.Vector3; size: number }[] = [];

      // branche récursive : chaque niveau se divise en 2 à 4 rameaux
      const grow = (from: THREE.Vector3, dir: THREE.Vector3, len: number, r: number, level: number, f0: number) => {
        const lean = dir.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.35, 0.12, (rnd() - 0.5) * 0.35)).normalize();
        const mid = from.clone().addScaledVector(dir, len * 0.5).add(new THREE.Vector3((rnd() - 0.5) * 0.2 * len, 0, (rnd() - 0.5) * 0.2 * len));
        const end = from.clone().addScaledVector(lean, len);
        const f1 = Math.min(1, (end.y - ground) / (height * 1.3));
        addLimb(pos, nor, col, flex, idx, new THREE.QuadraticBezierCurve3(from, mid, end), r, r * 0.62, f0, f1, bark);
        if (level === 0) {
          tips.push({ p: end, size: len });
          return;
        }
        const kids = level === 3 ? 4 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 2);
        for (let k = 0; k < kids; k++) {
          const yaw = (k / kids) * Math.PI * 2 + rnd() * 0.8;
          const pitch = level === 3 ? 0.55 + rnd() * 0.35 : 0.35 + rnd() * 0.5;
          const d = new THREE.Vector3(Math.cos(yaw) * Math.sin(pitch), Math.cos(pitch), Math.sin(yaw) * Math.sin(pitch)).lerp(dir, 0.35).normalize();
          const start = level === 3 ? from.clone().lerp(end, 0.55 + rnd() * 0.45) : end.clone();
          grow(start, d, len * (0.62 + rnd() * 0.12), r * 0.6, level - 1, f1 * 0.9);
        }
      };
      grow(new THREE.Vector3(tree.x, ground - 0.2, tree.z), up.clone(), height * 0.55, 0.2 * tree.s + 0.08, 3, 0);

      // feuilles groupées au bout des rameaux
      for (const tip of tips) {
        const n = 54;
        for (let l = 0; l < n; l++) {
          const rr = (0.5 + tip.size * 0.8) * Math.cbrt(rnd());
          const a = rnd() * Math.PI * 2;
          const b = Math.acos(2 * rnd() - 1);
          const p = tip.p.clone().add(new THREE.Vector3(Math.sin(b) * Math.cos(a) * rr, Math.cos(b) * rr * 0.7, Math.sin(b) * Math.sin(a) * rr));
          e.set(rnd() * Math.PI, rnd() * Math.PI * 2, rnd() * Math.PI);
          q.setFromEuler(e);
          const sc = (0.34 + rnd() * 0.18) * Math.sqrt(tree.s);
          m.compose(p, q, new THREE.Vector3(sc, sc, sc));
          leaves.push(m.clone());
          // les feuilles du haut, au soleil, sont plus claires
          const sun = THREE.MathUtils.clamp((p.y - ground) / (height * 1.3), 0, 1);
          leafColors.push(new THREE.Color().setHSL(hue + (rnd() - 0.5) * 0.04, 0.5 + rnd() * 0.15, 0.24 + sun * 0.16 + rnd() * 0.06));
          leafFlex.push(Math.min(1, (p.y - ground) / (height * 1.3)));
        }
      }
    });

    const wood = new THREE.BufferGeometry();
    wood.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    wood.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    wood.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    wood.setAttribute('aFlex', new THREE.Float32BufferAttribute(flex, 1));
    wood.setIndex(idx);
    wood.computeBoundingSphere();
    const woodMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), 0.22);

    // feuille : un plan dont la base est sur la tige (uv.y = 0 à la tige, 1 à la pointe)
    const leafGeo = new THREE.PlaneGeometry(1, 1.6);
    leafGeo.translate(0, 0.8, 0);
    const tex = leafTexture();
    const leafMat = windify(new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 }), 0.22, 0.05);
    const leafDepth = windify(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }), 0.22, 0.05);
    leafGeo.setAttribute('aFlex', new THREE.InstancedBufferAttribute(new Float32Array(leafFlex), 1));
    return { wood, woodMat, leafGeo, leafMat, leafDepth, leaves, leafColors, leafFlex };
  }, [field, trees]);

  return (
    <>
      <WindClock animate={animate} />
      <mesh geometry={wood} material={woodMat} castShadow receiveShadow />
      <instancedMesh
        args={[leafGeo, leafMat, leaves.length]}
        customDepthMaterial={leafDepth}
        castShadow
        receiveShadow
        frustumCulled={false}
        userData={{ count: leafFlex.length }}
        ref={(r) => {
          if (!r) return;
          leaves.forEach((mm, i) => {
            r.setMatrixAt(i, mm);
            r.setColorAt(i, leafColors[i]);
          });
          r.instanceMatrix.needsUpdate = true;
          if (r.instanceColor) r.instanceColor.needsUpdate = true;
        }}
      />
    </>
  );
}
