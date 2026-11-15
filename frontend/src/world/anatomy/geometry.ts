import * as THREE from 'three';

/*
 * Maillages construits à partir des figures FORBITS Anatomy (docs/lm-anatomy), exportées par
 * docs/lm-anatomy/scripts/export-three.mjs. Chaque pièce y est décrite en vraies cotes :
 *  - prisme  : un contour plan extrudé le long d'un axe ;
 *  - corps   : un profil (s, r) tourné autour d'un axe (cylindres, cônes, dômes, tuyères) ;
 *  - sphère.
 * Repère des figures : x avant, y gauche, z haut. Repère Three.js : y haut → (x, y, z) ↦ (x, z, −y).
 */

type V3 = [number, number, number];
interface Frame {
  o: V3;
  a: V3;
  u: V3;
  v: V3;
}
export type Shape =
  | ({ k: 'p'; poly: [number, number][]; s0: number; s1: number } & Frame)
  | ({ k: 'b'; poly: [number, number][] } & Frame)
  | { k: 's'; o: V3; r: number }
  | { k: 'x'; o: V3; axes: [V3, V3, V3]; half: V3 };

export interface AnatomyPart {
  n: string;
  g: number;
  m: string | null;
  t: string;
  s: Shape[];
}
export interface AnatomyGroup {
  name: string;
  parent: number;
  kind: 'turn' | 'hinge' | 'slide' | 'free';
  origin: V3;
  axis?: V3;
}
export interface AnatomyData {
  id: string;
  unitsPerMetre: number;
  pieces: { id: string; fr: string; en: string; sayFr?: string; sayEn?: string }[];
  groups: AnatomyGroup[];
  parts: AnatomyPart[];
}

/** Repère des figures → repère Three.js. */
export const toThree = (p: readonly number[], out = new THREE.Vector3()) => out.set(p[0], p[2], -p[1]);

/** Accumulateur de triangles (positions + normales), orientés d'après les normales voulues. */
export class Mesher {
  pos: number[] = [];
  nor: number[] = [];
  idx: number[] = [];
  private a = new THREE.Vector3();
  private b = new THREE.Vector3();
  private c = new THREE.Vector3();

  vertex(p: THREE.Vector3, n: THREE.Vector3) {
    this.pos.push(p.x, p.y, p.z);
    this.nor.push(n.x, n.y, n.z);
    return this.pos.length / 3 - 1;
  }

  /** Triangle dont la face regarde du même côté que les normales de ses sommets. */
  tri(i: number, j: number, k: number) {
    const P = this.pos;
    this.a.set(P[j * 3] - P[i * 3], P[j * 3 + 1] - P[i * 3 + 1], P[j * 3 + 2] - P[i * 3 + 2]);
    this.b.set(P[k * 3] - P[i * 3], P[k * 3 + 1] - P[i * 3 + 1], P[k * 3 + 2] - P[i * 3 + 2]);
    this.c.crossVectors(this.a, this.b);
    if (this.c.lengthSq() < 1e-14) return;
    const N = this.nor;
    const d = this.c.x * (N[i * 3] + N[j * 3] + N[k * 3]) + this.c.y * (N[i * 3 + 1] + N[j * 3 + 1] + N[k * 3 + 1]) + this.c.z * (N[i * 3 + 2] + N[j * 3 + 2] + N[k * 3 + 2]);
    if (d >= 0) this.idx.push(i, j, k);
    else this.idx.push(i, k, j);
  }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setIndex(this.idx);
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}

const SHARP = Math.cos((38 * Math.PI) / 180);

/** Point d'un repère (s le long de l'axe, x et y dans le plan), converti en Three.js. */
function framePoint(F: Frame, s: number, x: number, y: number, origin: THREE.Vector3, out: THREE.Vector3) {
  return toThree(
    [F.o[0] + F.a[0] * s + F.u[0] * x + F.v[0] * y, F.o[1] + F.a[1] * s + F.u[1] * x + F.v[1] * y, F.o[2] + F.a[2] * s + F.u[2] * x + F.v[2] * y],
    out,
  ).sub(origin);
}
function frameDir(F: Frame, s: number, x: number, y: number, out: THREE.Vector3) {
  return toThree([F.a[0] * s + F.u[0] * x + F.v[0] * y, F.a[1] * s + F.u[1] * x + F.v[1] * y, F.a[2] * s + F.u[2] * x + F.v[2] * y], out).normalize();
}

