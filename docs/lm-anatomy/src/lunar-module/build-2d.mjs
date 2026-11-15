// Apollo Lunar Module "Eagle" at Tranquility Base, an anatomy figure for FORBITS.
// World units: 40 per metre. x and y on the regolith, z up. The LM faces +y (hatch, porch, ladder).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";
import * as A from "../../kit/audit.mjs";
import { glCamera } from "../../kit/gl.mjs";
import { kitScript, glScript } from "../../scripts/inline-kit.mjs";
import { MODEL, PARTS, TEXT } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const DEG = Math.PI / 180;
const M = MODEL.unitsPerMetre;

const W = 1000;
const H = 720;
const AZIMUTH = 55;
const ELEVATION = 30;

// ---------- world plan (units) ----------
const GROUND_R = 252;
const PLINTH_H = 16;
const FOOT_H = 10;
const DECK_Z = 126; // descent stage top deck
const BODY_Z = 58; // descent stage bottom
const BAND_Z = 117; // black blanket band starts
const APOTHEM = 84.5; // 4.22 m across flats / 2
const CIRCUM = APOTHEM / Math.cos(22.5 * DEG);
const PAD_R = 188; // footpad centre radius (9.4 m across)
const LIFT = [0, 0, 180];

const LEGS = [0, 90, 180, 270];
const FRONT = 90;

const ringPts = [];
for (let i = 0; i < 64; i++) {
  const a = (i / 64) * Math.PI * 2;
  ringPts.push([GROUND_R * Math.cos(a), GROUND_R * Math.sin(a), -PLINTH_H - FOOT_H], [GROUND_R * Math.cos(a), GROUND_R * Math.sin(a), 0]);
}
const P = k.fitProjection([...ringPts, [0, -17, 262], [-74, -14, 262], [-40, 64, 250], [26, -30, 268]], W, H, { pad: 34, azimuth: AZIMUTH, elevation: ELEVATION });
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const poly3 = (points, closed = false) => k.pathOf(points.map(at), closed);
const facing = (n) => G.dot3(G.unit3(n), V);
const dir = (deg) => [Math.cos(deg * DEG), Math.sin(deg * DEG), 0];
const add = G.add3, sub = G.sub3, mul = G.mul3, unit = G.unit3, dot = G.dot3, cross = G.cross3, len = G.len3;
const UPF = (x, y, z) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);

// ---------- pieces ----------
const PIECES = {};
for (const part of PARTS) PIECES[part.id] = { ...part, move: part.rides === "ascent" ? LIFT : [0, 0, 0], ride: part.rides === "ascent" ? "ascent" : part.id };
PIECES.stand = { id: "stand", move: [0, 0, 0], ride: "stand" };

const SPRING = { stagger: 0.035, stiffness: 64, damping: 14.2, substeps: 4 };
const R = A.recorder(P, { order: ["ascent"], spring: SPRING });
const record = R.solid;
const back = []; // the plinth, drawn before every sorted item

function put(piece, ref, svg, { bias = 0, shapes = [], name, route, chunk, clip } = {}) {
  const p = PIECES[piece];
  return R.put({ piece, ride: p.ride, at: ref, bias, svg, move: p.move, shapes, name: name ?? R.nameFor(`${piece}.item`), route, chunk, clip });
}
function tag(name, owner) {
  return { name: R.nameFor(name), ...(owner ? { owner } : {}) };
}

// ---------- drawing helpers that record their true shape ----------
function turned(piece, F, profile, style = {}, { extra = "", inner = "", bias = 0, bevel = 0, name, owner, smooth, steps, rims } = {}) {
  const soft = smooth ?? profile.some((p) => p[2]);
  const paths = G.solidOf(profile, F, P, { bevel, smooth: soft === true ? { rows: 3 } : soft, ...(steps ? { steps } : {}), ...(rims ? { rims } : {}) });
  const id = R.nameFor(name ?? `${piece}.turned`);
  const shape = record(A.solid(F, profile, { name: id, owner, curve: soft && !soft.slope ? profile : undefined }));
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  return put(piece, add(F.o, mul(F.a, mid)), S(paths, { tone: "hi", ...style, inner }) + extra, { bias, name: id, shapes: [shape] });
}
function discAt(piece, F, s0, s1, r, style = {}, { extra = "", inner = "", bias = 0, bevel = 0, name, owner } = {}) {
  const id = R.nameFor(name ?? `${piece}.disc`);
  return put(piece, add(F.o, mul(F.a, (s0 + s1) / 2)), S(G.disc(s0, s1, r, F, P, { bevel }), { tone: "hi", ...style, inner }) + extra, { bias, name: id, shapes: [record(A.disc(F, s0, s1, r, { name: id, owner }))] });
}
function ballAt(piece, c, r, style = {}, { bias = 0, name, owner } = {}) {
  const id = R.nameFor(name ?? `${piece}.ball`);
  return put(piece, c, S(G.sphereOf(c, r, P, { steps: G.stepsFor(r, 24) }), { tone: "mid", ...style }), { bias, name: id, shapes: [record(A.ball(c, r, { name: id, owner }))] });
}
function boxAt(piece, plan, z, h, style = {}, { extra = "", inner = "", bias = 0, bevel = 0.4, steps = 3, name, owner } = {}) {
  const id = R.nameFor(name ?? `${piece}.box`);
  const shape = plan.r > 0.6 ? A.slab(plan, z, h, { name: id, owner }, steps) : A.box([plan.x, plan.y, z], [plan.x + plan.w, plan.y + plan.d, z + h], { name: id, owner });
  return put(piece, [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], S(k.slabOf(plan, z, h, P, steps, bevel), { tone: "hi", ...style, inner }) + extra, { bias, name: id, shapes: [record(shape)] });
}
function prismAt(piece, F, polygon, s0, s1, style = {}, { extra = "", inner = "", bias = 0, name, owner, wrap } = {}) {
  const id = R.nameFor(name ?? `${piece}.prism`);
  const cx = polygon.reduce((a, p) => a + p[0], 0) / polygon.length;
  const cy = polygon.reduce((a, p) => a + p[1], 0) / polygon.length;
  const centre = add(add(F.o, mul(F.a, (s0 + s1) / 2)), add(mul(F.u, cx), mul(F.v, cy)));
  const art = S(G.prismOf(F, polygon, s0, s1, P), { tone: "hi", ...style, inner }) + extra;
  return put(piece, centre, wrap ? `<g class="${wrap}">${art}</g>` : art, { bias, name: id, shapes: [record(A.prism(F, polygon, s0, s1, { name: id, owner }))] });
}
function extrudeAt(piece, ring, z, h, style = {}, { extra = "", inner = "", bias = 0, bevel = 0, name, owner } = {}) {
  const id = R.nameFor(name ?? `${piece}.extrude`);
  const cx = ring.reduce((a, p) => a + p[0], 0) / ring.length;
  const cy = ring.reduce((a, p) => a + p[1], 0) / ring.length;
  return put(piece, [cx, cy, z + h / 2], S(k.extrude(ring, z, h, P, { bevel }), { tone: "hi", ...style, inner }) + extra, { bias, name: id, shapes: [record(A.extruded(ring, z, h, { name: id, owner }))] });
}
// A rod from one ball to another, its rims landing on both spheres.
function rod(piece, a, b, r, { ra = 0, rb = 0, style = {}, name, owner, bias = 0, inner } = {}) {
  const axis = unit(sub(b, a));
  const L = len(sub(b, a));
  const F = G.frameAlong(a, axis);
  const s0 = ra ? Math.sqrt(Math.max(ra * ra - r * r, 0)) : 0;
  const s1 = rb ? L - Math.sqrt(Math.max(rb * rb - r * r, 0)) : L;
  return discAt(piece, F, s0, s1, r, { tone: "mid", ...style }, { name, owner, bias, inner: inner ? inner(F, s0, s1) : "" });
}
// Visible facet seams of a prism at one station s (only the sides that face the viewer).
function prismSeam(F, polygon, s) {
  const n = polygon.length;
  const out = [];
  for (let j = 0; j < n; j++) {
    const [x0, y0] = polygon[j];
    const [x1, y1] = polygon[(j + 1) % n];
    const normal = unit(add(mul(F.u, y1 - y0), mul(F.v, -(x1 - x0))));
    if (dot(normal, V) > 0.04) out.push(poly3([add(add(F.o, mul(F.a, s)), add(mul(F.u, x0), mul(F.v, y0))), add(add(F.o, mul(F.a, s)), add(mul(F.u, x1), mul(F.v, y1)))]));
  }
  return out.join("");
}
// Orient a convex polygon so prismOf's outward normals are right (counter-clockwise in u,v).
const ccw = (poly) => {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    area += x0 * y1 - x1 * y0;
  }
  return area > 0 ? poly : [...poly].reverse();
};
const octagon = (apothem, z = 0) => Array.from({ length: 8 }, (_, i) => {
  const a = (22.5 + 45 * i) * DEG;
  const r = apothem / Math.cos(22.5 * DEG);
  return [r * Math.cos(a), r * Math.sin(a)];
});
const tubes = [];
function tubeItems(piece, route, r, { name, tone = "mid", bias = 0, maxLength = 18, spacing = 0.8, gaps = [], caps = true, limp = false, touch, rims, free } = {}) {
  const id = R.nameFor(name ?? `${piece}.tube`);
  const p = PIECES[piece];
  R.route(id, route, r, { owner: id, touch, limp, gaps, rims, free, piece, move: p.move, ride: p.ride });
  tubePieces(route, r, P, { maxLength, spacing, gaps, caps }).forEach((part, index) => put(piece, part.mid, tubeSvg(part, { tone }), { bias, name: `${id}:${index}`, route: id, chunk: index, shapes: [A.tube(part.points, part.radii)] }));
  return id;
}

