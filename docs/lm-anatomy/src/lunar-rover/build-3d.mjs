// Apollo 17 Lunar Roving Vehicle on a turntable (anatomy 3D mode).
// World units: 40 per metre. The rover faces +x; it drives round the disc centre at its minimum turning radius,
// both axles steering (double Ackermann). Groups: disc (turntable) → drive (round the centre) → steer×4 → spin×4.
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
const U = MODEL.unitsPerMetre;

const W = 1000;
const H = 640;
const AZIMUTH = 55;
const ELEVATION = 30;
const DISC_R = 178;
const DISC_Z0 = -4;
const PLINTH_R = 194;
const PLINTH_Z0 = -18;
const FOOT_H = 10;

// rover geometry (rover-local: x forward, y left, z up)
const WX = (MODEL.wheelbase * U) / 2; // 45.8
const WR = (MODEL.wheelDiameter * U) / 2; // 16.4
const WW = MODEL.wheelWidth * U; // 9.2
const PIVOT_Y = 28;
const TIRE_Y0 = 33;
const TIRE_Y1 = TIRE_Y0 + WW;
const CH = { x0: -60, x1: 60, y: 18, z0: 20, z1: 23 };
// the drive circle: the outside front wheel runs at the 3.1 m turning radius
const OUT_WC = (TIRE_Y0 + TIRE_Y1) / 2;
const RC = Math.sqrt((MODEL.turningRadius * U) ** 2 - WX ** 2) - OUT_WC;

const fitPts = [];
for (let i = 0; i < 64; i++) {
  const a = (i / 64) * Math.PI * 2;
  fitPts.push([PLINTH_R * Math.cos(a), PLINTH_R * Math.sin(a), PLINTH_Z0 - FOOT_H], [PLINTH_R * Math.cos(a), PLINTH_R * Math.sin(a), 0]);
  fitPts.push([150 * Math.cos(a), 150 * Math.sin(a), 74]);
}
export const P = k.fitProjection(fitPts, W, H, { pad: 30, azimuth: AZIMUTH, elevation: ELEVATION });
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const add = G.add3, sub = G.sub3, mul = G.mul3, unit = G.unit3, dot = G.dot3, cross = G.cross3, len = G.len3;
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
// rover-local → world at rest: the rover's centre sits at (0, −RC)
const L = (x, y, z) => [x, y - RC, z];
const Lp = (plan) => ({ ...plan, y: plan.y - RC });

export const R = A.recorder(P);
export const T = turning(P, { recorder: R });
const disc = T.group("disc", { turn: { pivot: [0, 0] } });
const drive = T.group("drive", { parent: disc, turn: { pivot: [0, 0] } });
const WHEELS = [
  { id: "FL", x: WX, side: 1 },
  { id: "FR", x: WX, side: -1 },
  { id: "RL", x: -WX, side: 1 },
  { id: "RR", x: -WX, side: -1 },
];
for (const w of WHEELS) {
  w.pivot = L(w.x, w.side * PIVOT_Y, 0);
  w.centre = L(w.x, w.side * OUT_WC, WR);
  w.steerG = T.group(`s${w.id}`, { parent: drive, turn: { pivot: [w.pivot[0], w.pivot[1]] } });
  w.spinG = T.group(`w${w.id}`, { parent: w.steerG, hinge: { point: w.centre, axis: [0, 1, 0], range: [-15, 15] } });
  // double Ackermann: every axle points at the disc centre
  const toCentre = RC - w.side * PIVOT_Y; // distance along y from the pivot to the centre's line
  w.steer = (Math.sign(w.x) * Math.atan(Math.abs(w.x) / toCentre)) / DEG;
}
const LIVE = T.layer("lm");
T.stack(["back", "lm", "front"]);
export const follow = (v) => {
  const out = { disc: v.disc ?? 0, drive: v.drive ?? 0 };
  const s = v.steer ?? 0;
  for (const w of WHEELS) {
    out[`s${w.id}`] = s * w.steer;
    const spin = v[`w${w.id}`] ?? 0;
    out[`w${w.id}`] = ((((spin + 15) % 30) + 30) % 30) - 15;
  }
  return out;
};