/** Prisme : flancs lisses dans les coins arrondis, arêtes nettes ailleurs, deux faces planes. */
function prism(m: Mesher, sh: Extract<Shape, { k: 'p' }>, origin: THREE.Vector3) {
  const ring = sh.poly;
  const n = ring.length;
  const p = new THREE.Vector3();
  const nn = new THREE.Vector3();
  let area = 0;
  for (let i = 0; i < n; i++) area += ring[i][0] * ring[(i + 1) % n][1] - ring[(i + 1) % n][0] * ring[i][1];
  const sign = area >= 0 ? 1 : -1;
  // normale sortante (dans le plan u, v) de chaque arête
  const edgeN = ring.map((a, i) => {
    const b = ring[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [(sign * dy) / l, (-sign * dx) / l];
  });
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [nx, ny] = edgeN[i];
    // normale de sommet : moyenne avec l'arête voisine si l'angle est doux
    const vn = (other: number) => {
      const [ox, oy] = edgeN[other];
      return nx * ox + ny * oy > SHARP ? [nx + ox, ny + oy] : [nx, ny];
    };
    const ni = vn((i - 1 + n) % n);
    const nj = vn(j);
    const quad: number[] = [];
    for (const [k, nk] of [[i, ni], [j, nj]] as const) {
      for (const s of [sh.s0, sh.s1]) {
        framePoint(sh, s, ring[k][0], ring[k][1], origin, p);
        frameDir(sh, 0, nk[0], nk[1], nn);
        quad.push(m.vertex(p, nn));
      }
    }
    m.tri(quad[0], quad[2], quad[3]);
    m.tri(quad[0], quad[3], quad[1]);
  }
  // faces avant et arrière
  const contour = ring.map(([x, y]) => new THREE.Vector2(x, y));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  for (const [s, dir] of [[sh.s0, -1], [sh.s1, 1]] as const) {
    frameDir(sh, dir, 0, 0, nn);
    const base = ring.map(([x, y]) => m.vertex(framePoint(sh, s, x, y, origin, p), nn));
    for (const [a, b, c] of tris) m.tri(base[a], base[b], base[c]);
  }
}

/** Corps de révolution : le profil est coupé aux angles vifs, lissé ailleurs. */
function body(m: Mesher, sh: Extract<Shape, { k: 'b' }>, origin: THREE.Vector3) {
  const poly = sh.poly;
  if (poly.length < 2) return;
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const flip = area > 0 ? -1 : 1;
  const segN = [] as [number, number][];
  for (let i = 0; i < poly.length - 1; i++) {
    const ds = poly[i + 1][0] - poly[i][0];
    const dr = poly[i + 1][1] - poly[i][1];
    const l = Math.hypot(ds, dr) || 1;
    segN.push([(flip * -dr) / l, (flip * ds) / l]);
  }
  const rMax = Math.max(...poly.map((q) => q[1]));
  const radial = rMax > 12 ? 40 : rMax > 4 ? 28 : 16;
  const p = new THREE.Vector3();
  const nn = new THREE.Vector3();
  const cos = Array.from({ length: radial + 1 }, (_, j) => Math.cos((j / radial) * Math.PI * 2));
  const sin = Array.from({ length: radial + 1 }, (_, j) => Math.sin((j / radial) * Math.PI * 2));
  for (let i = 0; i < segN.length; i++) {
    const [s0, r0] = poly[i];
    const [s1, r1] = poly[i + 1];
    if (r0 < 1e-6 && r1 < 1e-6) continue;
    const blend = (k: number, other: number): [number, number] => {
      const a = segN[k];
      const b = segN[other];
      if (other < 0 || other >= segN.length || a[0] * b[0] + a[1] * b[1] < SHARP) return a;
      return [a[0] + b[0], a[1] + b[1]];
    };
    const nA = blend(i, i - 1);
    const nB = blend(i, i + 1);
    const rowA: number[] = [];
    const rowB: number[] = [];
    for (let j = 0; j <= radial; j++) {
      for (const [s, r, nv, row] of [[s0, r0, nA, rowA], [s1, r1, nB, rowB]] as const) {
        framePoint(sh, s, r * cos[j], r * sin[j], origin, p);
        frameDir(sh, nv[0], nv[1] * cos[j], nv[1] * sin[j], nn);
        row.push(m.vertex(p, nn));
      }
    }
    for (let j = 0; j < radial; j++) {
      m.tri(rowA[j], rowB[j], rowB[j + 1]);
      m.tri(rowA[j], rowB[j + 1], rowA[j + 1]);
    }
  }
}