// =====================================================================
// PLINTH: a round museum base of regolith on eight feet
// =====================================================================
const GROUND = UPF(0, 0, 0);
back.push(`<path class="iso-halo" d="${k.haloOf({ x: -GROUND_R, y: -GROUND_R, w: GROUND_R * 2, d: GROUND_R * 2, r: GROUND_R }, -PLINTH_H - FOOT_H, PLINTH_H, P)}"/>`);
const FEET = Array.from({ length: 8 }, (_, i) => [Math.cos((22.5 + 45 * i) * DEG) * (GROUND_R - 34), Math.sin((22.5 + 45 * i) * DEG) * (GROUND_R - 34)]).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
for (const [x, y] of FEET) {
  back.push(S(k.cylinder(x, y, 13, -PLINTH_H - FOOT_H, 2.4, P, 32), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 9.5, -PLINTH_H - FOOT_H + 2.4, FOOT_H - 2.4, P, 32), { tone: "mid" }));
  record(A.cylinder(x, y, 13, -PLINTH_H - FOOT_H, FOOT_H, { name: R.nameFor("stand.foot"), ground: true }));
}
back.push(S(G.disc(-PLINTH_H, -PLINTH_H + 5, GROUND_R, GROUND, P), { tone: "mid" }));
back.push(S(G.disc(-PLINTH_H + 5, 0, GROUND_R - 2, GROUND, P, { bevel: 1.4 }), { tone: "lo", inner: Ln(G.arcOf(GROUND, -5.5, GROUND_R - 2, P), { tone: "faint" }) }));
record(A.disc(GROUND, -PLINTH_H, 0, GROUND_R, { name: "stand.plinth", ground: true }));
// metre ruler bezel around the rim: one tick every 25 cm, a major every metre
const BEZEL_IN = GROUND_R - 16;
back.push(`<path class="lm-bezel" d="${G.circleOf(GROUND, 0, GROUND_R - 2.6, P, 180)} ${G.circleOf(GROUND, 0, BEZEL_IN, P, 180)}" fill-rule="evenodd"/>`);
back.push(Ln(G.circleOf(GROUND, 0, BEZEL_IN, P, 180) + G.circleOf(GROUND, 0, GROUND_R - 2.6, P, 180), { tone: "lo" }));
{
  const count = Math.round((2 * Math.PI * (GROUND_R - 2.6)) / (M / 4));
  const ticks = k.radialTicks(0, 0, GROUND_R - 2.6, count, 4, 0, [4.2, GROUND_R - 2.6 - BEZEL_IN], P);
  back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
}
// regolith: craters (raised rims as two rings), rocks, footprints
const CRATERS = [
  [-125, -128, 28],
  [62, -180, 18],
  [-196, 52, 15],
  [200, -48, 20],
  [-40, 222, 10],
  [214, 64, 8],
  [-170, -52, 9],
];
for (const [cx, cy, r] of CRATERS) {
  back.push(`<path class="lm-crater" d="${k.onTop(k.circleRing(cx, cy + r * 0.12, r * 0.86, 48), 0, P, true)}"/>`);
  back.push(Ln(k.ring(cx, cy, r, 0, P, 64), { tone: "lo" }), Ln(k.ring(cx, cy, r * 1.22, 0, P, 64), { tone: "faint" }));
}
const ROCKS = [
  [-100, 150, 6, 3.5, 0.3],
  [96, -128, 8, 4.5, 1.2],
  [-212, -8, 5, 3, 2.1],
  [-26, -214, 7, 4, 0.7],
  [178, 128, 4.5, 3, 1.7],
  [128, -34, 4, 2.4, 0.4],
  [-150, 170, 4, 2.6, 2.6],
];
for (const [cx, cy, r, h, rot] of ROCKS.sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
  const ring = Array.from({ length: 6 }, (_, i) => {
    const a = rot + (i / 6) * Math.PI * 2;
    const rr = r * (0.78 + 0.22 * Math.cos(i * 2.3 + rot));
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  });
  back.push(S(k.extrude(ring, 0, h, P, { bevel: 0.4 }), { tone: "mid" }));
  record(A.extruded(ring, 0, h, { name: R.nameFor("stand.rock"), ground: true }));
}
// label plate on the regolith, toward the viewer
{
  const towards = dir(AZIMUTH + 28);
  const c = mul(towards, GROUND_R - 42);
  const plan = { x: c[0] - 30, y: c[1] - 7, w: 60, d: 14, r: 1.5 };
  back.push(S(k.slabOf(plan, 0, 1.4, P, 3, 0.4), { tone: "mid" }));
  back.push(Ln(k.planOutline(k.insetPlan(plan, 1.8), 1.4, P, 3), { tone: "faint" }));
  back.push(k.faceTextSvg(k.topMatrix([plan.x + 4.5, plan.y + 9.2], 1.4, P, "x"), "APOLLO 11 · 20.VII.1969", { size: 3.6, tone: "lo" }));
  back.push(Dots([at([plan.x + 2.2, plan.y + 3.2, 1.4]), at([plan.x + plan.w - 2.2, plan.y + 3.2, 1.4])], { size: 0.45 }));
  record(A.slab(plan, 0, 1.4, { name: "stand.label", ground: true }, 3));
}