const on = (group) => ({ group, layer: LIVE });
const Dg = on(drive);
const round = (name, F, s0, s1, r, extra = {}, g = Dg) => T.round({ name, ...g, F, s0, s1, r, tone: "mid", ...extra });
const ball = (name, c, r, extra = {}, g = Dg) => T.ball({ name, ...g, c, r, tone: "mid", ...extra });
const box = (name, plan, z, h, extra = {}, g = Dg) => T.prism({ name, ...g, plan, z, h, steps: extra.steps ?? 2, tone: "hi", ...extra });
const prism = (name, F, polygon, s0, s1, extra = {}, g = Dg) => T.prism({ name, ...g, F, polygon, s0, s1, tone: "hi", ...extra });
function rod(name, a, b, r, { ra = 0, rb = 0, extra = {}, g = Dg } = {}) {
  const axis = unit(sub(b, a));
  return round(name, frameOf(a, axis, Math.abs(axis[2]) > 0.95 ? [1, 0, 0] : [0, 0, 1]), ra, len(sub(b, a)) - rb, r, extra, g);
}

// =====================================================================
// STATIC PLINTH with its ruler bezel
// =====================================================================
const back = [];
const putStatic = (name, svg, shapes, bias = 0, ref = [0, 0, PLINTH_Z0]) => R.put({ name, layer: "back", at: ref, bias, svg, shapes: shapes.map((s) => R.solid(Object.assign(s, { name: s.name ?? name }))) });
back.push(`<path class="iso-halo" d="${k.haloOf({ x: -PLINTH_R, y: -PLINTH_R, w: PLINTH_R * 2, d: PLINTH_R * 2, r: PLINTH_R }, PLINTH_Z0 - FOOT_H, -PLINTH_Z0, P)}"/>`);
Array.from({ length: 8 }, (_, i) => [Math.cos((22.5 + 45 * i) * DEG) * (PLINTH_R - 34), Math.sin((22.5 + 45 * i) * DEG) * (PLINTH_R - 34)]).forEach(([x, y], i) => {
  const svg = S(k.cylinder(x, y, 13, PLINTH_Z0 - FOOT_H, 2.4, P, 32), { tone: "lo" }) + S(k.cylinder(x, y, 9.5, PLINTH_Z0 - FOOT_H + 2.4, FOOT_H - 2.4, P, 32), { tone: "mid" });
  putStatic(`stand.foot${i}`, svg, [A.cylinder(x, y, 13, PLINTH_Z0 - FOOT_H, FOOT_H, { ground: true })], -1000 + k.depthOf([x, y, 0], P) * 0.001, [x, y, PLINTH_Z0 - FOOT_H]);
});
{
  const F0 = UPF(0, 0);
  const count = Math.round((2 * Math.PI * (PLINTH_R - 2.4)) / (U / 4));
  const ticks = k.radialTicks(0, 0, PLINTH_R - 2.4, count, 4, DISC_Z0, [4.2, PLINTH_R - 2.4 - (DISC_R + 3)], P);
  const svg =
    S(G.disc(PLINTH_Z0, PLINTH_Z0 + 6, PLINTH_R, F0, P), { tone: "mid" }) +
    S(G.disc(PLINTH_Z0 + 6, DISC_Z0, PLINTH_R - 1.2, F0, P, { bevel: 1.2 }), { tone: "lo", inner: Ln(G.arcOf(F0, PLINTH_Z0 + 9, PLINTH_R - 1.2, P), { tone: "faint" }) }) +
    `<path class="lm-bezel" fill-rule="evenodd" d="${G.circleOf(F0, DISC_Z0, PLINTH_R - 2.4, P, 180)} ${G.circleOf(F0, DISC_Z0, DISC_R + 3, P, 180)}"/>` +
    Ln(G.circleOf(F0, DISC_Z0, PLINTH_R - 2.4, P, 180) + G.circleOf(F0, DISC_Z0, DISC_R + 3, P, 180), { tone: "lo" }) +
    Ln(ticks.minor, { tone: "lo" }) +
    Ln(ticks.major, { tone: "mid" });
  putStatic("stand.plinth", svg, [A.disc(F0, PLINTH_Z0, DISC_Z0, PLINTH_R, { ground: true })]);
}

