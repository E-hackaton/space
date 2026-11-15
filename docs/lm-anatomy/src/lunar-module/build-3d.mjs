// Apollo LM "Eagle" on a turntable: the 360° version of the figure (anatomy 3D mode).
// World units: 40 per metre. x, y on the regolith, z up. The LM faces +y.
// Everything on the regolith disc is one turn group; the ascent stage slides up off it; the flag hinges over.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import { turning } from "../../kit/turn-build.mjs";
import * as TA from "../../kit/turn-audit.mjs";
import { glCamera } from "../../kit/gl.mjs";
import { kitScript, turnScript, glScript } from "../../scripts/inline-kit.mjs";
import { MODEL, PARTS, TEXT } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const THEME = argv.includes("--light") ? "light" : "dark";
const DEG = Math.PI / 180;

const W = 1000;
const H = 760;
const AZIMUTH = 55;
const ELEVATION = 30;

const DISC_R = 234; // the turning regolith disc
const DISC_Z0 = -4;
const PLINTH_R = 252;
const PLINTH_Z0 = -18;
const FOOT_H = 10;
const DECK_Z = 126;
const BODY_Z = 58;
const BAND_Z = 117;
const APOTHEM = 84.5;
const CIRCUM = APOTHEM / Math.cos(22.5 * DEG);
const PAD_R = 188;
const LEGS = [0, 90, 180, 270];
const FRONT = 90;
const TRAVEL = 2600;

const fitPts = [];
for (let i = 0; i < 64; i++) {
  const a = (i / 64) * Math.PI * 2;
  fitPts.push([PLINTH_R * Math.cos(a), PLINTH_R * Math.sin(a), PLINTH_Z0 - FOOT_H], [PLINTH_R * Math.cos(a), PLINTH_R * Math.sin(a), 0]);
  fitPts.push([96 * Math.cos(a), 96 * Math.sin(a), 268]);
}
export const P = k.fitProjection(fitPts, W, H, { pad: 30, azimuth: AZIMUTH, elevation: ELEVATION });
const V = G.viewOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const add = G.add3, sub = G.sub3, mul = G.mul3, unit = G.unit3, dot = G.dot3, cross = G.cross3, len = G.len3;
const dir = (deg) => [Math.cos(deg * DEG), Math.sin(deg * DEG), 0];
const UP = (x, y, z = 0) => ({ o: [x, y, z], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] });
const frameOf = (o, a, u) => {
  const axis = unit(a);
  const uu = u ? unit(sub(u, mul(axis, dot(u, axis)))) : G.frameAlong(o, axis).u;
  return { o, a: axis, u: uu, v: cross(axis, uu) };
};
const fmt = (v) => (Math.round(v * 1000) / 1000).toString();
const path2 = (pts, closed = false) => pts.map(([x, y], i) => `${i ? "L" : "M"}${fmt(x)} ${fmt(y)}`).join("") + (closed ? "Z" : "");
const line2 = (pts, tone = "lo", extra = "") => `<path class="iso-line" data-tone="${tone}"${extra} d="${path2(pts)}"/>`;
const loop2 = (pts, tone = "lo") => `<path class="iso-line" data-tone="${tone}" d="${path2(pts, true)}"/>`;
const fill2 = (pts, cls) => `<path class="${cls}" d="${path2(pts, true)}"/>`;
const circle2 = (cx, cy, r, steps = 48) => Array.from({ length: steps }, (_, j) => [cx + r * Math.cos((j / steps) * Math.PI * 2), cy + r * Math.sin((j / steps) * Math.PI * 2)]);
const octagon = (apothem, cx = 0, cy = 0) => Array.from({ length: 8 }, (_, i) => {
  const a = (22.5 + 45 * i) * DEG;
  const r = apothem / Math.cos(22.5 * DEG);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});