// =====================================================================
// DESCENT STAGE
// =====================================================================
const OCT = octagon(APOTHEM);
const faceNormal = (i) => dir(45 * i); // octagon faces: 0°, 45°, …
const visibleFaces = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => facing(faceNormal(i)) > 0.02);
const vertexAt = (deg, r = CIRCUM) => [r * Math.cos(deg * DEG), r * Math.sin(deg * DEG)];
// panel joints run full height on the body, edge to edge
const bodyLines = [];
for (const i of visibleFaces) {
  const a = vertexAt(45 * i - 22.5);
  const b = vertexAt(45 * i + 22.5);
  for (const t of [0.34, 0.66]) {
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    bodyLines.push(poly3([[p[0], p[1], BODY_Z], [p[0], p[1], BAND_Z]]));
  }
}
const seam = "";
put("descent", [0, 0, BODY_Z - 2], S(k.extrude(octagon(APOTHEM - 10), BODY_Z - 4, 4, P, {}), { tone: "lo" }), { name: "descent.heatshield", shapes: [record(A.extruded(octagon(APOTHEM - 10), BODY_Z - 4, 4, { name: "descent.heatshield", owner: "descent.body" }))] });
put("descent", [0, 0, (BODY_Z + BAND_Z) / 2], `<g class="lm-foil">${S(k.extrude(OCT, BODY_Z, BAND_Z - BODY_Z, P, {}), { tone: "hi", inner: Ln(bodyLines.join("") + seam, { tone: "faint" }) })}</g>`, { name: "descent.body", shapes: [record(A.extruded(OCT, BODY_Z, BAND_Z - BODY_Z, { name: "descent.body", owner: "descent.body" }))] });
put("descent", [0, 0, (BAND_Z + DECK_Z) / 2], `<g class="lm-black">${S(k.extrude(octagon(APOTHEM), BAND_Z, DECK_Z - BAND_Z, P, { bevel: 0.6 }), { tone: "mid", inner: Ln(k.ringSeam(OCT, BAND_Z + 0.01, P), { tone: "lo" }) })}</g>`, { name: "descent.band", shapes: [record(A.extruded(octagon(APOTHEM), BAND_Z, DECK_Z - BAND_Z, { name: "descent.band", owner: "descent.body" }))] });

// quadrant bays: an inset access panel on each visible bay face, with corner screws
const bayPanels = [];
const bayDots = [];
for (const i of visibleFaces.filter((i) => i % 2 === 1)) {
  const a = vertexAt(45 * i - 22.5, CIRCUM + 0.05);
  const b = vertexAt(45 * i + 22.5, CIRCUM + 0.05);
  const lerp2 = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const p0 = lerp2(0.14);
  const p1 = lerp2(0.86);
  bayPanels.push(poly3([[...p0, BODY_Z + 8], [...p1, BODY_Z + 8], [...p1, BAND_Z - 6], [...p0, BAND_Z - 6]], true));
  for (const [q, z] of [[lerp2(0.18), BODY_Z + 11], [lerp2(0.82), BODY_Z + 11], [lerp2(0.18), BAND_Z - 9], [lerp2(0.82), BAND_Z - 9]]) bayDots.push(at([...q, z]));
}
put("descent", [0, 0, BAND_Z], `<g class="lm-foil">${Ln(bayPanels.join(""), { tone: "lo" })}</g>` + Dots(bayDots, { size: 0.42 }), { bias: 0.4, name: "descent.bays", shapes: [A.extruded(OCT, BODY_Z, BAND_Z - BODY_Z, { name: "descent.bays" })] });

// top deck: interstage fittings that stay behind, umbilical stubs, the ascent engine's blast cavity
const DECKF = UPF(0, -14, DECK_Z);
back.push("");
put("descent", [0, -14, DECK_Z], `<path class="lm-void" d="${G.circleOf(DECKF, 0, 21, P, 64)}"/>` + Ln(G.circleOf(DECKF, 0, 21, P, 64) + G.circleOf(DECKF, 0, 27, P, 64), { tone: "lo" }) + Dots(G.dotsOf(DECKF, 0, 24, 16, P, { all: true }), { size: 0.4 }), { bias: 0.05, name: "descent.cavity", shapes: [A.disc(DECKF, -0.2, 0.05, 27.4, { name: "descent.cavity" })] });
const FITTINGS = [[-60.4, 20], [60.4, 20], [-60.4, -40], [60.4, -40]];
for (const [x, y] of FITTINGS) boxAt("descent", { x: x - 4, y: y - 4, w: 8, d: 8, r: 0.6 }, DECK_Z, 6, { tone: "mid" }, { name: "descent.fitting", owner: "descent.body", extra: Dots([at([x, y, DECK_Z + 6])], { size: 0.5, tone: "hi" }) });
for (const [x, y] of [[-62, -14], [62, -14]]) boxAt("descent", { x: x - 5, y: y - 3, w: 10, d: 6, r: 0.6 }, DECK_Z, 4, { tone: "mid" }, { name: "descent.umbilical", owner: "descent.body" });

// RCS plume deflectors on the deck edge under the front thruster quads
for (const sx of [-1, 1]) {
  const F = G.frameOf([sx * 62, 44, DECK_Z], [0, 1, 0], [sx, 0, 0], [0, 0, 1]);
  prismAt("descent", F, ccw([[0, 0], [12, 0], [12, 2], [0, 14]]), -6, 6, { tone: "mid" }, { name: "descent.deflector", owner: "descent.body" });
}

// outriggers: where each landing leg's primary strut is pinned to the stage
const OUTRIG = {};
for (const deg of LEGS) {
  const d = dir(deg);
  const t = dir(deg + 90);
  const front = deg === FRONT;
  const z0 = 98;
  const z1 = front ? 123 : DECK_Z;
  const halfW = front ? 9 : 11;
  const ring = [add(mul(d, APOTHEM), mul(t, -halfW)), add(mul(d, APOTHEM + 13), mul(t, -halfW)), add(mul(d, APOTHEM + 13), mul(t, halfW)), add(mul(d, APOTHEM), mul(t, halfW))].map(([x, y]) => [x, y]);
  extrudeAt("descent", ring, z0, z1 - z0, { tone: "mid" }, { name: "descent.outrigger", owner: "descent.body", bevel: 0.4 });
  OUTRIG[deg] = { ball: [...mul(d, APOTHEM + 13 + 4.3).slice(0, 2), 110], z0, z1 };
}

// descent engine: bell below the stage, gimballed in a ring
const DPS = G.frameOf([0, 0, BODY_Z - 4], [0, 0, -1], [1, 0, 0], [0, 1, 0]);
const DPS_LEN = 34;
const dpsR = (s) => 13 + 17 * Math.pow(Math.max(s, 0) / DPS_LEN, 0.72);
const dpsSlope = (s) => (17 * 0.72 * Math.pow(Math.max(s, 0.3) / DPS_LEN, -0.28)) / DPS_LEN;
turned("dps", DPS, [[0, 16], [3, 16]], { tone: "mid" }, { name: "dps.gimbal", owner: "dps" });
const DPS_PROFILE = Array.from({ length: 22 }, (_, i) => {
  const s = 3 + ((DPS_LEN - 3) * i) / 21;
  return [s, dpsR(s), i && i < 21 ? 1 : 0];
});
turned("dps", DPS, DPS_PROFILE, { tone: "hi" }, { name: "dps.bell", owner: "dps", smooth: { slope: dpsSlope, rows: 5 }, inner: Ln([12, 24].map((s) => G.arcOf(DPS, s, dpsR(s), P, { slope: dpsSlope(s) })).join(""), { tone: "faint" }) });