// =====================================================================
// THE TURNING DISC: regolith, the double tyre track of the circle the rover drives, rocks
// =====================================================================
const Disc = on(disc);
const ground = round("ground.disc", UPF(0, 0), DISC_Z0, 0, DISC_R, { tone: "lo" }, Disc);
{
  let svg = "";
  for (const [cx, cy, r] of [[-118, 100, 9], [125, 92, 8], [8, 160, 6], [-150, -40, 7], [140, -80, 8], [-50, -155, 7], [0, 0, 9]]) svg += fill2(circle2(cx, cy + r * 0.12, r * 0.86, 40), "lm-crater") + loop2(circle2(cx, cy, r, 56), "lo") + loop2(circle2(cx, cy, r * 1.22, 56), "faint");
  // the tracks: each wheel's path is a ring; its chevron tread shows as a band of faint rings
  const radii = new Set();
  for (const w of WHEELS) {
    const steered = w.side > 0 ? RC - OUT_WC : RC + OUT_WC;
    radii.add(Math.round(Math.hypot(w.x, steered) * 10) / 10);
  }
  for (const r of radii) for (const dr of [-WW / 2, WW / 2]) svg += loop2(circle2(0, 0, r + dr, 160), "faint");
  T.plane({ part: ground, o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], svg, fade: [0.02, 0.1] });
}
[[-110, 125, 5, 3, 0.3], [112, -118, 6, 3.5, 1.2], [-160, 15, 4.5, 3, 2.1], [55, 155, 4, 2.5, 0.9], [160, 30, 4, 2.5, 1.7], [-75, -148, 5, 3, 0.4], [14, -12, 3, 2, 1]].forEach(([cx, cy, r, h, rot], i) => {
  const ring = hull2(Array.from({ length: 6 }, (_, j) => {
    const a = rot + (j / 6) * Math.PI * 2;
    const rr = r * (0.8 + 0.2 * Math.cos(j * 2.3 + rot));
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  }));
  prism(`ground.rock${i}`, UPF(0, 0), ring, 0, h, { tone: "mid", bevel: 0.4 }, Disc);
});
{
  const ring = [[DISC_R + 0.02, -2.2], [DISC_R + 6, -0.6], [DISC_R + 6, 0.6], [DISC_R + 0.02, 2.2]];
  prism("ground.index", UPF(0, 0), ring, DISC_Z0, DISC_Z0 + 2, { tone: "hi", material: "brass", bevel: 0.3 }, Disc);
}

// =====================================================================
// CHASSIS: three folding sections, the floor, brackets
// =====================================================================
for (const [i, [x0, x1]] of [[CH.x0, -32], [-32, 32], [32, CH.x1]].entries()) {
  const part = box(`chassis.section${i}`, Lp({ x: x0 + (i ? 0.05 : 0), y: -CH.y, w: x1 - x0 - (i === 1 ? 0.1 : 0.05), d: 2 * CH.y, r: 1.2 }), CH.z0, CH.z1 - CH.z0, { tone: "hi", material: "steel", bevel: 0.4, details: { seams: [CH.z0 + 1.4] } });
  let svg = "";
  for (let x = x0 + 6; x < x1 - 3; x += 8) svg += line2([[x, -(-CH.y - RC)], [x, -(CH.y - RC)]], "faint");
  svg += [[x0 + 2.5, -CH.y + 2.5], [x1 - 2.5, -CH.y + 2.5], [x0 + 2.5, CH.y - 2.5], [x1 - 2.5, CH.y - 2.5]].map(([x, y]) => `<circle class="lm-screw" cx="${fmt(x)}" cy="${fmt(-(y - RC))}" r="0.45"/>`).join("");
  T.plane({ part, o: [0, 0, CH.z1], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1], svg });
}
// hinge knuckles where the sections fold
for (const x of [-32, 32]) for (const s of [-1, 1]) round(`chassis.hinge${x}${s}`, frameOf(L(x, s * (CH.y - 6), CH.z1 + 1.1), [0, 1, 0], [0, 0, 1]), -3, 3, 1.1, { tone: "mid" });