const hull2 = (pts) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const crossz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) { while (lower.length >= 2 && crossz(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  const upper = [];
  for (const q of [...p].reverse()) { while (upper.length >= 2 && crossz(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

// ---------- scene ----------
export const R = A.recorder(P);
export const T = turning(P, { recorder: R });
const lm = T.group("lm", { turn: { pivot: [0, 0] } });
const asc = T.group("asc", { parent: lm, slide: { direction: [0, 0, 1], travel: TRAVEL } });
const FLAG_FOOT = [-120, 40];
const FLAG_AXIS_Z = 1.6;
const flagG = T.group("flag", { parent: lm, hinge: { point: [FLAG_FOOT[0], FLAG_FOOT[1], FLAG_AXIS_Z], axis: [1, 0, 0], range: [-87, 0] } });
const LIVE = T.layer("lm");
T.stack(["back", "lm", "front"]);
export const follow = (values) => ({ ...values });

const on = (group) => ({ group, layer: LIVE });
const D = on(lm);
const Asc = on(asc);
const round = (name, F, s0, s1, r, extra = {}, g = D) => T.round({ name, ...g, F, s0, s1, r, tone: "mid", ...extra });
const ball = (name, c, r, extra = {}, g = D) => T.ball({ name, ...g, c, r, tone: "mid", ...extra });
const box = (name, plan, z, h, extra = {}, g = D) => T.prism({ name, ...g, plan, z, h, steps: extra.steps ?? 2, tone: "hi", ...extra });
const prism = (name, F, polygon, s0, s1, extra = {}, g = D) => T.prism({ name, ...g, F, polygon, s0, s1, tone: "hi", ...extra });
const upPrism = (name, ring, z0, z1, extra = {}, g = D) => prism(name, UP(0, 0), ring, z0, z1, extra, g);
// a rod whose end faces are tangent to the spheres (or faces) it meets
function rod(name, a, b, r, { ra = 0, rb = 0, extra = {}, g = D } = {}) {
  const axis = unit(sub(b, a));
  const L = len(sub(b, a));
  return round(name, frameOf(a, axis, Math.abs(axis[2]) > 0.95 ? [1, 0, 0] : [0, 0, 1]), ra, L - rb, r, extra, g);
}

// =====================================================================
// STATIC: the plinth and its fixed ruler bezel, read against the index on the turning disc
// =====================================================================
const back = [];
const putStatic = (name, svg, shapes, layer = "back", bias = 0, ref = [0, 0, PLINTH_Z0]) => R.put({ name, layer, at: ref, bias, svg, shapes: shapes.map((s) => R.solid(Object.assign(s, { name: s.name ?? name }))) });
back.push(`<path class="iso-halo" d="${k.haloOf({ x: -PLINTH_R, y: -PLINTH_R, w: PLINTH_R * 2, d: PLINTH_R * 2, r: PLINTH_R }, PLINTH_Z0 - FOOT_H, -PLINTH_Z0, P)}"/>`);
const FEET = Array.from({ length: 8 }, (_, i) => [Math.cos((22.5 + 45 * i) * DEG) * (PLINTH_R - 34), Math.sin((22.5 + 45 * i) * DEG) * (PLINTH_R - 34)]).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
FEET.forEach(([x, y], i) => {
  const svg = S(k.cylinder(x, y, 13, PLINTH_Z0 - FOOT_H, 2.4, P, 32), { tone: "lo" }) + S(k.cylinder(x, y, 9.5, PLINTH_Z0 - FOOT_H + 2.4, FOOT_H - 2.4, P, 32), { tone: "mid" });
  putStatic(`stand.foot${i}`, svg, [A.cylinder(x, y, 13, PLINTH_Z0 - FOOT_H, FOOT_H, { ground: true })], "back", -1000 + i * 0.01, [x, y, PLINTH_Z0 - FOOT_H]);
});
{
  const F0 = UP(0, 0);
  const count = Math.round((2 * Math.PI * (PLINTH_R - 2.4)) / (MODEL.unitsPerMetre / 4));
  const ticks = k.radialTicks(0, 0, PLINTH_R - 2.4, count, 4, DISC_Z0, [4.2, PLINTH_R - 2.4 - (DISC_R + 3)], P);
  const svg =
    S(G.disc(PLINTH_Z0, PLINTH_Z0 + 6, PLINTH_R, F0, P), { tone: "mid" }) +
    S(G.disc(PLINTH_Z0 + 6, DISC_Z0, PLINTH_R - 1.2, F0, P, { bevel: 1.2 }), { tone: "lo", inner: Ln(G.arcOf(F0, PLINTH_Z0 + 9, PLINTH_R - 1.2, P), { tone: "faint" }) }) +
    `<path class="lm-bezel" fill-rule="evenodd" d="${G.circleOf(F0, DISC_Z0, PLINTH_R - 2.4, P, 180)} ${G.circleOf(F0, DISC_Z0, DISC_R + 3, P, 180)}"/>` +
    Ln(G.circleOf(F0, DISC_Z0, PLINTH_R - 2.4, P, 180) + G.circleOf(F0, DISC_Z0, DISC_R + 3, P, 180), { tone: "lo" }) +
    Ln(ticks.minor, { tone: "lo" }) +
    Ln(ticks.major, { tone: "mid" });
  putStatic("stand.plinth", svg, [A.disc(F0, PLINTH_Z0, DISC_Z0, PLINTH_R, { ground: true })], "back", 0, [0, 0, PLINTH_Z0]);
}

// =====================================================================
// THE TURNING DISC OF REGOLITH: craters, rocks, label, the index
// =====================================================================
const disc = round("ground.disc", UP(0, 0), DISC_Z0, 0, DISC_R, { tone: "lo", crease: "faint" });
{
  const CRATERS = [[-125, -128, 28], [62, -180, 18], [-196, 52, 15], [200, -48, 20], [-40, 222, 10], [214, 64, 8], [-170, -52, 9], [120, 40, 7]];
  let svg = "";
  for (const [cx, cy, r] of CRATERS) {
    if (Math.hypot(cx, cy) + r * 1.22 > DISC_R - 4) continue;
    svg += fill2(circle2(cx, cy + r * 0.12, r * 0.86, 40), "lm-crater") + loop2(circle2(cx, cy, r, 56), "lo") + loop2(circle2(cx, cy, r * 1.22, 56), "faint");
  }
  // the label plate and the index sit on the disc too: label below, index as a part
  T.plane({ part: disc, o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], svg, fade: [0.02, 0.1] });
}
const ROCKS = [[-100, 160, 6, 3.5, 0.3], [96, -128, 8, 4.5, 1.2], [-212, -8, 5, 3, 2.1], [-26, -214, 7, 4, 0.7], [178, 128, 4.5, 3, 1.7], [128, -34, 4, 2.4, 0.4], [60, 120, 4, 2.6, 2.6]];
ROCKS.forEach(([cx, cy, r, h, rot], i) => {
  const ring = hull2(Array.from({ length: 6 }, (_, j) => {
    const a = rot + (j / 6) * Math.PI * 2;
    const rr = r * (0.8 + 0.2 * Math.cos(j * 2.3 + rot));
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  }));
  upPrism(`ground.rock${i}`, ring, 0, h, { tone: "mid", bevel: 0.4 });
});
{
  const c = mul(dir(30), DISC_R - 38);
  const plan = { x: c[0] - 30, y: c[1] - 7, w: 60, d: 14, r: 1.5 };
  const label = box("ground.label", plan, 0, 1.4, { tone: "mid", steps: 3, bevel: 0.4 });
  T.plane({ part: label, o: [0, 0, 1.4], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1], svg: loop2(k.roundedPlan(k.insetPlan(plan, 1.8), 3).map(([x, y]) => [x, -y]), "faint") + `<text class="iso-face-text" data-tone="lo" font-size="3.6" x="${fmt(plan.x + 4.5)}" y="${fmt(-(plan.y + plan.d / 2) + 1.3)}">APOLLO 11 · 20.VII.1969</text>` });
}
// index: a little brass pointer on the disc's rim, read against the ruler
{
  const a = 0; // points along +x at rest
  const ring = [[DISC_R + 0.02, -2.2], [DISC_R + 6, -0.6], [DISC_R + 6, 0.6], [DISC_R + 0.02, 2.2]].map(([r, t]) => [Math.cos(a) * r - Math.sin(a) * t, Math.sin(a) * r + Math.cos(a) * t]);
  upPrism("ground.index", ring, DISC_Z0 + 0.0, DISC_Z0 + 2, { tone: "hi", material: "brass", bevel: 0.3 });
}

// =====================================================================
// DESCENT STAGE
// =====================================================================
const OCT = octagon(APOTHEM);
upPrism("descent.heatshield", octagon(APOTHEM - 10), BODY_Z - 4, BODY_Z, { tone: "lo" });
const body = upPrism("descent.body", OCT, BODY_Z, BAND_Z, { tone: "hi", material: "gold" });
upPrism("descent.band", OCT, BAND_Z, DECK_Z, { tone: "mid", material: "gunmetal" });
// panel joints and access bays, one plane per face so each fades as its face turns away
for (let i = 0; i < 8; i++) {
  const a0 = (45 * i - 22.5) * DEG;
  const a1 = (45 * i + 22.5) * DEG;
  const p0 = [CIRCUM * Math.cos(a0), CIRCUM * Math.sin(a0)];
  const p1 = [CIRCUM * Math.cos(a1), CIRCUM * Math.sin(a1)];
  const u = unit([p1[0] - p0[0], p1[1] - p0[1], 0]);
  const w = len([p1[0] - p0[0], p1[1] - p0[1], 0]);
  const o = [p0[0], p0[1], BAND_Z];
  const H0 = BAND_Z - BODY_Z;
  let svg = "";
  for (const t of [0.34, 0.66]) svg += line2([[w * t, 0], [w * t, H0]], "faint");
  if (i % 2 === 1) {
    svg += loop2([[w * 0.14, 6], [w * 0.86, 6], [w * 0.86, H0 - 8], [w * 0.14, H0 - 8]], "lo");
    svg += [[0.18, 9], [0.82, 9], [0.18, H0 - 11], [0.82, H0 - 11]].map(([t, y]) => `<circle class="lm-screw" cx="${fmt(w * t)}" cy="${fmt(y)}" r="0.45"/>`).join("");
  }
  T.plane({ part: body, o, u, v: [0, 0, -1], normal: dir(45 * i), svg: `<g class="lm-foil-lines">${svg}</g>` });
}
// top deck: the blast cavity, fittings and umbilicals left behind at staging
{
  const deck = T.parts.find((p) => p.name === "descent.band");
  T.plane({ part: deck, o: [0, -14, DECK_Z], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1], svg: fill2(circle2(0, 0, 21, 64), "lm-void") + loop2(circle2(0, 0, 21, 64), "lo") + loop2(circle2(0, 0, 27, 64), "lo") });
}
for (const [i, [x, y]] of [[-60.4, 20], [60.4, 20], [-60.4, -40], [60.4, -40]].entries()) box(`descent.fitting${i}`, { x: x - 4, y: y - 4, w: 8, d: 8, r: 0.6 }, DECK_Z, 6, { tone: "mid", details: { dots: [{ at: [DECK_Z + 6, x, y], normal: [0, 0, 1], size: 0.5, tone: "hi" }] } });
for (const [i, x] of [-62, 62].entries()) box(`descent.umbilical${i}`, { x: x - 5, y: -17, w: 10, d: 6, r: 0.6 }, DECK_Z, 4, { tone: "mid" });
if (argv.includes("--deflectors")) for (const [i, sx] of [-1, 1].entries()) prism(`descent.deflector${i}`, { o: [sx * 62, 44, DECK_Z], a: [0, 1, 0], u: [sx, 0, 0], v: [0, 0, 1] }, sx > 0 ? [[0, 0], [12, 0], [12, 2], [0, 14]] : [[0, 0], [0, 14], [12, 2], [12, 0]], -6, 6, { tone: "mid" });
// outriggers carrying each primary strut
const PIN = {};
for (const deg of LEGS) {
  const d = dir(deg);
  const t = dir(deg + 90);
  const front = deg === FRONT;
  const halfW = front ? 9 : 11;
  const ring = [add(mul(d, APOTHEM), mul(t, -halfW)), add(mul(d, APOTHEM + 13), mul(t, -halfW)), add(mul(d, APOTHEM + 13), mul(t, halfW)), add(mul(d, APOTHEM), mul(t, halfW))].map(([x, y]) => [x, y]);
  upPrism(`descent.outrigger${deg}`, ring, 98, front ? 123 : DECK_Z, { tone: "mid", bevel: 0.4 });
  PIN[deg] = { c: [...mul(d, APOTHEM + 13 + 4.6).slice(0, 2), 110], r: 4.6 };
}
// descent engine
{
  const F = { o: [0, 0, BODY_Z - 4], a: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] };
  round("dps.gimbal", F, 0, 3, 16, { tone: "mid" });
  round("dps.bell", F, 3, 34, [13, 30], { tone: "hi", details: { seams: [14, 24] } });
}
// MESA: the pallet hinged down from the front-right bay, with the TV camera
{
  const i = 1;
  const n = dir(45 * i);
  const t = dir(45 * i + 90);
  const hinge = add(mul(n, APOTHEM), [0, 0, BODY_Z + 40]);
  const tilt = 32 * DEG;
  const down = unit(add(mul(n, Math.sin(tilt)), [0, 0, -Math.cos(tilt)]));
  let out = unit(cross(t, down));
  if (dot(out, n) < 0) out = mul(out, -1);
  const F = { o: hinge, a: out, u: t, v: down };
  const poly = [[-22, 0], [22, 0], [22, 30], [-22, 30]];
  const pallet = prism("mesa.pallet", F, poly, 0, 3, { tone: "hi", material: "gold", details: { dots: [[-19.5, 2], [19.5, 2], [-19.5, 28], [19.5, 28]].map(([u, v]) => ({ at: [3, u, v], normal: out, size: 0.42 })) } });
  T.plane({ part: pallet, o: add(hinge, mul(out, 3)), u: t, v: down, normal: out, svg: `<g class="lm-foil-lines">${loop2([[-18, 4], [18, 4], [18, 26], [-18, 26]], "lo")}</g>` });
  const camF = { o: add(add(hinge, mul(out, 3)), add(mul(t, -8), mul(down, 18))), a: out, u: t, v: down };
  prism("mesa.camera", camF, [[-5, -4], [5, -4], [5, 4], [-5, 4]], 0, 8, { tone: "mid" });
  const lensAt = add(camF.o, mul(out, 8));
  const lensF = frameOf(lensAt, out, [0, 0, 1]);
  const lens = round("mesa.lens", lensF, 0, 3.4, 2.6, { tone: "hi" });
  T.plane({ part: lens, o: add(lensAt, mul(out, 3.4)), u: lensF.u, v: lensF.v, normal: out, svg: fill2(circle2(0, 0, 1.6, 24), "lm-glass") });
}

// =====================================================================
// LANDING GEAR
// =====================================================================
const LADDER = {};
for (const deg of LEGS) {
  const d = dir(deg);
  const foot = [...mul(d, PAD_R).slice(0, 2), 0];
  const PADF = UP(foot[0], foot[1]);
  round(`gear.pad${deg}`, PADF, 0, 6.4, [12, 19.4], { tone: "hi" });
  round(`gear.boss${deg}`, PADF, 6.4, 9.4, 5.4, { tone: "mid" });
  const socket = [foot[0], foot[1], 9.4 + 3.6];
  ball(`gear.socket${deg}`, socket, 4.4, { tone: "hi", flats: [{ n: [0, 0, -1], d: 3.6 }] });
  const pin = PIN[deg];
  ball(`gear.pin${deg}`, pin.c, pin.r, { tone: "hi" });
  const axis = unit(sub(socket, pin.c));
  const L = len(sub(socket, pin.c));
  const F = frameOf(pin.c, axis, [0, 0, 1]);
  const sCollar = L * 0.5;
  const sFit = L * 0.7;
  const FIT = 2.6;
  round(`gear.strut${deg}`, F, pin.r, sCollar, 3.6, { tone: "hi" });
  round(`gear.collar${deg}`, F, sCollar, sCollar + 3.4, 4.4, { tone: "mid" });
  round(`gear.piston${deg}`, F, sCollar + 3.4, L - 4.4, 2.6, { tone: "hi" });
  const t = dir(deg + 90);
  for (const side of [-1, 1]) {
    const v = [(CIRCUM - 4) * Math.cos((deg + side * 22.5) * DEG), (CIRCUM - 4) * Math.sin((deg + side * 22.5) * DEG)];
    const bracket = [v[0], v[1], BODY_Z - 3];
    const LUG = 3.2;
    const lugF = frameOf(add(pin.c, mul(axis, sFit)), mul(t, side), axis);
    round(`gear.lug${deg}${side > 0 ? "+" : "-"}`, lugF, 2.6, 2.6 + LUG, 2.2, { tone: "mid" });
    const lug = G.pointOf(lugF, 2.6 + LUG + FIT, 0, 0);
    ball(`gear.fitting${deg}${side > 0 ? "+" : "-"}`, lug, FIT, { tone: "mid" });
    ball(`gear.bracket${deg}${side > 0 ? "+" : "-"}`, bracket, 3, { tone: "mid" });
    rod(`gear.secondary${deg}${side > 0 ? "+" : "-"}`, lug, bracket, 1.8, { ra: FIT, rb: 3, extra: { tone: "mid" } });
  }
  if (deg === FRONT) Object.assign(LADDER, { F, L, axis, pin: pin.c });
  // contact probe: folded on landing, lying on the regolith
  if (deg !== FRONT) {
    const side = dir(deg + 40);
    const HZ = 5.8;
    const s0 = 19.45;
    const hingeF = frameOf(add(foot, add(mul(d, s0), [0, 0, HZ])), d, [0, 0, 1]);
    round(`probes.hinge${deg}`, hingeF, 0, 2.6, 1.6, { tone: "mid" });
    const j1 = add(foot, add(mul(d, s0 + 2.6 + 3 + 1.1), [0, 0, HZ]));
    round(`probes.stub${deg}`, hingeF, 2.6, 2.6 + 3, 0.8, { tone: "hi" });
    ball(`probes.knee${deg}`, j1, 1.1, { tone: "hi" });
    const j2 = add(foot, add(mul(d, s0 + 12), [0, 0, 1.1]));
    ball(`probes.elbow${deg}`, j2, 1.1, { tone: "hi" });
    rod(`probes.rod${deg}a`, j1, j2, 0.8, { ra: 1.1, rb: 1.1, extra: { tone: "hi" } });
    const tip = add(j2, mul(side, 36));
    ball(`probes.tip${deg}`, tip, 1.1, { tone: "hi" });
    rod(`probes.rod${deg}b`, j2, tip, 0.8, { ra: 1.1, rb: 1.1, extra: { tone: "hi" } });
  }
}
// ladder down the front strut, its brackets and the plaque behind the rungs
{
  const { F, L, axis } = LADDER;
  const side = dir(FRONT + 90);
  let out = unit(cross(axis, side));
  if (out[2] < 0) out = mul(out, -1);
  const OFF = 6.2;
  const HALF = 12.5;
  const RAIL = 1.1;
  const PORCH_BOTTOM = 123;
  const railAt = (s, u) => add(add(add(F.o, mul(axis, s)), mul(out, OFF)), mul(side, u));
  // the rail top rim stays under the porch: the end disc's highest point is at z = PORCH_BOTTOM
  const rimUp = RAIL * Math.sqrt(1 - axis[2] ** 2);
  const sAtZ = (z) => (z - (F.o[2] + out[2] * OFF)) / axis[2];
  const sTop = sAtZ(PORCH_BOTTOM - rimUp);
  const sBottom = sAtZ(46);
  for (const u of [-HALF, HALF]) round(`ladder.rail${u > 0 ? "+" : "-"}`, frameOf(railAt(sTop, u), axis, out), 0, sBottom - sTop, RAIL, { tone: "hi" });
  const rungS = (i) => sBottom - ((sBottom - sTop - 8) * i) / 8 - 1.5;
  for (let i = 0; i < 9; i++) {
    const s = rungS(i);
    const a = railAt(s, -HALF + RAIL);
    round(`ladder.rung${i}`, frameOf(a, side, out), 0, 2 * (HALF - RAIL), 0.85, { tone: "mid" });
  }
  for (const s of [(rungS(6) + rungS(7)) / 2, (rungS(0) + rungS(1)) / 2]) {
    const r0 = s < L * 0.5 ? 3.6 : 2.6;
    for (const u of [-HALF, HALF]) {
      const axisPt = add(F.o, mul(axis, s));
      const toward = unit(sub(railAt(s, u), axisPt));
      const dist = len(sub(railAt(s, u), axisPt));
      round(`ladder.bracket${Math.round(s)}${u > 0 ? "+" : "-"}`, frameOf(axisPt, toward, axis), r0, dist - RAIL, 0.7, { tone: "mid" });
    }
  }
  const sPlaque = L * 0.32;
  const pO = add(add(F.o, mul(axis, sPlaque)), mul(out, 3.6));
  const plaque = prism("ladder.plaque", { o: pO, a: out, u: side, v: axis }, [[-9, -6], [9, -6], [9, 6], [-9, 6]], 0, 0.9, { tone: "hi", details: { dots: [[-7.6, -4.4], [7.6, -4.4], [-7.6, 4.4], [7.6, 4.4]].map(([u, v]) => ({ at: [0.9, u, v], normal: out, size: 0.38 })) } });
  T.plane({ part: plaque, o: add(pO, mul(out, 0.9)), u: side, v: axis, normal: out, svg: loop2([[-8, -5], [8, -5], [8, 5], [-8, 5]], "faint") + [[-6, 6, -2.6], [-6, 4, -0.6], [-6, 6.4, 1.4], [-4, 2, 3.4]].map(([u0, u1, v]) => line2([[u0, v], [u1, v]], "lo", ' data-free=""')).join("") });
}
// porch and its handrails (posts and rails meeting at small balls)
{
  const plan = { x: -22, y: APOTHEM, w: 44, d: 29, r: 1.2 };
  const porch = box("ladder.porch", plan, 123, 3, { tone: "hi", steps: 3 });
  T.plane({ part: porch, o: [0, 0, 126], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1], svg: Array.from({ length: 7 }, (_, i) => line2([[plan.x + 5 + i * 5.66, -plan.y], [plan.x + 5 + i * 5.66, -(plan.y + plan.d)]], "faint")).join("") });
  const BR = 1.3;
  const RR = 0.9;
  for (const sx of [-1, 1]) {
    const x = sx * 19.5;
    const fTop = [x, 111, 150];
    const bTop = [x, 80, 150];
    ball(`ladder.rail-ball${sx}f`, fTop, BR, { tone: "hi" });
    ball(`ladder.rail-ball${sx}b`, bTop, BR, { tone: "hi" });
    round(`ladder.post${sx}f`, UP(x, 111), 126, 150 - BR, RR, { tone: "hi" });
    round(`ladder.post${sx}b`, UP(x, 80), 126, 150 - BR, RR, { tone: "hi" });
    rod(`ladder.handrail${sx}`, fTop, bTop, RR, { ra: BR, rb: BR, extra: { tone: "hi" } });
  }
}

// =====================================================================
// ASCENT STAGE (its own group: it slides up and away at liftoff)
// =====================================================================
const CAB_FRONT = 72;
const CABIN_Z = 178;
box("ascent.base", { x: -56, y: -84, w: 112, d: CAB_FRONT + 84, r: 6 }, DECK_Z, 8, { tone: "mid", steps: 4, bevel: 0.6 }, Asc);
const CAB = [[-30, -44], [30, -44], [46, -28], [46, 28], [30, 44], [-30, 44], [-46, 28], [-46, -28]];
const CABF = { o: [0, 6, CABIN_Z], a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] };
const cabin = prism("ascent.cabin", CABF, CAB, 0, CAB_FRONT - 6, { tone: "hi", details: { seams: [22, 44] } }, Asc);
const MID_TOP = DECK_Z + 8 + 96;
box("ascent.mid", { x: -42, y: -40, w: 84, d: 46, r: 1 }, DECK_Z + 8, 96, { tone: "hi", bevel: 0.6, details: { seams: [186] } }, Asc);
const aft = box("ascent.aft", { x: -34, y: -84, w: 68, d: 44, r: 1 }, DECK_Z + 8, 80, { tone: "hi", bevel: 0.6, details: { seams: [172] } }, Asc);
for (const sx of [-1, 1]) {
  T.plane({ part: aft, o: [sx * 34, -84, 0], u: [0, 1, 0], v: [0, 0, -1], normal: [sx, 0, 0], svg: [0, 1, 2, 3].map((i) => loop2([[5 + i * 9, -186], [11 + i * 9, -186], [11 + i * 9, -160], [5 + i * 9, -160]], "lo")).join("") });
}
for (const sx of [-1, 1]) {
  const poly = [[42, 136], [70, 140], [86, 160], [86, 198], [70, 216], [42, 220]].map(([x, z]) => [sx * x, z]);
  prism(sx < 0 ? "ascent.cheek-ox" : "ascent.cheek-fuel", { o: [0, -40, 0], a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] }, sx < 0 ? poly.reverse() : poly, 0, 44, { tone: "hi", details: { seams: [11, 22, 33] } }, Asc);
}
const tunnel = round("ascent.tunnel", UP(0, -17), MID_TOP, MID_TOP + 10, 16, { tone: "mid" }, Asc);
const drogue = round("ascent.drogue", UP(0, -17), MID_TOP + 10, MID_TOP + 12, 17, { tone: "hi", details: { bolts: [{ s: MID_TOP + 12, r: 13, count: 12, size: 0.4 }] } }, Asc);
T.plane({ part: drogue, o: [0, -17, MID_TOP + 12], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1], svg: fill2(circle2(0, 0, 9, 48), "lm-void") + loop2(circle2(0, 0, 9, 48), "lo") });
void tunnel;
// forward face: hatch, windows; docking window on the roof
{
  const FACE_Y = CAB_FRONT;
  const fx = (x, z) => [x, -z];
  let svg = loop2([fx(-15, 138), fx(15, 138), fx(15, 168), fx(-15, 168)], "mid") + loop2([fx(-12.5, 140.5), fx(12.5, 140.5), fx(12.5, 165.5), fx(-12.5, 165.5)], "faint");
  svg += [[-13.5, 139.5], [13.5, 139.5], [-13.5, 166.5], [13.5, 166.5]].map(([x, z]) => `<circle class="lm-screw" cx="${fmt(x)}" cy="${fmt(-z)}" r="0.42"/>`).join("");
  svg += loop2([fx(6, 151), fx(12, 151), fx(12, 154), fx(6, 154)], "mid");
  for (const sx of [-1, 1]) {
    const tri = [fx(sx * 40, 196), fx(sx * 12, 214), fx(sx * 12, 186)];
    const inn = [fx(sx * 36.5, 196), fx(sx * 14, 210.5), fx(sx * 14, 189)];
    svg += fill2(inn, "lm-glass") + loop2(tri, "mid") + loop2(inn, "lo");
  }
  T.plane({ part: cabin, o: [0, FACE_Y, 0], u: [1, 0, 0], v: [0, 0, -1], normal: [0, 1, 0], svg });
  const roof = CABIN_Z + 44;
  T.plane({ part: cabin, o: [0, 0, roof], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1], svg: fill2([[-22, -44], [-10, -44], [-10, -56], [-22, -56]], "lm-glass") + loop2([[-23, -43], [-9, -43], [-9, -57], [-23, -57]], "mid") });
}
// RCS quads on their booms
[[-1, 40], [1, 40], [-1, -64], [1, -64]].forEach(([sx, y], i) => {
  const q = [sx * 77, y, 198];
  const from = y > 0 ? 46 : 34;
  box(`rcs.boom${i}`, { x: sx > 0 ? from : -72, y: y - 2.5, w: 72 - from, d: 5, r: 0.4 }, 195.5, 5, { tone: "mid" }, Asc);
  box(`rcs.quad${i}`, { x: q[0] - 5, y: q[1] - 5, w: 10, d: 10, r: 0.8 }, q[2] - 5, 10, { tone: "hi", bevel: 0.4 }, Asc);
  [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]].forEach((a, j) => round(`rcs.nozzle${i}${j}`, frameOf(add(q, mul(a, 5)), a, Math.abs(a[2]) > 0.5 ? [1, 0, 0] : [0, 0, 1]), 0, 7.4, [1.8, 3.4], { tone: "mid" }, Asc));
});
// antennas
function dish(name, root, a, R, g = Asc) {
  const F = frameOf(root, a, [0, 0, 1]);
  const d = round(name, F, 0, 4.4, [2.4, R], { tone: "hi" }, g);
  T.plane({ part: d, o: G.pointOf(F, 4.4, 0, 0), u: F.u, v: F.v, normal: a, svg: loop2(circle2(0, 0, R * 0.76, 48), "faint") + loop2(circle2(0, 0, R * 0.4, 32), "faint") });
  round(`${name}-feed`, F, 4.4, 11.4, 0.6, { tone: "hi" }, g);
  ball(`${name}-horn`, G.pointOf(F, 11.4 + 1.3, 0, 0), 1.3, { tone: "hi" }, g);
}
{
  const base = [-24, 26, CABIN_Z + 44];
  round("antennas.rr-pedestal", UP(base[0], base[1]), base[2], base[2] + 6, 5, { tone: "mid" }, Asc);
  const hub = add(base, [0, 0, 6 + 4]);
  ball("antennas.rr-gimbal", hub, 4, { tone: "mid" }, Asc);
  const a = unit([-0.35, 0.55, 0.76]);
  rod("antennas.rr-neck", hub, add(hub, mul(a, 4 + 3)), 1.6, { ra: 4, g: Asc });
  dish("antennas.rr-dish", add(hub, mul(a, 7)), a, 12.4);
}
{
  const rootPt = [-42, -14, MID_TOP - 4];
  const elbow = [-63, -14, MID_TOP - 4];
  const head = [-63, -14, MID_TOP + 12];
  ball("antennas.sband-joint", elbow, 3, { tone: "mid" }, Asc);
  ball("antennas.sband-gimbal", head, 3.4, { tone: "mid" }, Asc);
  rod("antennas.sband-boom", rootPt, elbow, 1.6, { rb: 3, g: Asc });
  rod("antennas.sband-mast", elbow, head, 1.6, { ra: 3, rb: 3.4, g: Asc });
  const a = unit([-0.45, 0.35, 0.82]);
  rod("antennas.sband-neck", head, add(head, mul(a, 3.4 + 3)), 1.6, { ra: 3.4, g: Asc });
  dish("antennas.sband-dish", add(head, mul(a, 6.4)), a, 13);
}
for (const [i, [x, y, z, h]] of [[26, 46, CABIN_Z + 44, 14], [-20, -74, DECK_Z + 88, 16]].entries()) {
  round(`antennas.vhf-base${i}`, UP(x, y), z, z + 2, 2.4, { tone: "mid" }, Asc);
  round(`antennas.vhf-mast${i}`, UP(x, y), z + 2, z + h, 0.8, { tone: "hi" }, Asc);
  const c = [x, y, z + h - 2];
  [[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0]].forEach((a, j) => round(`antennas.vhf-element${i}${j}`, frameOf(c, a, [0, 0, 1]), 0.8, 8, 0.5, { tone: "hi" }, Asc));
}
round("antennas.eva-base", UP(28, -30), MID_TOP, MID_TOP + 2, 2.6, { tone: "mid" }, Asc);
round("antennas.eva-mast", UP(28, -30), MID_TOP + 2, MID_TOP + 18, 0.8, { tone: "hi" }, Asc);
round("antennas.eva-cone", UP(28, -30), MID_TOP + 18, MID_TOP + 24, [6.4, 0.8], { tone: "hi" }, Asc);
round("antennas.target-post", UP(-26, -4), MID_TOP, MID_TOP + 12, 0.9, { tone: "mid" }, Asc);
const target = round("antennas.target-disc", UP(-26, -4), MID_TOP + 12, MID_TOP + 13, 5, { tone: "hi" }, Asc);
T.plane({ part: target, o: [-26, -4, MID_TOP + 13], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1], svg: line2([[-4.95, 0], [4.95, 0]], "mid") + line2([[0, -4.95], [0, 4.95]], "mid") });