function ball(m: Mesher, sh: Extract<Shape, { k: 's' }>, origin: THREE.Vector3) {
  const g = new THREE.SphereGeometry(sh.r, 20, 14);
  const c = toThree(sh.o).sub(origin);
  const P = g.attributes.position;
  const N = g.attributes.normal;
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const base = m.pos.length / 3;
  for (let i = 0; i < P.count; i++) m.vertex(p.fromBufferAttribute(P, i).add(c), n.fromBufferAttribute(N, i));
  const I = g.index!;
  for (let i = 0; i < I.count; i += 3) m.tri(base + I.getX(i), base + I.getX(i + 1), base + I.getX(i + 2));
  g.dispose();
}

function box(m: Mesher, sh: Extract<Shape, { k: 'x' }>, origin: THREE.Vector3) {
  const c = toThree(sh.o).sub(origin);
  const ax = sh.axes.map((a) => toThree(a));
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let f = 0; f < 3; f++) {
    for (const sgn of [-1, 1]) {
      n.copy(ax[f]).multiplyScalar(sgn);
      const o1 = (f + 1) % 3;
      const o2 = (f + 2) % 3;
      const corner = (a: number, b: number) =>
        m.vertex(
          p.copy(c).addScaledVector(ax[f], sgn * sh.half[f]).addScaledVector(ax[o1], a * sh.half[o1]).addScaledVector(ax[o2], b * sh.half[o2]),
          n,
        );
      const q = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
      m.tri(q[0], q[1], q[2]);
      m.tri(q[0], q[2], q[3]);
    }
  }
}

export function addShape(m: Mesher, sh: Shape, origin: THREE.Vector3) {
  if (sh.k === 'p') prism(m, sh, origin);
  else if (sh.k === 'b') body(m, sh, origin);
  else if (sh.k === 's') ball(m, sh, origin);
  else box(m, sh, origin);
}

/** Boîte englobante (repère Three.js) d'une forme, approchée par ses points de contrôle. */
export function expandBox(box: THREE.Box3, sh: Shape) {
  const p = new THREE.Vector3();
  if (sh.k === 's') {
    toThree(sh.o, p);
    box.expandByPoint(p.clone().addScalar(sh.r));
    box.expandByPoint(p.addScalar(-sh.r));
    return;
  }
  if (sh.k === 'x') {
    box.expandByPoint(toThree(sh.o, p).clone().addScalar(Math.max(...sh.half)));
    box.expandByPoint(toThree(sh.o, p).addScalar(-Math.max(...sh.half)));
    return;
  }
  const zero = new THREE.Vector3();
  if (sh.k === 'p') {
    for (const s of [sh.s0, sh.s1]) for (const [x, y] of sh.poly) box.expandByPoint(framePoint(sh, s, x, y, zero, p));
    return;
  }
  for (const [s, r] of sh.poly) for (let j = 0; j < 8; j++) box.expandByPoint(framePoint(sh, s, r * Math.cos((j * Math.PI) / 4), r * Math.sin((j * Math.PI) / 4), zero, p));
}
