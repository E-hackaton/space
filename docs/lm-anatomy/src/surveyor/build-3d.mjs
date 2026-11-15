// Surveyor 3 on a turntable (anatomy 3D mode). World units: 40 per metre, z up.
// Groups: disc (turntable) → pitch (the sampler arm's elevation hinge) → ext (its extension slide).
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
import { MODEL, PARTS, TEXT, digAt, DIG_END } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const THEME = argv.includes("--light") ? "light" : "dark";
const DEG = Math.PI / 180;
const U = MODEL.unitsPerMetre;

const W = 1000;
const H = 760;
const AZIMUTH = 55;
const ELEVATION = 30;
const DISC_R = 128;
const DISC_Z0 = -4;
const PLINTH_R = 144;
const PLINTH_Z0 = -16;
const FOOT_H = 8;

const LEGS = [90, 210, 330];
const TOPS = [30, 150, 270];
const RB = 42; // bottom triangle circumradius
const ZB = 36;
const RT = 22;
const ZT = 78;
const NODE = 4.6;
const TUBE = 1.1;
const PAD_R = (MODEL.span * U) / 2 - 2; // footpad centres
const MAST_TOP = MODEL.height * U - 17; // the panels reach 3 m

const fitPts = [];
for (let i = 0; i < 64; i++) {
  const a = (i / 64) * Math.PI * 2;
  fitPts.push([PLINTH_R * Math.cos(a), PLINTH_R * Math.sin(a), PLINTH_Z0 - FOOT_H], [PLINTH_R * Math.cos(a), PLINTH_R * Math.sin(a), 0]);
  fitPts.push([24 * Math.cos(a), 24 * Math.sin(a), MAST_TOP + 20]);
}
export const P = k.fitProjection(fitPts, W, H, { pad: 30, azimuth: AZIMUTH, elevation: ELEVATION });
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const add = G.add3, sub = G.sub3, mul = G.mul3, unit = G.unit3, dot = G.dot3, cross = G.cross3, len = G.len3;
const dir = (deg) => [Math.cos(deg * DEG), Math.sin(deg * DEG), 0];
const at = (deg, r, z) => [r * Math.cos(deg * DEG), r * Math.sin(deg * DEG), z];
const UPF = (x, y, z = 0) => ({ o: [x, y, z], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] });
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
const hull2 = (pts) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const q of p) { while (lo.length >= 2 && cz(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  const up = [];
  for (const q of [...p].reverse()) { while (up.length >= 2 && cz(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

export const R = A.recorder(P);
export const T = turning(P, { recorder: R });
const disc = T.group("disc", { turn: { pivot: [0, 0] } });
// the sampler arm: its pivot sits outside the frame, between legs 90° and 210°
const ARM_DEG = 150;
const D_ARM = dir(ARM_DEG);
const E_ARM = unit(cross(D_ARM, [0, 0, 1])); // hinge axis: positive pitch raises the arm
const EDGE_MID = mul(D_ARM, RB * Math.cos(60 * DEG)); // midpoint of the bottom edge at 150°
const PIVOT = add(add(EDGE_MID, mul(D_ARM, 6.4)), [0, 0, 31]);
const pitch = T.group("pitch", { parent: disc, hinge: { point: PIVOT, axis: E_ARM, range: [-40, 15] } });
const TRAVEL = 26;
const ext = T.group("ext", { parent: pitch, slide: { direction: D_ARM, travel: TRAVEL } });
const LIVE = T.layer("lm");
T.stack(["back", "lm", "front"]);
export const follow = (v) => ({ disc: v.disc ?? 0, pitch: v.pitch ?? 12, ext: v.ext ?? 0 });

const on = (group) => ({ group, layer: LIVE });
const Dg = on(disc);
const round = (name, F, s0, s1, r, extra = {}, g = Dg) => T.round({ name, ...g, F, s0, s1, r, tone: "mid", ...extra });
const ball = (name, c, r, extra = {}, g = Dg) => T.ball({ name, ...g, c, r, tone: "mid", ...extra });
const box = (name, plan, z, h, extra = {}, g = Dg) => T.prism({ name, ...g, plan, z, h, steps: extra.steps ?? 2, tone: "hi", ...extra });
const prism = (name, F, polygon, s0, s1, extra = {}, g = Dg) => T.prism({ name, ...g, F, polygon, s0, s1, tone: "hi", ...extra });
function rod(name, a, b, r, { ra = 0, rb = 0, extra = {}, g = Dg } = {}) {
  const axis = unit(sub(b, a));
  return round(name, frameOf(a, axis, Math.abs(axis[2]) > 0.95 ? [1, 0, 0] : [0, 0, 1]), ra, len(sub(b, a)) - rb, r, extra, g);
}
// a box in a frame turned to face `deg` (x outward, y along, z up), as a convex prism
function turnedBox(name, deg, r0, r1, a0, a1, z0, z1, extra = {}, g = Dg) {
  const F = { o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] };
  const d = dir(deg);
  const t = dir(deg + 90);
  const ring = [[r0, a0], [r1, a0], [r1, a1], [r0, a1]].map(([r, s]) => [d[0] * r + t[0] * s, d[1] * r + t[1] * s]);
  return prism(name, F, ring, z0, z1, extra, g);
}

// =====================================================================
// STATIC PLINTH with its ruler bezel
// =====================================================================
const back = [];
const putStatic = (name, svg, shapes, bias = 0, ref = [0, 0, PLINTH_Z0]) => R.put({ name, layer: "back", at: ref, bias, svg, shapes: shapes.map((s) => R.solid(Object.assign(s, { name: s.name ?? name }))) });
back.push(`<path class="iso-halo" d="${k.haloOf({ x: -PLINTH_R, y: -PLINTH_R, w: PLINTH_R * 2, d: PLINTH_R * 2, r: PLINTH_R }, PLINTH_Z0 - FOOT_H, -PLINTH_Z0, P)}"/>`);
Array.from({ length: 6 }, (_, i) => [Math.cos((30 + 60 * i) * DEG) * (PLINTH_R - 26), Math.sin((30 + 60 * i) * DEG) * (PLINTH_R - 26)]).forEach(([x, y], i) => {
  const svg = S(k.cylinder(x, y, 11, PLINTH_Z0 - FOOT_H, 2.2, P, 32), { tone: "lo" }) + S(k.cylinder(x, y, 8, PLINTH_Z0 - FOOT_H + 2.2, FOOT_H - 2.2, P, 32), { tone: "mid" });
  putStatic(`stand.foot${i}`, svg, [A.cylinder(x, y, 11, PLINTH_Z0 - FOOT_H, FOOT_H, { ground: true })], -1000 + k.depthOf([x, y, 0], P) * 0.001, [x, y, PLINTH_Z0 - FOOT_H]);
});
{
  const F0 = UPF(0, 0);
  const count = Math.round((2 * Math.PI * (PLINTH_R - 2.2)) / (U / 4));
  const ticks = k.radialTicks(0, 0, PLINTH_R - 2.2, count, 4, DISC_Z0, [3.6, PLINTH_R - 2.2 - (DISC_R + 2.5)], P);
  const svg =
    S(G.disc(PLINTH_Z0, PLINTH_Z0 + 5, PLINTH_R, F0, P), { tone: "mid" }) +
    S(G.disc(PLINTH_Z0 + 5, DISC_Z0, PLINTH_R - 1.2, F0, P, { bevel: 1.2 }), { tone: "lo", inner: Ln(G.arcOf(F0, PLINTH_Z0 + 8, PLINTH_R - 1.2, P), { tone: "faint" }) }) +
    `<path class="lm-bezel" fill-rule="evenodd" d="${G.circleOf(F0, DISC_Z0, PLINTH_R - 2.2, P, 160)} ${G.circleOf(F0, DISC_Z0, DISC_R + 2.5, P, 160)}"/>` +
    Ln(G.circleOf(F0, DISC_Z0, PLINTH_R - 2.2, P, 160) + G.circleOf(F0, DISC_Z0, DISC_R + 2.5, P, 160), { tone: "lo" }) +
    Ln(ticks.minor, { tone: "lo" }) +
    Ln(ticks.major, { tone: "mid" });
  putStatic("stand.plinth", svg, [A.disc(F0, PLINTH_Z0, DISC_Z0, PLINTH_R, { ground: true })]);
}

// =====================================================================
// THE TURNING DISC: regolith, the 1967 trenches, Apollo 12's footprints
// =====================================================================
const ground = round("ground.disc", UPF(0, 0), DISC_Z0, 0, DISC_R, { tone: "lo" });
const ARM_LEN = 33.6;
const SCOOP_DROP = 1.5;
const digOpts = { pivotZ: PIVOT[2], armLen: ARM_LEN, scoopDrop: SCOOP_DROP, travel: TRAVEL };
{
  let svg = "";
  for (const [cx, cy, r] of [[-70, 96, 9], [92, 60, 7], [10, -108, 8], [-105, -30, 6], [70, -80, 5]]) svg += fill2(circle2(cx, cy + r * 0.12, r * 0.86, 40), "lm-crater") + loop2(circle2(cx, cy, r, 56), "lo") + loop2(circle2(cx, cy, r * 1.22, 56), "faint");
  // the trench the scoop drags: from the contact frames of the same dig the page plays
  let rMin = Infinity;
  let rMax = -Infinity;
  for (let t = 0; t <= DIG_END; t += 0.02) {
    const s = digAt(t, digOpts);
    if (!s.contact) continue;
    const reach = ARM_LEN + s.ext;
    const rr = len([PIVOT[0], PIVOT[1], 0]) + reach * Math.cos(s.pitch * DEG);
    rMin = Math.min(rMin, rr - 4);
    rMax = Math.max(rMax, rr);
  }
  const trench = (offset) => {
    const t = dir(ARM_DEG + 90);
    const c = (r, s) => [D_ARM[0] * r + t[0] * (s + offset), D_ARM[1] * r + t[1] * (s + offset)];
    return [c(rMin, -1.4), c(rMax, -1.4), c(rMax, 1.4), c(rMin, 1.4)];
  };
  for (const off of [-9, 0, 9]) svg += fill2(trench(off), "lm-void") + loop2(trench(off), "lo");
  // Apollo 12's boot prints, shown in 1969
  let prints = "";
  const walk = [[-118, 40], [-96, 30], [-80, 46], [-64, 40], [-56, 62], [-40, 70], [-30, 88], [-6, 96], [16, 92], [40, 100]];
  walk.forEach(([x, y], i) => {
    const a = i % 2 ? 0.4 : -0.4;
    const pts = Array.from({ length: 20 }, (_, j) => {
      const u = (j / 20) * Math.PI * 2;
      return [x + 2.6 * Math.cos(u) * Math.cos(a) - 1.2 * Math.sin(u) * Math.sin(a), y + 2.6 * Math.cos(u) * Math.sin(a) + 1.2 * Math.sin(u) * Math.cos(a)];
    });
    prints += loop2(pts, "lo");
  });
  svg += `<g class="lm-a12">${prints}</g>`;
  T.plane({ part: ground, o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], svg, fade: [0.02, 0.1] });
  var TRENCH = { rMin, rMax };
}
[[-100, 70, 5, 3, 0.3], [105, -30, 6, 3.5, 1.2], [-40, -110, 4.5, 3, 2.1], [40, 115, 4, 2.5, 0.9], [-110, -70, 4, 2.5, 1.7]].forEach(([cx, cy, r, h, rot], i) => {
  const ring = hull2(Array.from({ length: 6 }, (_, j) => {
    const a = rot + (j / 6) * Math.PI * 2;
    const rr = r * (0.8 + 0.2 * Math.cos(j * 2.3 + rot));
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  }));
  prism(`ground.rock${i}`, UPF(0, 0), ring, 0, h, { tone: "mid", bevel: 0.4 });
});
prism("ground.index", UPF(0, 0), [[DISC_R + 0.02, -2.2], [DISC_R + 6, -0.6], [DISC_R + 6, 0.6], [DISC_R + 0.02, 2.2]], DISC_Z0, DISC_Z0 + 2, { tone: "hi", material: "brass", bevel: 0.3 });

// =====================================================================
// FRAME: a tripod of aluminium tubes, balls at the nodes
// =====================================================================
const B = Object.fromEntries(LEGS.map((deg) => [deg, at(deg, RB, ZB)]));
const Tn = Object.fromEntries(TOPS.map((deg) => [deg, at(deg, RT, ZT)]));
for (const deg of LEGS) ball(`frame.node${deg}`, B[deg], NODE, { tone: "hi", material: "steel" });
for (const deg of TOPS) ball(`frame.node${deg}`, Tn[deg], NODE, { tone: "hi", material: "steel" });
const tube = (name, a, b) => rod(name, a, b, TUBE, { ra: NODE, rb: NODE, extra: { tone: "hi", material: "steel" } });
LEGS.forEach((deg, i) => tube(`frame.bottom${i}`, B[deg], B[LEGS[(i + 1) % 3]]));
TOPS.forEach((deg, i) => tube(`frame.top${i}`, Tn[deg], Tn[TOPS[(i + 1) % 3]]));
for (const deg of TOPS) for (const leg of LEGS) if (Math.abs(((leg - deg + 540) % 360) - 180) === 60) tube(`frame.diag${deg}-${leg}`, Tn[deg], B[leg]);
// the empty retro-rocket mount at the centre, with three radial tubes to it
const RETRO_R = 12;
const plate = round("retro.mount", UPF(0, 0), ZB - 1, ZB + 1, RETRO_R, { tone: "mid", material: "gunmetal" });
T.plane({ part: plate, o: [0, 0, ZB + 1], u: [1, 0, 0], v: [0, 1, 0], svg: loop2(circle2(0, 0, 9, 64), "lo") + Array.from({ length: 12 }, (_, i) => `<circle class="lm-screw" cx="${fmt(10.4 * Math.cos(i * 0.5236))}" cy="${fmt(10.4 * Math.sin(i * 0.5236))}" r="0.45"/>`).join("") });
for (const deg of LEGS) rod(`frame.radial${deg}`, B[deg], [0, 0, ZB], TUBE, { ra: NODE, rb: RETRO_R, extra: { tone: "hi", material: "steel" } });
// mast collar at the top, three tubes to it
round("mast.collar", UPF(0, 0), ZT - 4, ZT + 4, 4, { tone: "mid", material: "steel" });
for (const deg of TOPS) rod(`frame.spoke${deg}`, Tn[deg], [0, 0, ZT], TUBE, { ra: NODE, rb: 4, extra: { tone: "hi", material: "steel" } });

// =====================================================================
// LEGS: hinged at the bottom nodes, a damper sleeve, crushable footpads and blocks
// =====================================================================
for (const deg of LEGS) {
  const pad = at(deg, PAD_R, 0);
  const padF = UPF(pad[0], pad[1]);
  const p = round(`legs.pad${deg}`, padF, 0, 5, [7.6, 9], { tone: "hi" });
  T.plane({ part: p, o: [pad[0], pad[1], 5], u: [1, 0, 0], v: [0, 1, 0], svg: loop2(circle2(0, 0, 6.6, 40), "faint") });
  const knee = [pad[0], pad[1], 5 + 2.6];
  ball(`legs.ankle${deg}`, knee, 2.6, { tone: "hi", material: "steel" });
  const axis = unit(sub(knee, B[deg]));
  const L = len(sub(knee, B[deg]));
  const F = frameOf(B[deg], axis, [0, 0, 1]);
  round(`legs.tube${deg}a`, F, NODE, L * 0.38, 1.6, { tone: "hi", material: "steel" });
  round(`legs.damper${deg}`, F, L * 0.38, L * 0.62, 2.5, { tone: "mid", material: "gunmetal", details: { seams: [L * 0.42, L * 0.58] } });
  round(`legs.tube${deg}b`, F, L * 0.62, L - 2.6, 1.6, { tone: "hi", material: "steel" });

}

// =====================================================================
// PROPULSION: three verniers under the radial tubes, six tanks resting on them
// =====================================================================
for (const deg of LEGS) {
  const c = at(deg, 28, 0);
  const top = ZB - TUBE;
  turnedBox(`verniers.block${deg}`, deg, 25.5, 30.5, -2.5, 2.5, top - 6, top, { tone: "mid" });
  round(`verniers.bell${deg}`, { o: [c[0], c[1], top - 6], a: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] }, 0, 8, [2.2, 4.4], { tone: "hi", material: "chrome" });
  for (const [i, r] of [17.4, 29.2].entries()) ball(`tanks.sphere${deg}${i}`, at(deg, r, ZB + TUBE + 5.5), 5.5, { tone: "hi", material: i ? "chrome" : "steel" });
}

// =====================================================================
// MAST, PLANAR ANTENNA, SOLAR PANEL
// =====================================================================
round("mast.pole", UPF(0, 0), ZT + 4, MAST_TOP - 1.2, 1.8, { tone: "hi", material: "steel", details: { seams: [ZT + 30, ZT + 31.5] } });
const BAR_Z = MAST_TOP;
round("mast.bar", frameOf([-8, 0, BAR_Z], [1, 0, 0], [0, 0, 1]), 0, 16, 1.2, { tone: "mid", material: "steel" });
round("mast.hub+", frameOf([8, 0, BAR_Z], [1, 0, 0], [0, 0, 1]), 0, 2, 2.5, { tone: "mid", material: "gunmetal" });
round("mast.hub-", frameOf([-8, 0, BAR_Z], [-1, 0, 0], [0, 0, 1]), 0, 2, 2.5, { tone: "mid", material: "gunmetal" });
{
  const F = { o: [10, 0, BAR_Z], a: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] };
  const hga = prism("antenna.array", F, [[-17, -17], [17, -17], [17, 17], [-17, 17]], 0, 1.5, { tone: "hi" });
  let svg = loop2([[-15.5, -15.5], [15.5, -15.5], [15.5, 15.5], [-15.5, 15.5]], "faint");
  for (let i = 1; i < 8; i++) svg += line2([[-15.5 + i * 3.875, -15.5], [-15.5 + i * 3.875, 15.5]], "lo") + line2([[-15.5, -15.5 + i * 3.875], [15.5, -15.5 + i * 3.875]], "lo");
  T.plane({ part: hga, o: [11.5, 0, BAR_Z], u: [0, 1, 0], v: [0, 0, -1], normal: [1, 0, 0], svg });
  const Fs = { o: [-10, 0, BAR_Z], a: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] };
  const sol = prism("solar.panel", Fs, [[-12, -18], [12, -18], [12, 18], [-12, 18]], 0, 1.2, { tone: "hi", material: "gunmetal" });
  let cells = fill2([[-11, -17], [11, -17], [11, 17], [-11, 17]], "lm-cells");
  for (let i = 1; i < 8; i++) cells += line2([[-11, -17 + i * 4.25], [11, -17 + i * 4.25]], "lo");
  for (let i = 1; i < 4; i++) cells += line2([[-11 + i * 5.5, -17], [-11 + i * 5.5, 17]], "lo");
  T.plane({ part: sol, o: [-11.2, 0, BAR_Z], u: [0, 1, 0], v: [0, 0, -1], normal: [-1, 0, 0], svg: cells });
}

// =====================================================================
// COMPARTMENTS on outriggers, the camera and the Canopus sensor on top
// =====================================================================
function compartment(name, deg) {
  const mid = mul(dir(deg), RB * Math.cos(60 * DEG));
  const t = dir(deg + 90);
  for (const s of [-7, 7]) {
    const a = add(add(mid, mul(t, s)), mul(dir(deg), TUBE));
    rod(`compartments.out${deg}${s}`, [a[0], a[1], ZB], add([a[0], a[1], ZB], mul(dir(deg), 15)), 0.9, { extra: { tone: "mid", material: "steel" } });
  }
  const r0 = RB * Math.cos(60 * DEG) + 2.2;
  const b = turnedBox(`compartments.${name}`, deg, r0, r0 + 14, -10, 10, ZB + 0.9, ZB + 0.9 + 12, { tone: "hi", bevel: 0.4, details: { seams: [ZB + 4] } });
  // radiator mirrors on the lid
  let svg = "";
  for (let i = 1; i < 5; i++) svg += line2([[-10, -10 + i * 4], [10, -10 + i * 4]], "lo");
  const lidO = [mid[0] + dir(deg)[0] * (r0 + 7 - RB * 0.5), mid[1] + dir(deg)[1] * (r0 + 7 - RB * 0.5), ZB + 12.9];
  T.plane({ part: b, o: [mid[0] + dir(deg)[0] * 9.2, mid[1] + dir(deg)[1] * 9.2, ZB + 12.9], u: t, v: dir(deg), normal: [0, 0, 1], svg: svg.replace(/-10 /g, "-9.95 ").replace(/L10 /g, "L9.95 ") });
  void lidO;
  return { top: ZB + 12.9, centre: mul(dir(deg), r0 + 7) };
}
const compA = compartment("a", 270);
const compB = compartment("b", 30);
box("compartments.canopus", { x: compA.centre[0] - 3, y: compA.centre[1] - 2.5, w: 6, d: 5, r: 0.5 }, compA.top, 4, { tone: "mid", material: "gunmetal" });
{
  const c = compB.centre;
  round("camera.body", UPF(c[0], c[1]), compB.top, compB.top + 13, 3.8, { tone: "hi", material: "steel", details: { seams: [compB.top + 3] } });
  const hood = turnedBox("camera.hood", 30, len([c[0], c[1], 0]) - 4.2, len([c[0], c[1], 0]) + 4.2, -4.2, 4.2, compB.top + 13, compB.top + 19, { tone: "mid", material: "gunmetal", bevel: 0.3 });
  T.plane({ part: hood, o: [c[0] + dir(30)[0] * 4.2, c[1] + dir(30)[1] * 4.2, compB.top + 16], u: dir(120), v: [0, 0, -1], normal: dir(30), svg: fill2([[-3, -2], [3, -2], [3, 2], [-3, 2]], "lm-glass") + loop2([[-3, -2], [3, -2], [3, 2], [-3, 2]], "lo") });
}
// omni antennas on booms from two top nodes
for (const [deg, rise] of [[150, 0.55], [270, 0.75]]) {
  const a = unit(add(dir(deg), [0, 0, rise]));
  const F = frameOf(Tn[deg], a, [0, 0, 1]);
  round(`omni.boom${deg}`, F, NODE, 34, 0.7, { tone: "hi", material: "steel" });
  round(`omni.cone${deg}`, F, 34, 38, [0.9, 2.8], { tone: "hi" });
}

// =====================================================================
// THE SURFACE SAMPLER: a bracket under the frame, a hinged arm, a sliding extension and the scoop
// =====================================================================
{
  const t = E_ARM;
  const rMid = RB * Math.cos(60 * DEG);
  turnedBox("sampler.base", ARM_DEG, rMid - 2, rMid + 5, -4, 4, 28, ZB - TUBE, { tone: "mid", material: "gunmetal" });
  const Pg = on(pitch);
  for (const s of [-1, 1]) round(`sampler.knuckle${s}`, frameOf(add(PIVOT, mul(t, s * 4)), mul(t, s), [0, 0, 1]), 0, 1.5, 2.4, { tone: "mid", material: "steel" }, Pg);
  const armF = (r0, r1, a0, a1, z0, z1, name, g, extra = {}) => {
    const F = { o: [0, 0, 0], a: D_ARM, u: t, v: [0, 0, 1] };
    const o = mul(D_ARM, 0);
    void o;
    return prism(name, F, [[a0, z0], [a1, z0], [a1, z1], [a0, z1]], r0, r1, extra, g);
  };
  const rP = len([PIVOT[0], PIVOT[1], 0]);
  armF(rP + 2.5, rP + 5.6, -5.5, 5.5, 29, 33, "sampler.yoke", Pg, { tone: "mid", material: "steel" });
  armF(rP + 5.6, rP + 27.6, -1.5, 1.5, 29.5, 32.5, "sampler.arm1", Pg, { tone: "hi", material: "steel" });
  const Eg = on(ext);
  armF(rP + 6.6, rP + 28.6, -1.3, 1.3, 32.5, 35, "sampler.arm2", Eg, { tone: "hi", material: "steel" });
  const scoop = armF(rP + 28.6, rP + ARM_LEN, -1.2, 1.2, PIVOT[2] - SCOOP_DROP, 35, "sampler.scoop", Eg, { tone: "hi", material: "chrome" });
  void scoop;
}

// =====================================================================
// BUILD
// =====================================================================
export const poses = () => {
  const out = [];
  for (let d = 0; d < 360; d += 1) out.push(follow({ disc: d }));
  for (let d = 0; d < 360; d += 30) for (let t = 0; t <= DIG_END; t += 0.25) out.push(follow({ disc: d, ...digAt(t, digOpts) }));
  return out;
};
const t0 = Date.now();
const out = T.build({ statics: R.items, poses, strict: !argv.includes("--loose") });
console.log(`turn build ${((Date.now() - t0) / 1000).toFixed(1)} s · ${out.report.parts} parts · trench ${TRENCH.rMin.toFixed(1)}–${TRENCH.rMax.toFixed(1)}`);
if (argv.includes("--audit")) {
  A.settle(R, P);
  A.auditOrExit(R, P);
  TA.orbitOrExit(T, R, P, {
    sweep: { at: (x) => follow({ disc: x }), from: 0, to: 360, frame: 0.5 },
    clips: [{ name: "dig", at: (t) => follow({ disc: 20, ...digAt(t, digOpts) }), from: 0, to: DIG_END, frame: 1 / 30 }],
    quick: argv.includes("--quick"),
    only: argv.find((a) => a.startsWith("--only="))?.slice(7).split(",") ?? null,
  });
}

const layerOf = (name) => R.items.filter((item) => item.layer === name).sort((a, b) => a.key - b.key).map((item) => item.svg);
const backSvg = k.figureSvg({ width: W, height: H, label: TEXT.fr.label, body: [...back, ...layerOf("back")], className: "lm-back" });
const stage = `<div class="lm-stage iso-turn" tabindex="0" role="group" data-year="1967" aria-label="${TEXT.fr.aria3d}">${backSvg}${out.layerSvg("lm", { width: W, height: H })}</div>`;
const DATA = { W, H, P, camera: glCamera(P), turn: out.data, model: MODEL, parts: PARTS, text: TEXT, dig: digOpts, digEnd: DIG_END, pivot: PIVOT, armDeg: ARM_DEG };
const PART_BUTTONS = PARTS.map((part, index) => `<button type="button" class="lm-part" data-part="${part.id}"><span class="lm-num">${String(index + 1).padStart(2, "0")}</span><span data-t="part.${part.id}">${part.fr.name}</span></button>`).join("");
const corners = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 3 · FORBITS · 360°</span><span class="iso-plate-corner" data-corner="title" data-t="title">${TEXT.fr.title}</span><span class="iso-plate-corner" data-corner="readout" data-readout>${TEXT.fr.rest}</span></div>`;
const controls = `<div class="lm-controls"><button type="button" class="lm-fire" data-fire><span class="lm-lamp" aria-hidden="true"></span><span data-fire-label>${TEXT.fr.dig}</span></button><button type="button" class="lm-fire" data-year-button><span data-year-label>${TEXT.fr.year[1967]}</span></button><span class="lm-hint" data-t="hint3d">${TEXT.fr.hint3d}</span><span class="lm-live" aria-live="polite"></span></div>`;
const lang = `<div class="lm-lang" role="group" aria-label="Langue / Language"><button type="button" data-lang="fr" aria-pressed="true">FR</button><button type="button" data-lang="en" aria-pressed="false">EN</button></div>`;
const bodyHtml = `<figure class="iso-figure lm"><div class="iso-plate">${corners}${lang}${stage}${controls}</div><figcaption class="iso-legend"><span class="lm-parts">${PART_BUTTONS}</span><span class="iso-caption" data-t="caption">${TEXT.fr.caption}</span></figcaption></figure>`;
const CSS = out.css + "\n" + readFileSync(join(HERE, "../shared/forbits.css"), "utf8") + "\n" + readFileSync(join(HERE, "../shared/turntable.css"), "utf8") + `
.lm-stage[data-year="1967"] .lm-a12 { display: none; }
.lm-stage[data-year="1969"] [data-name^="camera."], .lm-stage[data-year="1969"] [data-name="sampler.scoop"] { display: none; }`;
const LIVEJS = readFileSync(join(HERE, "live-3d.js"), "utf8").replace("__DATA__", JSON.stringify(DATA)).replace("const digAt = null;", `const digAt = ${digAt.toString()};`);
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:wght@700&display=swap" rel="stylesheet">`;
const page = k.pageHtml({ title: "FORBITS · Surveyor 3 · 360°", theme: THEME, body: `${FONTS}<style>${CSS}</style>${bodyHtml}`, script: kitScript() + turnScript() + glScript() + LIVEJS, width: 1080 }).replace('<html lang="en">', '<html lang="fr">');
const name = THEME === "light" ? "surveyor-3d-light.html" : "surveyor-3d.html";
writeFileSync(join(HERE, "../../pages", name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `turn data ${(JSON.stringify(out.data).length / 1024).toFixed(0)} KB`);