// =====================================================================
// LEFT BEHIND: retroreflector, seismometer, flag
// =====================================================================
{
  const [x, y] = [104, 150];
  box("lrrr.pallet", { x: x - 12, y: y - 22, w: 24, d: 32, r: 1 }, 0, 3, { tone: "mid" });
  const toward = unit([0.3, 0.55, 0.78]);
  let u = unit(cross(toward, [0, 0, 1]));
  if (cross(toward, u)[2] < 0) u = mul(u, -1);
  const vUp = cross(toward, u); // up the panel's slope
  const half = 10;
  const lowEdge = [x, y - 6, 3];
  const o = add(lowEdge, mul(vUp, half)); // panel centre; its low edge rests on the pallet
  const F = { o, a: toward, u, v: vUp };
  const panel = prism("lrrr.panel", F, [[-half, -half], [half, -half], [half, half], [-half, half]], 0, 2.4, { tone: "hi" });
  let cells = "";
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) cells += `<circle class="lm-cell" cx="${fmt(-half + 1 + i * 2)}" cy="${fmt(-half + 1 + j * 2)}" r="0.62"/>`;
  T.plane({ part: panel, o: add(o, mul(toward, 2.4)), u, v: vUp, normal: toward, svg: cells + loop2([[-half + 0.4, -half + 0.4], [half - 0.4, -half + 0.4], [half - 0.4, half - 0.4], [-half + 0.4, half - 0.4]], "faint") });
  // two vertical legs, each ending where its top rim meets the panel's back
  for (const sx of [-1, 1]) {
    const px = x + sx * 8;
    const py = y - 14;
    const r = 0.8;
    const backAt = (p) => dot(sub(p, o), toward);
    let lo = 3;
    let hi = 60;
    for (let it = 0; it < 50; it++) {
      const mid = (lo + hi) / 2;
      const worst = Math.max(...Array.from({ length: 24 }, (_, j) => backAt([px + r * Math.cos((j / 24) * 6.283), py + r * Math.sin((j / 24) * 6.283), mid])));
      if (worst < 0) lo = mid;
      else hi = mid;
    }
    round(`lrrr.leg${sx}`, UP(px, py), 3, lo, r, { tone: "mid" });
  }
}
{
  const [x, y] = [146, -112];
  upPrism("psep.body", octagon(7, x, y), 0, 14, { tone: "hi", bevel: 0.4 });
  round("psep.sensor", UP(x, y), 14, 17, 4.2, { tone: "mid" });
  round("psep.antenna", UP(x, y), 17, 25, 0.6, { tone: "hi" });
  for (const sx of [-1, 1]) {
    const plan = sx < 0 ? { x: x - 7 - 34, y: y - 13, w: 34, d: 26, r: 0.6 } : { x: x + 7, y: y - 13, w: 34, d: 26, r: 0.6 };
    const p = box(`psep.panel${sx}`, plan, 7.2, 1.2, { tone: "hi" });
    let svg = fill2([[plan.x + 0.6, -plan.y - 0.6], [plan.x + plan.w - 0.6, -plan.y - 0.6], [plan.x + plan.w - 0.6, -plan.y - plan.d + 0.6], [plan.x + 0.6, -plan.y - plan.d + 0.6]], "lm-cells");
    for (let i = 1; i < 6; i++) svg += line2([[plan.x + (plan.w * i) / 6, -plan.y], [plan.x + (plan.w * i) / 6, -(plan.y + plan.d)]], "lo");
    for (let j = 1; j < 4; j++) svg += line2([[plan.x, -(plan.y + (plan.d * j) / 4)], [plan.x + plan.w, -(plan.y + (plan.d * j) / 4)]], "lo");
    T.plane({ part: p, o: [0, 0, 8.4], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1], svg });
  }
}
{
  const [fx, fy] = FLAG_FOOT;
  const F = { group: flagG, layer: LIVE };
  round("flag.knuckle", frameOf([fx - 1.5, fy, FLAG_AXIS_Z], [1, 0, 0], [0, 0, 1]), 0, 3, FLAG_AXIS_Z, { tone: "mid" }, F);
  const POLE = 84;
  const z0 = FLAG_AXIS_Z * 2;
  round("flag.pole", UP(fx, fy), z0, z0 + POLE, 0.8, { tone: "hi", fixed: false }, F);
  const CW = 60;
  const CH = 36;
  const top = z0 + POLE;
  const cloth = prism("flag.cloth", { o: [fx - 0.8, fy, 0], a: [0, 1, 0], u: [-1, 0, 0], v: [0, 0, 1] }, [[0, top - CH], [CW, top - CH], [CW, top], [0, top]], -0.3, 0.3, { tone: "hi" }, F);
  const stripes = (flip) => {
    let svg = "";
    for (let i = 1; i < 7; i++) {
      const v = (CH * i) / 7;
      const u0 = v < CH * 0.54 ? CW * 0.4 : 0;
      svg += line2([[flip ? -u0 : u0, v], [flip ? -CW : CW, v]], "lo");
    }
    svg += line2([[flip ? -CW * 0.4 : CW * 0.4, 0], [flip ? -CW * 0.4 : CW * 0.4, CH * 0.54], [0, CH * 0.54]], "lo");
    return svg;
  };
  T.plane({ part: cloth, o: [fx - 0.8, fy + 0.3, top], u: [-1, 0, 0], v: [0, 0, -1], normal: [0, 1, 0], svg: stripes(false) });
  T.plane({ part: cloth, o: [fx - 0.8, fy - 0.3, top], u: [1, 0, 0], v: [0, 0, -1], normal: [0, -1, 0], svg: stripes(true) });
}