// =====================================================================
// SUSPENSION and STEERING, per wheel
// =====================================================================
for (const w of WHEELS) {
  const { x, side } = w;
  const yIn = side * CH.y;
  const p = (yy, z) => L(x, yy, z);
  // brackets on the chassis side (upper on top, lower hanging below)
  box(`suspension.bracket-up${w.id}`, Lp({ x: x - 3, y: side > 0 ? CH.y - 4 : -CH.y, w: 6, d: 4, r: 0.4 }), CH.z1, 5, { tone: "mid" });
  box(`suspension.bracket-lo${w.id}`, Lp({ x: x - 3, y: side > 0 ? CH.y - 4 : -CH.y, w: 6, d: 4, r: 0.4 }), 7, CH.z0 - 7, { tone: "mid" });
  // the bosses that carry the kingpin
  round(`suspension.boss-up${w.id}`, UPF(w.pivot[0], w.pivot[1]), 24, 27.6, 3, { tone: "mid", material: "steel" });
  round(`suspension.boss-lo${w.id}`, UPF(w.pivot[0], w.pivot[1]), 6.4, 9.4, 3, { tone: "mid", material: "steel" });
  // arms: from the bracket faces to the bosses (tangent to the boss)
  round(`suspension.arm-up${w.id}`, frameOf(p(yIn, 25.8), [0, side, 0], [0, 0, 1]), 0, PIVOT_Y - CH.y - 3, 1.3, { tone: "hi" });
  round(`suspension.arm-lo${w.id}`, frameOf(p(yIn, 8.2), [0, side, 0], [0, 0, 1]), 0, PIVOT_Y - CH.y - 3, 1.3, { tone: "hi" });
  // torsion bar along the chassis side
  round(`suspension.torsion${w.id}`, frameOf(p(side * (CH.y - 2), 18.6), [Math.sign(x) * -1, 0, 0], [0, 0, 1]), 3, 18, 0.9, { tone: "mid" });
  // steering: kingpin and the traction-drive housing (the motor) on the steer group
  const Sg = on(w.steerG);
  round(`steer.kingpin${w.id}`, UPF(w.pivot[0], w.pivot[1]), 9.4, 24, 2.2, { tone: "hi", material: "steel" }, Sg);
  round(`motors.drive${w.id}`, frameOf(p(side * (PIVOT_Y + 2.2), WR), [0, side, 0], [0, 0, 1]), 0, TIRE_Y0 - PIVOT_Y - 2.2, 6.5, { tone: "mid", material: "gunmetal", details: { seams: [1.2] } }, Sg);
  // the wheel: wire-mesh tyre with titanium chevrons, hub cap with spokes, on its spin hinge
  const Wg = on(w.spinG);
  const tireF = frameOf(p(side * TIRE_Y0, WR), [0, side, 0], [0, 0, 1]);
  const tire = round(`wheels.tyre${w.id}`, tireF, 0, WW, WR, { tone: "hi", material: "steel", details: { ribs: { s0: 0.6, s1: WW - 0.6, count: 24, seams: true, tone: "lo", fade: [0.1, 0.55] } } }, Wg);
  void tire;
  const cap = round(`wheels.hub${w.id}`, tireF, WW, WW + 0.8, 6, { tone: "mid" }, Wg);
  let spokes = loop2(circle2(0, 0, WR - 1.4, 64), "lo") + loop2(circle2(0, 0, 6, 40), "lo");
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    spokes += line2([[6 * Math.cos(a), 6 * Math.sin(a)], [(WR - 1.4) * Math.cos(a + 0.12), (WR - 1.4) * Math.sin(a + 0.12)]], "faint");
  }
  T.plane({ part: tire, o: G.pointOf(tireF, WW, 0, 0), u: tireF.u, v: tireF.v, normal: tireF.a, svg: spokes });
  T.plane({ part: cap, o: G.pointOf(tireF, WW + 0.8, 0, 0), u: tireF.u, v: tireF.v, normal: tireF.a, svg: [0, 1, 2, 3, 4, 5].map((i) => `<circle class="lm-screw" cx="${fmt(3.6 * Math.cos(i * 1.047))}" cy="${fmt(3.6 * Math.sin(i * 1.047))}" r="0.45"/>`).join("") });
  // fender over the wheel's swept circle, its bracket and nose
  const yA = side > 0 ? TIRE_Y0 - 3 : -(TIRE_Y1 + 3);
  const sx = Math.sign(x);
  const inner = x - sx * 26;
  const outer = x + sx * 24;
  box(`fenders.top${w.id}`, Lp({ x: Math.min(inner, outer), y: yA, w: 50, d: WW + 6, r: 1 }), 35, 1.2, { tone: "hi", bevel: 0.3 });
  box(`fenders.bracket${w.id}`, Lp({ x: inner - (sx > 0 ? 1 : 3), y: side > 0 ? CH.y - 4 : -(TIRE_Y0 - 3), w: 4, d: TIRE_Y0 - 3 - CH.y + 4, r: 0.4 }), CH.z1, 35 - CH.z1, { tone: "mid" });
  if (w.id !== "RR") prism(`fenders.nose${w.id}`, { o: L(outer, yA, 0), a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] }, [[0, 35], [0, 36.2], [sx * 8, 30], [sx * 8, 28.8]], 0, WW + 6, { tone: "hi" });
}
// Apollo 17's repair: four laminated maps clamped onto the right-rear fender
{
  const w = WHEELS.find((q) => q.id === "RR");
  const F = { o: L(w.x - 24, -(TIRE_Y1 + 3), 0), a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] };
  const map = prism("fenders.maps", F, [[0, 35], [0, 35.8], [-14, 30.8], [-14, 30]], 0, WW + 6, { tone: "hi", material: "brass" });
  let svg = "";
  for (const t of [0.33, 0.66]) svg += line2([[0, -(WW + 6) * t], [-14.5, -(WW + 6) * t]], "lo");
  T.plane({ part: map, o: L(w.x - 24, -(TIRE_Y1 + 3), 35.85), u: [-0.94, 0, -0.34], v: [0, -1, 0], normal: unit([-0.34, 0, 0.94]), svg: svg.replace(/-14\.5/g, "15") });
  for (const yy of [-(TIRE_Y1 + 1.5), -(TIRE_Y0 - 1.5) - 3]) box(`fenders.clamp${Math.round(yy)}`, Lp({ x: w.x - 23.6, y: yy, w: 3, d: 3, r: 0.3 }), 36.2, 1.4, { tone: "mid" });
}