// MESA: the equipment pallet hinged down from the front-right bay, with the TV camera that filmed the first step
{
  const i = 1; // the 45° bay face, left of the ladder for an astronaut facing the stage
  const n = faceNormal(i);
  const t = dir(45 * i + 90);
  const hinge = add(mul(n, APOTHEM + 0.3), [0, 0, BODY_Z + 40]);
  const tilt = 32 * DEG; // hangs out and down from its hinge
  const down = unit(add(mul(n, Math.sin(tilt)), [0, 0, -Math.cos(tilt)]));
  const outward = unit(cross(t, down));
  const F = { o: hinge, a: outward, u: t, v: down };
  const panel = ccw([[-22, 0], [22, 0], [22, 30], [-22, 30]]);
  prismAt("mesa", F, panel, 0, 3, { tone: "hi" }, { name: "mesa.pallet", owner: "descent.body", extra: Ln(prismSeam(F, panel, 3), { tone: "faint" }), wrap: "lm-foil" });
  const face = (u, v, s = 3) => add(add(F.o, mul(F.a, s)), add(mul(F.u, u), mul(F.v, v)));
  put("mesa", face(0, 15), Ln(poly3([face(-18, 4), face(18, 4), face(18, 26), face(-18, 26)], true), { tone: "lo" }) + Dots([face(-19.5, 2), face(19.5, 2), face(-19.5, 28), face(19.5, 28)].map(at), { size: 0.42 }), { bias: 0.3, name: "mesa.panel", shapes: [A.prism(F, panel, 0, 3.05, { name: "mesa.panel" })] });
  // the camera: a box on a bracket with a lens toward the ladder
  const camF = { o: face(-8, 18, 3), a: outward, u: t, v: down };
  prismAt("mesa", camF, ccw([[-5, -4], [5, -4], [5, 4], [-5, 4]]), 0, 8, { tone: "mid" }, { name: "mesa.camera", owner: "descent.body" });
  const lensAxis = unit(sub(add(mul(dir(FRONT), PAD_R - 30), [0, 0, 30]), face(-8, 18, 7)));
  const lensF = G.frameAlong(add(face(-8, 18, 7), mul(lensAxis, 0)), lensAxis);
  put("mesa", add(lensF.o, mul(lensAxis, 2)), S(G.disc(0, 4, 2.6, lensF, P), { tone: "hi" }) + (facing(lensAxis) > 0.1 ? `<path class="lm-glass" d="${G.circleOf(lensF, 4, 1.6, P, 24)}"/>` : ""), { bias: 0.5, name: "mesa.lens", shapes: [record(A.disc(lensF, 0, 4, 2.6, { name: "mesa.lens", owner: "descent.body" }))] });
  // the two hinge links back to the stage
  for (const u of [-18, 18]) rod("mesa", add(face(u, 26, 1.5), [0, 0, 0]), add(add(mul(n, APOTHEM - 0.4), mul(t, u)), [0, 0, BODY_Z + 8]), 0.8, { name: "mesa.link", owner: "descent.body" });
}

// =====================================================================
// LANDING GEAR: four legs, each a primary strut, two secondaries, a footpad
// =====================================================================
const LADDER = {};
for (const deg of LEGS) {
  const d = dir(deg);
  const t = dir(deg + 90);
  const foot = [...mul(d, PAD_R).slice(0, 2), 0];
  const PADF = UPF(foot[0], foot[1], 0);
  turned("gear", PADF, [[0, 12], [3.2, 16.8, 1], [5.2, 18.8, 1], [6.4, 19.4]], { tone: "hi" }, {
    name: "gear.pad",
    owner: `leg${deg}`,
    inner: Ln(G.circleOf(PADF, 6.4, 15.6, P, 64), { tone: "faint" }),
  });
  const bossTop = 9.4;
  discAt("gear", PADF, 6.4, bossTop, 5.4, { tone: "mid" }, { name: "gear.boss", owner: `leg${deg}` });
  const padBall = [foot[0], foot[1], bossTop + 2.6];
  ballAt("gear", padBall, 4.4, { tone: "hi" }, { name: "gear.socket", owner: `leg${deg}` });
  const top = OUTRIG[deg].ball;
  ballAt("gear", top, 4.6, { tone: "hi" }, { name: "gear.pin", owner: `leg${deg}` });
  // primary strut: upper cylinder, collar, piston with the secondary-strut fitting
  const axis = unit(sub(padBall, top));
  const L = len(sub(padBall, top));
  const F = G.frameAlong(top, axis);
  const sTop = Math.sqrt(4.6 ** 2 - 3.6 ** 2);
  const sCollar = L * 0.5;
  const sFit = L * 0.7;
  const fitR = 4.2;
  discAt("gear", F, sTop, sCollar, 3.6, { tone: "hi" }, { name: "gear.strut", owner: `leg${deg}` });
  discAt("gear", F, sCollar, sCollar + 3.4, 4.4, { tone: "mid" }, { name: "gear.collar", owner: `leg${deg}`, bevel: 0.3 });
  discAt("gear", F, sCollar + 3.4, sFit - Math.sqrt(fitR ** 2 - 2.6 ** 2), 2.6, { tone: "hi" }, { name: "gear.piston", owner: `leg${deg}` });
  const fit = add(top, mul(axis, sFit));
  ballAt("gear", fit, fitR, { tone: "mid" }, { name: "gear.fitting", owner: `leg${deg}` });
  discAt("gear", F, sFit + Math.sqrt(fitR ** 2 - 2.6 ** 2), L - Math.sqrt(4.4 ** 2 - 2.6 ** 2), 2.6, { tone: "hi" }, { name: "gear.piston", owner: `leg${deg}` });
  // secondary struts to brackets under the body's bottom corners
  for (const side of [-1, 1]) {
    const v = vertexAt(deg + side * 22.5, CIRCUM - 4);
    const bracket = [v[0], v[1], BODY_Z - 3];
    ballAt("gear", bracket, 3, { tone: "mid" }, { name: "gear.bracket", owner: `leg${deg}` });
    rod("gear", fit, bracket, 1.8, { ra: fitR, rb: 3, style: { tone: "mid" }, name: "gear.secondary", owner: `leg${deg}` });
  }
  if (deg === FRONT) LADDER.F = F, LADDER.L = L, LADDER.top = top, LADDER.axis = axis, LADDER.sTop = sTop;
  // contact probe, bent flat on landing (not on the ladder leg)
  if (deg !== FRONT) {
    const side = dir(deg + 40);
    const HZ = 5.8;
    const hingeF = G.frameAlong(add(foot, add(mul(d, 18.9), [0, 0, HZ])), d);
    put("probes", hingeF.o, S(G.disc(0, 2.6, 1.6, hingeF, P), { tone: "mid" }), { name: R.nameFor("probes.hinge"), shapes: [record(A.disc(hingeF, 0, 2.6, 1.6, { name: "probes.hinge", owner: `leg${deg}` }))] });
    const start = add(foot, add(mul(d, 18.9 + 2.6), [0, 0, HZ]));
    const out = add(start, mul(d, 3.5));
    const bend = add(start, add(mul(d, 10), [0, 0, 1.3 - HZ]));
    const tip = add(bend, mul(side, 36));
    const route = G.fillet([start, out, bend, tip], 3, 10, { P, tube: 0.8 });
    tubeItems("probes", route, 0.8, { name: `probes.rod${deg}`, tone: "hi", maxLength: 14 });
    ballAt("probes", add(tip, mul(side, Math.sqrt(1.3 ** 2 - 0.8 ** 2))), 1.3, { tone: "hi" }, { name: "probes.tip", owner: `leg${deg}` });
  }
}