// =====================================================================
// BUILD
// =====================================================================
const flagAt = (t) => -Math.min(87, 87 * t);
export const poses = () => {
  const out = [];
  for (let deg = 0; deg < 360; deg += 1) out.push(follow({ lm: deg, asc: 0, flag: 0 }));
  for (let deg = 0; deg < 360; deg += 15) for (const h of [2, 6, 15, 40, 120, 400]) for (const f of [0, 0.3, 0.7, 1]) out.push(follow({ lm: deg, asc: h, flag: flagAt(f) }));
  return out;
};
const t0 = Date.now();
const out = T.build({ statics: R.items, poses, strict: !argv.includes("--loose") });
if (argv.includes("--probe")) { for (const name of ["lrrr.panel", "lrrr.pallet", "gear.fitting0+", "gear.piston0"]) { const p = T.parts.find((q) => q.name === name); const zs = p.samples.map((q) => q[2]); console.log(name, JSON.stringify(p.world?.ring?.slice(0,4)), p.world?.s0, p.world?.s1, JSON.stringify(p.world?.F), p.kind, p.samples.length, "z", Math.min(...zs).toFixed(2), Math.max(...zs).toFixed(2), "y", Math.min(...p.samples.map((q) => q[1])).toFixed(1), Math.max(...p.samples.map((q) => q[1])).toFixed(1)); } }
console.log(`turn build ${((Date.now() - t0) / 1000).toFixed(1)} s · ${out.report.parts} parts · ${out.report.layers.map((l) => `${l.name}: ${l.planar} planar, ${l.framed} framed, ${l.dynamic} dynamic`).join(" · ")}`);
if (argv.includes("--audit")) {
  A.settle(R, P);
  A.auditOrExit(R, P);
  TA.orbitOrExit(T, R, P, {
    sweep: { at: (x) => follow({ lm: x, asc: 0, flag: 0 }), from: 0, to: 360, frame: 0.5 },
    clips: [{ name: "liftoff", at: (t) => follow({ lm: 20 + 4 * t, asc: 40 * 0.78 * t * t * MODEL.unitsPerMetre / 40, flag: flagAt(t / 3) }), from: 0, to: 3, frame: 1 / 30 }],
    quick: argv.includes("--quick"),
    only: argv.find((a) => a.startsWith("--only="))?.slice(7).split(",") ?? null,
  });
}