// =====================================================================
// SEATS, CONSOLE, HAND CONTROLLER, FOOTRESTS
// =====================================================================
for (const s of [-1, 1]) {
  const y0 = s > 0 ? 3 : -18;
  const pan = box(`seats.pan${s}`, Lp({ x: -14, y: y0, w: 20, d: 15, r: 1 }), 28, 1.4, { tone: "hi" });
  let web = "";
  for (let i = 1; i < 5; i++) web += line2([[-14 + i * 4, -(y0 - RC)], [-14 + i * 4, -(y0 + 15 - RC)]], "lo");
  for (let j = 1; j < 3; j++) web += line2([[-14, -(y0 + j * 5 - RC)], [6, -(y0 + j * 5 - RC)]], "lo");
  T.plane({ part: pan, o: [0, 0, 29.4], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1], svg: web });
  for (const [xx, yy] of [[-12.5, y0 + 1.5], [4.5, y0 + 1.5], [-12.5, y0 + 13.5], [4.5, y0 + 13.5]]) round(`seats.leg${s}${xx}${yy}`, UPF(...L(xx, yy, 0).slice(0, 2)), CH.z1, 28, 0.8, { tone: "mid" });
  // backrest, tilted back 14°
  const tilt = 14 * DEG;
  const up = [-Math.sin(tilt), 0, Math.cos(tilt)];
  const F = { o: L(-14, 0, 29.4), a: [Math.cos(tilt), 0, Math.sin(tilt)], u: [0, 1, 0], v: up };
  const backrest = prism(`seats.back${s}`, F, [[y0 - 0.0, 0], [y0 + 15, 0], [y0 + 15, 17], [y0, 17]].map(([yy, vv]) => [yy, vv]), -1.4, 0, { tone: "hi" });
  let bw = "";
  for (let i = 1; i < 4; i++) bw += line2([[y0 + i * 3.75, -1], [y0 + i * 3.75, -16]], "lo");
  bw += line2([[y0, -8.5], [y0 + 15, -8.5]], "lo");
  T.plane({ part: backrest, o: add(L(-14, 0, 29.4), mul(F.a, 0)), u: [0, 1, 0], v: mul(up, -1), normal: F.a, svg: bw.replace(/M(-?[0-9.]+) /g, (m, a) => `M${fmt(Number(a) - RC * 0)} `) });
}
// hand controller: a T-handle on a post between the seats
round("console.post", UPF(...L(12, 0, 0).slice(0, 2)), CH.z1, 31, 1.1, { tone: "mid" });
round("console.handle", frameOf(L(12, -4.5, 31.9), [0, 1, 0], [0, 0, 1]), 0, 9, 0.9, { tone: "hi", material: "gunmetal" });
// the console on its pedestal, tilted toward the crew
{
  round("console.pedestal", UPF(...L(26, 0, 0).slice(0, 2)), CH.z1, 40, 1.6, { tone: "mid" });
  const tilt = 50 * DEG;
  const n = [-Math.sin(tilt), 0, Math.cos(tilt)];
  const F = { o: add(L(26, 0, 40), mul(n, 1.3)), a: n, u: [0, 1, 0], v: [Math.cos(tilt), 0, Math.sin(tilt)] };
  const panel = prism("console.panel", F, [[-11, -3], [11, -3], [11, 9], [-11, 9]], 0, 2.4, { tone: "mid", material: "gunmetal" });
  let svg = loop2([[-9.5, -1.5], [9.5, -1.5], [9.5, 7.5], [-9.5, 7.5]], "faint");
  for (const [cx, cy, r] of [[-6, 2, 2.4], [0, 2, 2.4], [6, 2, 2.4]]) svg += loop2(circle2(cx, -cy, r, 32), "lo") + line2([[cx, -cy], [cx + r * 0.8, -cy - r * 0.5]], "hi", ' data-free="end"');
  for (let i = 0; i < 6; i++) svg += `<circle class="lm-lamp-dot" cx="${fmt(-7.5 + i * 3)}" cy="${fmt(-6.2)}" r="0.55"/>`;
  T.plane({ part: panel, o: add(F.o, mul(n, 2.4)), u: [0, -1, 0], v: mul(F.v, -1), normal: n, svg });
}
for (const s of [-1, 1]) {
  const F = { o: L(15, 0, 0), a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] };
  prism(`seats.footrest${s}`, F, [[0, CH.z1], [6, CH.z1], [6, CH.z1 + 4]], s > 0 ? 5 : -13, s > 0 ? 13 : -5, { tone: "mid" });
}