// ladder down the front strut: two rails, nine rungs, the plaque behind them
{
  const { F, L, axis } = LADDER;
  const n = unit(cross(F.a, dir(FRONT + 90))); // out of the ladder plane, away from the stage
  const out = dot(n, [0, 0, 1]) > 0 ? n : mul(n, -1);
  const side = dir(FRONT + 90);
  const OFF = 6.2;
  const HALF = 12.5;
  // the rail tops end flush under the porch (z = 120)
  const PORCH_BOTTOM = 123;
  const railAt = (s, u) => add(add(add(F.o, mul(axis, s)), mul(out, OFF)), mul(side, u));
  const sAtZ = (z) => (z - (F.o[2] + out[2] * OFF)) / axis[2];
  const sTopRail = sAtZ(PORCH_BOTTOM);
  const sBottom = sAtZ(46);
  for (const u of [-HALF, HALF]) {
    const a = railAt(sTopRail, u);
    const b = railAt(sBottom, u);
    rod("ladder", a, b, 1.1, { style: { tone: "hi" }, name: "ladder.rail", owner: "ladder" });
  }
  const RUNGS = 9;
  for (let i = 0; i < RUNGS; i++) {
    const s = sBottom - ((sBottom - sTopRail - 8) * i) / (RUNGS - 1) - 1.5;
    rod("ladder", railAt(s, -HALF + 0.9), railAt(s, HALF - 0.9), 0.85, { style: { tone: "mid" }, name: "ladder.rung", owner: "ladder" });
  }
  // brackets from the strut to each rail
  for (const s of [sTopRail + 20, sBottom - 6]) {
    for (const u of [-HALF, HALF]) {
      const onRail = railAt(s, u);
      const axisPt = add(F.o, mul(axis, s));
      const toward = unit(sub(onRail, axisPt));
      const r0 = s < L * 0.5 ? 3.6 : 2.6;
      rod("ladder", add(axisPt, mul(toward, r0 - 0.3)), add(onRail, mul(toward, -0.6)), 0.7, { style: { tone: "mid" }, name: "ladder.bracket", owner: "ladder" });
    }
  }
  // the plaque: "Here men from the planet Earth first set foot upon the Moon"
  const sPlaque = L * 0.32;
  const pF = { o: add(add(F.o, mul(axis, sPlaque)), mul(out, 3.6)), a: out, u: side, v: axis };
  const plate = ccw([[-9, -6], [9, -6], [9, 6], [-9, 6]]);
  prismAt("ladder", pF, plate, 0, 0.9, { tone: "hi" }, {
    name: "ladder.plaque",
    owner: "ladder",
    extra: (() => {
      const f = (u, v) => add(add(pF.o, mul(out, 0.9)), add(mul(side, u), mul(axis, v)));
      const rules = [[-6, 6, -2.6], [-6, 4, -0.6], [-6, 6.4, 1.4], [-4, 2, 3.4]].map(([u0, u1, v]) => poly3([f(u0, v), f(u1, v)])).join("");
      return Ln(poly3([f(-8, -5), f(8, -5), f(8, 5), f(-8, 5)], true), { tone: "faint" }) + Ln(rules, { tone: "lo", free: true }) + Dots([f(-7.6, -4.4), f(7.6, -4.4), f(-7.6, 4.4), f(7.6, 4.4)].map(at), { size: 0.38 });
    })(),
  });
  LADDER.porchY = railAt(sTopRail, 0)[1];
}

// porch: the platform outside the hatch, with its two handrails
{
  const plan = { x: -22, y: APOTHEM, w: 44, d: 29, r: 1.2 };
  const z0 = 123;
  boxAt("ladder", plan, z0, 3, { tone: "hi" }, {
    name: "ladder.porch",
    owner: "ladder",
    extra: Ln(Array.from({ length: 7 }, (_, i) => k.lineOnTop([plan.x + 5 + i * 5.66, plan.y], [plan.x + 5 + i * 5.66, plan.y + plan.d], 126, P)).join(""), { tone: "faint" }),
  });
  for (const sx of [-1, 1]) {
    const x = sx * 19.5;
    const route = G.fillet([[x, 111, 126.8], [x, 111, 150], [x, 84, 150], [x, 80, 136], [x, 80, 126.8]], 5, 10, { P, tube: 0.9 });
    tubeItems("ladder", route, 0.9, { name: "ladder.handrail", tone: "hi" });
    for (const p of [[x, 111, 126], [x, 80, 126]]) discAt("ladder", UPF(p[0], p[1], 126), 0, 0.8, 2, { tone: "mid" }, { name: "ladder.handrail-foot", owner: "ladder" });
  }
}