const layerOf = (name) => R.items.filter((item) => item.layer === name).sort((a, b) => a.key - b.key).map((item) => item.svg);
const backSvg = k.figureSvg({ width: W, height: H, label: TEXT.fr.label, body: [...back, ...layerOf("back")], className: "lm-back" });
const debrisSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg iso-layer lm-over" viewBox="0 0 ${W} ${H}" aria-hidden="true"><g class="lm-debris"></g></svg>`;
const stage = `<div class="lm-stage iso-turn" tabindex="0" role="group" aria-label="${TEXT.fr.aria3d}">${backSvg}${out.layerSvg("lm", { width: W, height: H })}<canvas class="iso-layer lm-gl" aria-hidden="true"></canvas>${debrisSvg}</div>`;

const PARTS3 = PARTS.filter((part) => part.id !== "aps");
const DATA = { W, H, P, V, camera: glCamera(P), turn: out.data, model: MODEL, parts: PARTS3, text: TEXT, deckZ: DECK_Z, ground: DISC_R, flagMax: 87 };
const PART_BUTTONS = PARTS3.map((part, index) => `<button type="button" class="lm-part" data-part="${part.id}"><span class="lm-num">${String(index + 1).padStart(2, "0")}</span><span data-t="part.${part.id}">${part.fr.name}</span></button>`).join("");
const corners = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1 · FORBITS · 360°</span><span class="iso-plate-corner" data-corner="title" data-t="title">${TEXT.fr.title}</span><span class="iso-plate-corner" data-corner="readout" data-readout>${TEXT.fr.rest}</span></div>`;
const controls = `<div class="lm-controls"><button type="button" class="lm-fire" data-fire><span class="lm-lamp" aria-hidden="true"></span><span data-fire-label>${TEXT.fr.liftoff}</span></button><span class="lm-hint" data-t="hint3d">${TEXT.fr.hint3d}</span><span class="lm-live" aria-live="polite" data-live></span></div>`;
const lang = `<div class="lm-lang" role="group" aria-label="Langue / Language"><button type="button" data-lang="fr" aria-pressed="true">FR</button><button type="button" data-lang="en" aria-pressed="false">EN</button></div>`;
const bodyHtml = `<figure class="iso-figure lm"><div class="iso-plate">${corners}${lang}${stage}${controls}</div><figcaption class="iso-legend"><span class="lm-parts">${PART_BUTTONS}</span><span class="iso-caption" data-t="caption">${TEXT.fr.caption}</span></figcaption></figure>`;
const CSS = out.css + "\n" + readFileSync(join(HERE, "../shared/forbits.css"), "utf8") + "\n" + readFileSync(join(HERE, "../shared/turntable.css"), "utf8");
const LIVEJS = readFileSync(join(HERE, "live-3d.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:wght@700&display=swap" rel="stylesheet">`;
const page = k.pageHtml({ title: "FORBITS · Module lunaire Eagle · 360°", theme: THEME, body: `${FONTS}<style>${CSS}</style>${bodyHtml}`, script: kitScript() + turnScript() + glScript() + LIVEJS, width: 1080 }).replace('<html lang="en">', '<html lang="fr">');
const name = THEME === "light" ? "lunar-module-3d-light.html" : "lunar-module-3d.html";
writeFileSync(join(HERE, "../../pages", name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `turn data ${(JSON.stringify(out.data).length / 1024).toFixed(0)} KB`);