// =====================================================================
// FORWARD: batteries, LCRU, antennas, TV camera
// =====================================================================
for (const s of [-1, 1]) {
  const plan = { x: 34, y: s > 0 ? 3 : -13, w: 14, d: 10, r: 0.8 };
  const b = box(`batteries.case${s}`, Lp(plan), CH.z1, 9, { tone: "hi", bevel: 0.4, details: { seams: [CH.z1 + 2] } });
  T.plane({ part: b, o: [0, 0, CH.z1 + 9], u: [1, 0, 0], v: [0, -1, 0], normal: [0, 0, 1], svg: loop2([[plan.x + 1.5, -(plan.y + 1.5 - RC)], [plan.x + plan.w - 1.5, -(plan.y + 1.5 - RC)], [plan.x + plan.w - 1.5, -(plan.y + plan.d - 1.5 - RC)], [plan.x + 1.5, -(plan.y + plan.d - 1.5 - RC)]], "lo") + line2([[plan.x + plan.w / 2, -(plan.y + 1.5 - RC)], [plan.x + plan.w / 2, -(plan.y + plan.d - 1.5 - RC)]], "faint") });
}
const lcru = box("comms.lcru", Lp({ x: 50, y: -8, w: 9, d: 16, r: 0.8 }), CH.z1, 12, { tone: "hi", material: "gold", bevel: 0.4 });
void lcru;
// high-gain umbrella antenna on its mast
{
  const base = L(55, 13, 0);
  round("comms.hga-mast", UPF(base[0], base[1]), CH.z1, 62, 1.1, { tone: "mid" });
  const top = L(55, 13, 62 + 2.2);
  ball("comms.hga-gimbal", top, 2.2, { tone: "mid" });
  const a = unit([-0.35, 0.25, 0.9]);
  const F = frameOf(add(top, mul(a, 2.2)), a, [0, 0, 1]);
  const dish = round("comms.hga-dish", F, 0, 7, [1.6, 18], { tone: "hi", material: "chrome" });
  let ribs = loop2(circle2(0, 0, 17.6, 72), "lo");
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2;
    ribs += line2([[1.6 * Math.cos(t), 1.6 * Math.sin(t)], [17.6 * Math.cos(t), 17.6 * Math.sin(t)]], "lo");
  }
  T.plane({ part: dish, o: G.pointOf(F, 7, 0, 0), u: F.u, v: F.v, normal: a, svg: ribs + loop2(circle2(0, 0, 1.6, 16), "lo") });
  round("comms.hga-feed", F, 7, 13, 0.5, { tone: "hi" });
  ball("comms.hga-horn", G.pointOf(F, 14, 0, 0), 1, { tone: "hi" });
}
// low-gain helical antenna
{
  const base = L(55, -13, 0);
  round("comms.lga-mast", UPF(base[0], base[1]), CH.z1, 50, 1.1, { tone: "mid" });
  round("comms.lga-helix", UPF(base[0], base[1]), 50, 64, 1.9, { tone: "hi", details: { ribs: { s0: 50.6, s1: 63.4, count: 22, twist: 3, seams: true, tone: "lo" } } });
}
// TV camera (GCTA) on its mast between the batteries
{
  const base = L(41, 0, 0);
  round("camera.mast", UPF(base[0], base[1]), CH.z1, 44, 1.2, { tone: "mid" });
  const g = L(41, 0, 46);
  ball("camera.gimbal", g, 2, { tone: "mid" });
  const cam = box("camera.body", Lp({ x: 36, y: -4, w: 10, d: 8, r: 0.8 }), 48, 7, { tone: "hi", material: "gold", bevel: 0.4 });
  void cam;
  const lensF = frameOf(L(46, 0, 51.5), [1, 0, 0], [0, 0, 1]);
  const lens = round("camera.lens", lensF, 0, 4, 2.4, { tone: "mid", material: "gunmetal" });
  T.plane({ part: lens, o: G.pointOf(lensF, 4, 0, 0), u: lensF.u, v: lensF.v, normal: [1, 0, 0], svg: fill2(circle2(0, 0, 1.5, 24), "lm-glass") });
}