// =====================================================================
// ASCENT STAGE (moves on liftoff)
// =====================================================================
const BASE_Z = DECK_Z;
const CAB_FRONT = 72;
// base plate the stage stands on
const BASE = { x: -56, y: -84, w: 112, d: CAB_FRONT + 84, r: 6 };
boxAt("ascent", BASE, BASE_Z, 8, { tone: "mid" }, { name: "ascent.base", owner: "ascent.shell", steps: 4, bevel: 0.6 });
// crew cabin: an octagon in section, along +y
const CABIN_Z = 178;
const CAB = ccw([[-30, -44], [30, -44], [46, -28], [46, 28], [30, 44], [-30, 44], [-46, 28], [-46, -28]]);
const CABF = G.frameOf([0, 6, CABIN_Z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const CAB_LEN = CAB_FRONT - 6;
prismAt("ascent", CABF, CAB, 0, CAB_LEN, { tone: "hi" }, { name: "ascent.cabin", owner: "ascent.shell", inner: Ln([22, 44].map((s) => prismSeam(CABF, CAB, s)).join(""), { tone: "faint" }) });
// midsection: carries the tunnel and the ascent engine
const MID = { x: -42, y: -40, w: 84, d: 46, r: 1 };
boxAt("ascent", MID, BASE_Z + 8, 96, { tone: "hi" }, { name: "ascent.mid", owner: "ascent.shell", inner: Ln(k.sideSeam(MID, 186, P, 3), { tone: "faint" }), bevel: 0.6 });
const MID_TOP = BASE_Z + 8 + 96;
// aft equipment bay
const AFT = { x: -34, y: -84, w: 68, d: 44, r: 1 };
boxAt("ascent", AFT, BASE_Z + 8, 80, { tone: "hi" }, {
  name: "ascent.aft",
  owner: "ascent.shell",
  bevel: 0.6,
  inner: Ln(k.sideSeam(AFT, 172, P, 3), { tone: "faint" }),
});
// vents on the aft bay's side as closed slots in the face plane
{
  const x = AFT.x + AFT.w + 0.05;
  const vents = [0, 1, 2, 3].map((i) => poly3([[x, -79 + i * 9, 186], [x, -73 + i * 9, 186], [x, -73 + i * 9, 160], [x, -79 + i * 9, 160]], true)).join("");
  put("ascent", [x, -62, 172], Ln(vents, { tone: "lo" }), { bias: 0.3, name: "ascent.vents", shapes: [A.box([x - 0.2, -79, 160], [x + 0.05, -46, 186], { name: "ascent.vents" })] });
}
// propellant tanks behind faceted shields: the two "cheeks"
for (const sx of [-1, 1]) {
  const F = G.frameOf([0, -40, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const poly = ccw([[42, 136], [70, 140], [86, 160], [86, 198], [70, 216], [42, 220]].map(([x, z]) => [sx * x, z]));
  prismAt("ascent", F, poly, 0, 44, { tone: "hi" }, { name: sx < 0 ? "ascent.cheek-ox" : "ascent.cheek-fuel", owner: "ascent.shell", inner: Ln([11, 22, 33].map((s) => prismSeam(F, poly, s)).join(""), { tone: "faint" }) });
}
// docking tunnel, upper hatch and drogue ring on top
const TUN = UPF(0, -17, MID_TOP);
discAt("ascent", TUN, 0, 10, 16, { tone: "mid" }, { name: "ascent.tunnel", owner: "ascent.shell" });
put("ascent", add(TUN.o, [0, 0, 10]), S(G.ringBand(10, 12, 9, 17, TUN, P), { tone: "hi" }) + `<path class="lm-void" d="${G.circleOf(TUN, 12, 9, P, 48)}"/>` + Ln(G.arcOf(TUN, 12, 9, P, { inward: true, least: -1 }), { tone: "lo" }) + Dots(G.dotsOf(TUN, 12, 13, 12, P, { all: true }), { size: 0.4 }), { bias: 0.2, name: "ascent.drogue", shapes: [record(A.ring(TUN, 10, 12, 9, 17, { name: "ascent.drogue", owner: "ascent.shell" }))] });

// forward face: hatch, triangular windows, docking window
const FACE_Y = CAB_FRONT + 0.05;
{
  const fx = (x, z) => [x, FACE_Y, z];
  const hatch = [fx(-15, 138), fx(15, 138), fx(15, 168), fx(-15, 168)];
  const hatchInner = [fx(-12.5, 140.5), fx(12.5, 140.5), fx(12.5, 165.5), fx(-12.5, 165.5)];
  put("windows", [0, FACE_Y, 153], Ln(poly3(hatch, true), { tone: "mid" }) + Ln(poly3(hatchInner, true), { tone: "faint" }) + Dots([fx(-13.5, 139.5), fx(13.5, 139.5), fx(-13.5, 166.5), fx(13.5, 166.5)].map(at), { size: 0.42 }), { bias: 0.3, name: "windows.hatch", shapes: [A.box([-15, FACE_Y - 0.2, 138], [15, FACE_Y + 0.05, 168], { name: "windows.hatch" })] });
  boxAt("windows", { x: 6, y: FACE_Y, w: 6, d: 2, r: 0.4 }, 151, 3, { tone: "mid" }, { name: "windows.handle", owner: "ascent.shell" });
  for (const sx of [-1, 1]) {
    const tri = [fx(sx * 40, 196), fx(sx * 12, 214), fx(sx * 12, 186)];
    const triIn = [fx(sx * 36.5, 196), fx(sx * 14, 210.5), fx(sx * 14, 189)];
    put("windows", [sx * 22, FACE_Y, 200], `<path class="lm-glass" d="${poly3(triIn, true)}"/>` + Ln(poly3(tri, true), { tone: "mid" }) + Ln(poly3(triIn, true), { tone: "lo" }), { bias: 0.3, name: "windows.window", shapes: [A.box([Math.min(sx * 40, sx * 12), FACE_Y - 0.2, 186], [Math.max(sx * 40, sx * 12), FACE_Y + 0.05, 214], { name: "windows.window" })] });
  }
  // overhead docking window on the cabin roof, above the commander
  const roof = CABIN_Z + 44;
  put("windows", [-16, 50, roof], `<path class="lm-glass" d="${k.onTop([[-22, 44], [-10, 44], [-10, 56], [-22, 56]], roof, P, true)}"/>` + Ln(k.onTop([[-23, 43], [-9, 43], [-9, 57], [-23, 57]], roof, P, true), { tone: "mid" }), { bias: 0.3, name: "windows.docking", shapes: [A.box([-23, 43, roof - 0.2], [-9, 57, roof + 0.05], { name: "windows.docking" })] });
}

// RCS: four quads of four thrusters on booms at the corners
const QUADS = [[-1, 40], [1, 40], [-1, -64], [1, -64]].map(([sx, y]) => [sx * 77, y, 198]);
for (const q of QUADS) {
  const sx = Math.sign(q[0]);
  const from = q[1] > 0 ? 46 : 34;
  boxAt("rcs", { x: Math.min(sx * from, sx * 72), y: q[1] - 2.5, w: 72 - from, d: 5, r: 0.4 }, q[2] - 2.5, 5, { tone: "mid" }, { name: "rcs.boom", owner: "ascent.shell" });
  boxAt("rcs", { x: q[0] - 5, y: q[1] - 5, w: 10, d: 10, r: 0.8 }, q[2] - 5, 10, { tone: "hi" }, { name: "rcs.quad", owner: "rcs", bevel: 0.4 });
  for (const a of [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]) {
    const F = G.frameAlong(add(q, mul(a, 5)), a);
    turned("rcs", F, [[0, 1.8], [2, 1.8], [7.4, 3.4]], { tone: "mid" }, { name: "rcs.nozzle", owner: "rcs" });
  }
}

// antennas
// a paraboloid shell back: r(s) = R·sqrt((s + D) / D) from a small mounting flat to the rim at s = 0
const dishR = (R, D) => (s) => R * Math.sqrt(Math.max(s + D, 0) / D);
const dishSlope = (R, D) => (s) => R / (2 * Math.sqrt(D * Math.max(s + D, 0.02)));
const dishProfile = (R, D) => {
  const s0 = -D + D * (0.2 ** 2);
  return Array.from({ length: 14 }, (_, i) => {
    const s = s0 + ((0 - s0) * i) / 13;
    return [s, dishR(R, D)(s), i && i < 13 ? 1 : 0];
  });
};
// rendezvous radar on its pedestal, dish toward the command module
{
  const base = [-30, 52, CABIN_Z + 44];
  const PED = UPF(...base);
  discAt("antennas", PED, 0, 6, 5, { tone: "mid" }, { name: "antennas.rr-pedestal", owner: "antennas.rr" });
  const hub = add(base, [0, 0, 6 + 4]);
  ballAt("antennas", hub, 4, { tone: "mid" }, { name: "antennas.rr-gimbal", owner: "antennas.rr" });
  const a = unit([-0.35, 0.55, 0.76]);
  const F = G.frameAlong(add(hub, mul(a, 4 + 4.4)), a);
  turned("antennas", F, dishProfile(12.4, 4.4), { tone: "hi" }, { smooth: { slope: dishSlope(12.4, 4.4), rows: 3 }, name: "antennas.rr-dish", owner: "antennas.rr", extra: facing(a) > 0.1 ? Ln(G.circleOf(F, 0, 9.4, P, 48) + G.circleOf(F, 0, 5.2, P, 32), { tone: "faint" }) : "" });
  rod("antennas", add(hub, mul(a, 4)), add(hub, mul(a, 4.6)), 2.2, { name: "antennas.rr-neck", owner: "antennas.rr" });
  discAt("antennas", G.frameAlong(F.o, a), 0, 7, 0.6, { tone: "hi" }, { name: "antennas.rr-feed", owner: "antennas.rr" });
  ballAt("antennas", add(F.o, mul(a, 7 + 1.2)), 1.3, { tone: "hi" }, { name: "antennas.rr-horn", owner: "antennas.rr" });
}
// steerable S-band dish on a boom from the left side
{
  const root = [-42, -14, MID_TOP - 4];
  const elbow = [-62, -14, MID_TOP - 4];
  const head = [-66, -14, MID_TOP + 10];
  rod("antennas", root, elbow, 1.6, { rb: 3, name: "antennas.sband-boom", owner: "antennas.sband" });
  ballAt("antennas", elbow, 3, { tone: "mid" }, { name: "antennas.sband-joint", owner: "antennas.sband" });
  rod("antennas", elbow, head, 1.6, { ra: 3, rb: 3.4, name: "antennas.sband-mast", owner: "antennas.sband" });
  ballAt("antennas", head, 3.4, { tone: "mid" }, { name: "antennas.sband-gimbal", owner: "antennas.sband" });
  const a = unit([-0.45, 0.35, 0.82]);
  const F = G.frameAlong(add(head, mul(a, 3.4 + 4.6)), a);
  turned("antennas", F, dishProfile(13, 4.6), { tone: "hi" }, { smooth: { slope: dishSlope(13, 4.6), rows: 3 }, name: "antennas.sband-dish", owner: "antennas.sband", extra: facing(a) > 0.1 ? Ln(G.circleOf(F, 0, 10, P, 48) + G.circleOf(F, 0, 4.4, P, 32), { tone: "faint" }) : "" });
  rod("antennas", add(head, mul(a, 3.2)), add(head, mul(a, 3.6)), 2.2, { name: "antennas.sband-neck", owner: "antennas.sband" });
  discAt("antennas", G.frameAlong(F.o, a), 0, 6, 0.6, { tone: "hi" }, { name: "antennas.sband-feed", owner: "antennas.sband" });
}
// VHF antennas: masts with crossed elements
for (const [x, y, z, h] of [[26, 46, CABIN_Z + 44, 14], [-20, -74, BASE_Z + 88, 16]]) {
  const F = UPF(x, y, z);
  discAt("antennas", F, 0, 2, 2.4, { tone: "mid" }, { name: "antennas.vhf-base", owner: `vhf${x}` });
  discAt("antennas", F, 2, h, 0.8, { tone: "hi" }, { name: "antennas.vhf-mast", owner: `vhf${x}` });
  const c = [x, y, z + h - 2];
  for (const a of [[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0]]) discAt("antennas", G.frameAlong(c, a), 0.7, 8, 0.5, { tone: "hi" }, { name: "antennas.vhf-element", owner: `vhf${x}` });
}
// EVA antenna: the umbrella on top of the midsection
{
  const F = UPF(28, -30, MID_TOP);
  discAt("antennas", F, 0, 2, 2.6, { tone: "mid" }, { name: "antennas.eva-base", owner: "eva" });
  discAt("antennas", F, 2, 18, 0.8, { tone: "hi" }, { name: "antennas.eva-mast", owner: "eva" });
  turned("antennas", F, [[18, 6.4], [19.4, 6.4], [24, 0.8]], { tone: "hi" }, { name: "antennas.eva-cone", owner: "eva" });
}
// docking target: the cross the command module pilot aligned on
{
  const F = UPF(-26, -4, MID_TOP);
  discAt("antennas", F, 0, 12, 0.9, { tone: "mid" }, { name: "antennas.target-post", owner: "target" });
  const c = [-26, -4, MID_TOP + 12];
  discAt("antennas", UPF(...c), 0, 1, 5, { tone: "hi" }, { name: "antennas.target-disc", owner: "target", extra: Ln(k.lineOnTop([-30.95, -4], [-21.05, -4], MID_TOP + 13, P) + k.lineOnTop([-26, -8.95], [-26, 0.95], MID_TOP + 13, P), { tone: "mid" }) });
}

// ascent engine bell: inside the descent stage until liftoff (clipped at the deck plane by the page)
const APS = G.frameOf([0, -14, BASE_Z], [0, 0, -1], [1, 0, 0], [0, 1, 0]);
const APS_LEN = 30;
const apsR = (s) => 8 + 9.5 * Math.pow(Math.max(s, 0) / APS_LEN, 0.75);
const apsSlope = (s) => (9.5 * 0.75 * Math.pow(Math.max(s, 0.3) / APS_LEN, -0.25)) / APS_LEN;
{
  const profile = Array.from({ length: 18 }, (_, i) => {
    const s = (APS_LEN * i) / 17;
    return [s, apsR(s), i && i < 17 ? 1 : 0];
  });
  const paths = G.solidOf(profile, APS, P, { smooth: { slope: apsSlope, rows: 4 } });
  const shape = A.solid(APS, profile, { name: "aps.bell", owner: "descent.body" });
  put("aps", add(APS.o, [0, 0, -APS_LEN / 2]), S(paths, { tone: "hi", inner: Ln(G.arcOf(APS, 14, apsR(14), P, { slope: apsSlope(14) }), { tone: "faint" }) }), { name: "aps.bell", shapes: [shape], clip: true });
}

// =====================================================================
// LEFT BEHIND ON THE REGOLITH: retroreflector, seismometer, flag
// =====================================================================
const LRRR_AT = [104, 150];
{
  const [x, y] = LRRR_AT;
  boxAt("lrrr", { x: x - 12, y: y - 9, w: 24, d: 18, r: 1 }, 0, 3, { tone: "mid" }, { name: "lrrr.pallet", owner: "lrrr" });
  const toward = unit([0.3, 0.55, 0.78]); // tilted toward the Earth, high in the sky at Tranquility
  const hinge = [x, y - 6, 3];
  const F = { o: add(hinge, [0, 0, 1.5]), a: toward, u: [1, 0, 0], v: unit(cross([1, 0, 0], toward)) };
  const half = 10;
  const panel = ccw([[-half, -half], [half, -half], [half, half], [-half, half]]);
  const lift = add(F.o, mul(F.v, half));
  prismAt("lrrr", { ...F, o: lift }, panel, 0, 2.4, { tone: "hi" }, {
    name: "lrrr.panel",
    owner: "lrrr",
    extra: (() => {
      const cells = [];
      for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) cells.push(at(add(add(lift, mul(F.a, 2.4)), add(mul(F.u, -half + 1 + i * 2), mul(F.v, -half + 1 + j * 2)))));
      return Dots(cells, { size: 0.55, tone: "hi" }) + Ln(poly3([[-half + 0.4, -half + 0.4], [half - 0.4, -half + 0.4], [half - 0.4, half - 0.4], [-half + 0.4, half - 0.4]].map(([u, v]) => add(add(lift, mul(F.a, 2.4)), add(mul(F.u, u), mul(F.v, v)))), true), { tone: "faint" });
    })(),
  });
  for (const sx of [-1, 1]) rod("lrrr", [x + sx * 8, y + 5, 3], add(lift, add(mul(F.u, sx * 8), mul(F.v, half - 1))), 0.8, { name: "lrrr.leg", owner: "lrrr" });
}
const PSEP_AT = [146, -112];
{
  const [x, y] = PSEP_AT;
  const body = octagon(7).map(([u, v]) => [x + u, y + v]);
  extrudeAt("psep", body, 0, 14, { tone: "hi" }, { name: "psep.body", owner: "psep", bevel: 0.4 });
  discAt("psep", UPF(x, y, 14), 0, 3, 4.2, { tone: "mid" }, { name: "psep.sensor", owner: "psep" });
  discAt("psep", UPF(x, y, 17), 0, 8, 0.6, { tone: "hi" }, { name: "psep.antenna", owner: "psep" });
  for (const sx of [-1, 1]) {
    const plan = sx < 0 ? { x: x - 6.9 - 34, y: y - 13, w: 34, d: 26, r: 0.6 } : { x: x + 6.9, y: y - 13, w: 34, d: 26, r: 0.6 };
    const grid = [];
    for (let i = 1; i < 6; i++) grid.push(k.lineOnTop([plan.x + (plan.w * i) / 6, plan.y], [plan.x + (plan.w * i) / 6, plan.y + plan.d], 8.4, P));
    for (let j = 1; j < 4; j++) grid.push(k.lineOnTop([plan.x, plan.y + (plan.d * j) / 4], [plan.x + plan.w, plan.y + (plan.d * j) / 4], 8.4, P));
    boxAt("psep", plan, 7.2, 1.2, { tone: "hi" }, { name: "psep.panel", owner: "psep", extra: `<path class="lm-cells" d="${k.slabOf(k.insetPlan(plan, 0.01), 8.4, 0.01, P, 1).top}"/>` + Ln(grid.join(""), { tone: "lo" }) });
  }
}
const FLAG_AT = [-150, 80];
const FLAG = { pole: 84, cloth: [60, 36], away: unit([FLAG_AT[0], FLAG_AT[1], 0]) };

// =====================================================================
// SETTLE THE ORDER, SPLIT THE LAYERS, BUILD THE PAGE
// =====================================================================
A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const firstMoving = R.items.findIndex((item) => item.ride === "ascent");
const lifted = (item) => item.ride === "ascent";
const groupOf = (item, index) => {
  const [mx, my, mz] = item.move;
  const body = item.clip ? `<clipPath id="lm-aps-clip"><path data-hold class="lm-clip" d=""/></clipPath><g clip-path="url(#lm-aps-clip)">${item.svg}</g>` : item.svg;
  return `<g class="it" data-piece="${item.piece}"${item.ride !== item.piece ? ` data-ride="${item.ride}"` : ""} data-k="${item.key.toFixed(2)}" data-m="${mx.toFixed(1)},${my.toFixed(1)},${mz.toFixed(1)}" data-i="${index}">${body}</g>`;
};
const backItems = R.items.slice(0, firstMoving).map(groupOf);
const frontItems = R.items.slice(firstMoving).map((item, index) => groupOf(item, firstMoving + index));

const backSvg = k.figureSvg({ width: W, height: H, label: TEXT.fr.label, body: [...back, `<g class="lm-sorted">${backItems.join("")}</g>`], className: "lm-back" });
const flagSvg = `<g class="it lm-flag" data-piece="flag"><path class="lm-flag-shadow" d=""/><path class="lm-flag-cloth" d=""/><path class="lm-flag-stripes iso-line" data-tone="lo" d=""/><path class="lm-flag-edge iso-line" data-tone="mid" d=""/><path class="lm-flag-pole iso-line" data-tone="hi" d="" style="stroke-width:1.2"/><circle class="lm-flag-foot" r="1.1"/></g>`;
const frontSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg lm-front" viewBox="0 0 ${W} ${H}" aria-hidden="true"><g class="lm-sorted">${frontItems.join("")}</g>${flagSvg}</svg>`;

const DATA = {
  W,
  H,
  P,
  V,
  camera: glCamera(P),
  ex: [at([1, 0, 0])[0] - at([0, 0, 0])[0], at([1, 0, 0])[1] - at([0, 0, 0])[1]],
  ey: [at([0, 1, 0])[0] - at([0, 0, 0])[0], at([0, 1, 0])[1] - at([0, 0, 0])[1]],
  ez: [at([0, 0, 1])[0] - at([0, 0, 0])[0], at([0, 0, 1])[1] - at([0, 0, 0])[1]],
  deckZ: DECK_Z,
  aps: { o: APS.o, len: APS_LEN, r0: 8, r1: 17.5, q: 0.75 },
  ground: GROUND_R,
  flag: { at: FLAG_AT, ...FLAG },
  model: MODEL,
  parts: PARTS,
  text: TEXT,
  lift: LIFT,
  firstMoving,
};

const PART_BUTTONS = PARTS.map((part, index) => `<button type="button" class="lm-part" data-part="${part.id}"><span class="lm-num">${String(index + 1).padStart(2, "0")}</span><span data-t="part.${part.id}">${part.fr.name}</span></button>`).join("");
const corners = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1 · FORBITS</span><span class="iso-plate-corner" data-corner="title" data-t="title">${TEXT.fr.title}</span><span class="iso-plate-corner" data-corner="readout" data-readout>${TEXT.fr.rest}</span></div>`;
const controls = `<div class="lm-controls"><button type="button" class="lm-fire" data-fire><span class="lm-lamp" aria-hidden="true"></span><span data-fire-label>${TEXT.fr.liftoff}</span></button><span class="lm-hint" data-t="hint">${TEXT.fr.hint}</span><span class="lm-live" aria-live="polite" data-live></span></div>`;
const lang = `<div class="lm-lang" role="group" aria-label="Langue / Language"><button type="button" data-lang="fr" aria-pressed="true">FR</button><button type="button" data-lang="en" aria-pressed="false">EN</button></div>`;
const stage = `<div class="lm-stage" tabindex="0" role="group" aria-label="${TEXT.fr.aria}">${backSvg}<canvas class="lm-gl" aria-hidden="true"></canvas>${frontSvg}<div class="lm-flash" aria-hidden="true"></div></div>`;
const body = `<figure class="iso-figure lm"><div class="iso-plate">${corners}${lang}${stage}${controls}</div><figcaption class="iso-legend"><span class="lm-parts">${PART_BUTTONS}</span><span class="iso-caption" data-t="caption">${TEXT.fr.caption}</span></figcaption></figure>`;

const CSS = readFileSync(join(HERE, "../shared/forbits.css"), "utf8");
const LIVE = readFileSync(join(HERE, "live-2d.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:wght@700&display=swap" rel="stylesheet">`;
const page = k.pageHtml({ title: "FORBITS · Module lunaire Eagle", theme: THEME, body: `${FONTS}<style>${CSS}</style>${body}`, script: kitScript() + glScript() + LIVE, width: 1080 }).replace('<html lang="en">', '<html lang="fr">');
const name = THEME === "light" ? "lunar-module-light.html" : "lunar-module.html";
writeFileSync(join(HERE, "../../pages", name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `${R.solids.length} shapes`, `front from ${firstMoving}`);

// excused after an 8× look: the bell is clipped at the deck plane by the page; rim-on-sphere strut ends; the LRRR legs end flush on the panel's back
const ALLOW = [["aps.bell", "descent.*"], ["gear.piston*", "gear.socket*"], ["gear.piston*", "gear.fitting*"], ["gear.piston*", "gear.secondary*"], ["lrrr.panel", "lrrr.leg*"]];
A.auditOrExit(R, P, { allow: ALLOW });