// =====================================================================
// AFT: tool pallet, tongs and rake, sample bags
// =====================================================================
{
  const plan = { x: -60, y: -18, w: 10, d: 36, r: 0.4 };
  const pallet = box("pallet.carrier", Lp(plan), CH.z1, 18, { tone: "hi", material: "steel", bevel: 0.4, details: { seams: [CH.z1 + 9] } });
  T.plane({ part: pallet, o: [-60, 0, 0], u: [0, -1, 0], v: [0, 0, -1], normal: [-1, 0, 0], svg: [-12, 0, 12].map((y) => loop2([[-(y - RC) - 4, -(CH.z1 + 2)], [-(y - RC) + 4, -(CH.z1 + 2)], [-(y - RC) + 4, -(CH.z1 + 7)], [-(y - RC) - 4, -(CH.z1 + 7)]], "lo")).join("") });
  for (const [i, y] of [-12, -6, 6].entries()) round(`pallet.tool${i}`, UPF(...L(-55, y, 0).slice(0, 2)), CH.z1 + 18, CH.z1 + 18 + 16 + i * 3, 0.7, { tone: "hi" });
  box("pallet.rake", Lp({ x: -57.5, y: 9, w: 5, d: 8, r: 0.4 }), CH.z1 + 18, 1.6, { tone: "mid" });
  round("pallet.rake-handle", UPF(...L(-55, 13, 0).slice(0, 2)), CH.z1 + 19.6, CH.z1 + 40, 0.7, { tone: "hi" });
  for (const [i, y] of [-10, 5].entries()) box(`pallet.bag${i}`, Lp({ x: -46, y, w: 6, d: 5, r: 0.8 }), CH.z1, 5, { tone: "hi", material: "chrome" });
}

// =====================================================================
// BUILD
// =====================================================================
export const poses = () => {
  const out = [];
  for (let d = 0; d < 360; d += 1) out.push(follow({ disc: d, drive: 0, steer: 0 }));
  for (let d = 0; d < 360; d += 20) for (const dr of [0, 40, 95, 170, 250, 320]) for (const st of [0, 0.5, 1]) for (const sp of [-14, -5, 5, 14]) out.push(follow({ disc: d, drive: dr, steer: st, wFL: sp, wFR: -sp, wRL: sp * 0.7, wRR: sp }));
  return out;
};
const t0 = Date.now();
const out = T.build({ statics: R.items, poses, strict: !argv.includes("--loose") });
console.log(`turn build ${((Date.now() - t0) / 1000).toFixed(1)} s · ${out.report.parts} parts · RC ${RC.toFixed(1)} · steer ${WHEELS.map((w) => `${w.id} ${w.steer.toFixed(1)}°`).join(" ")}`);
if (argv.includes("--audit")) {
  A.settle(R, P);
  A.auditOrExit(R, P);
  TA.orbitOrExit(T, R, P, {
    sweep: { at: (x) => follow({ disc: x, drive: 0, steer: 0 }), from: 0, to: 360, frame: 0.5 },
    clips: [{ name: "drive", at: (t) => follow({ disc: 30, drive: 72 * t, steer: Math.min(1, t), wFL: 300 * t, wFR: 500 * t, wRL: 300 * t, wRR: 500 * t }), from: 0, to: 5, frame: 1 / 30 }],
    quick: argv.includes("--quick"),
    only: argv.find((a) => a.startsWith("--only="))?.slice(7).split(",") ?? null,
  });
}

const layerOf = (name) => R.items.filter((item) => item.layer === name).sort((a, b) => a.key - b.key).map((item) => item.svg);
const backSvg = k.figureSvg({ width: W, height: H, label: TEXT.fr.label, body: [...back, ...layerOf("back")], className: "lm-back" });
const stage = `<div class="lm-stage iso-turn" tabindex="0" role="group" aria-label="${TEXT.fr.aria3d}">${backSvg}${out.layerSvg("lm", { width: W, height: H })}</div>`;
// per-wheel: distance from the turning centre once steered, for each wheel's own spin rate
const wheelData = WHEELS.map((w) => {
  const off = mul([0, w.side * (OUT_WC - PIVOT_Y), 0], 1);
  const a = w.steer * DEG;
  const c = [w.pivot[0] + Math.cos(a) * off[0] - Math.sin(a) * off[1], w.pivot[1] + Math.sin(a) * off[0] + Math.cos(a) * off[1]];
  return { id: w.id, steer: w.steer, dist: Math.hypot(c[0], c[1]), side: w.side };
});
const DATA = { W, H, P, camera: glCamera(P), turn: out.data, model: MODEL, parts: PARTS, text: TEXT, rc: RC, wheels: wheelData, wheelR: WR };
const PART_BUTTONS = PARTS.map((part, index) => `<button type="button" class="lm-part" data-part="${part.id}"><span class="lm-num">${String(index + 1).padStart(2, "0")}</span><span data-t="part.${part.id}">${part.fr.name}</span></button>`).join("");
const corners = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 2 · FORBITS · 360°</span><span class="iso-plate-corner" data-corner="title" data-t="title">${TEXT.fr.title}</span><span class="iso-plate-corner" data-corner="readout" data-readout>${TEXT.fr.rest}</span></div>`;
const controls = `<div class="lm-controls"><button type="button" class="lm-fire" data-fire><span class="lm-lamp" aria-hidden="true"></span><span data-fire-label>${TEXT.fr.drive}</span></button><span class="lm-hint" data-t="hint3d">${TEXT.fr.hint3d}</span><span class="lm-live" aria-live="polite"></span></div>`;
const lang = `<div class="lm-lang" role="group" aria-label="Langue / Language"><button type="button" data-lang="fr" aria-pressed="true">FR</button><button type="button" data-lang="en" aria-pressed="false">EN</button></div>`;
const bodyHtml = `<figure class="iso-figure lm"><div class="iso-plate">${corners}${lang}${stage}${controls}</div><figcaption class="iso-legend"><span class="lm-parts">${PART_BUTTONS}</span><span class="iso-caption" data-t="caption">${TEXT.fr.caption}</span></figcaption></figure>`;
const CSS = out.css + "\n" + readFileSync(join(HERE, "../shared/forbits.css"), "utf8") + "\n" + readFileSync(join(HERE, "../shared/turntable.css"), "utf8");
const LIVEJS = readFileSync(join(HERE, "live-3d.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:wght@700&display=swap" rel="stylesheet">`;
const page = k.pageHtml({ title: "FORBITS · Rover lunaire LRV · 360°", theme: THEME, body: `${FONTS}<style>${CSS}</style>${bodyHtml}`, script: kitScript() + turnScript() + glScript() + LIVEJS, width: 1080 }).replace('<html lang="en">', '<html lang="fr">');
const name = THEME === "light" ? "lunar-rover-3d-light.html" : "lunar-rover-3d.html";
writeFileSync(join(HERE, "../../pages", name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `turn data ${(JSON.stringify(out.data).length / 1024).toFixed(0)} KB`);
