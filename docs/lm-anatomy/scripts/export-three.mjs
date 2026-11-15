// Exporte la géométrie des figures Anatomy (pièces en vraies cotes) vers un JSON compact,
// lu par le jeu (frontend/src/world/anatomy) pour construire de vrais maillages Three.js.
//
//   node scripts/export-three.mjs            → les 3 machines
//   node scripts/export-three.mjs surveyor   → une seule
//
// Le script de construction de chaque machine est exécuté tel quel, mais sans écrire de page HTML.
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../../frontend/public/models/anatomy");
const realWrite = fs.writeFileSync;
fs.writeFileSync = () => {}; // les pages HTML ne sont pas regénérées ici
syncBuiltinESMExports();

const r3 = (v) => Math.round(v * 1000) / 1000;
const v3 = (p) => p.map(r3);

function shapeOf(s) {
  if (s.kind === "prism") return { k: "p", o: v3(s.F.o), a: v3(s.F.a), u: v3(s.F.u), v: v3(s.F.v), poly: s.poly.map(v3), s0: r3(s.s0), s1: r3(s.s1) };
  if (s.kind === "body") return { k: "b", o: v3(s.F.o), a: v3(s.F.a), u: v3(s.F.u), v: v3(s.F.v), poly: s.poly.map(v3) };
  if (s.kind === "ball") return { k: "s", o: v3(s.o), r: r3(s.r), ...(s.flats?.length ? { flats: s.flats.map(v3) } : {}) };
  if (s.kind === "box") return { k: "x", o: v3(s.o), axes: s.axes.map(v3), half: v3(s.half) };
  throw new Error(`forme inconnue : ${s.kind}`);
}

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ["lunar-module", "lunar-rover", "surveyor"];
fs.mkdirSync(OUT, { recursive: true });
for (const id of ids) {
  const mod = await import(join(HERE, `../src/${id}/build-3d.mjs`));
  const { T } = mod;
  const { MODEL, PARTS } = await import(join(HERE, `../src/${id}/model.mjs`));
  const groups = T.groups.map((g) => ({
    name: g.name,
    parent: g.parent ? g.parent.index : -1,
    kind: g.kind,
    origin: v3(g.origin),
    ...(g.axis ? { axis: v3(g.axis) } : {}),
    ...(g.direction ? { dir: v3(g.direction), travel: r3(g.travel) } : {}),
  }));
  const parts = T.parts
    .filter((p) => p.shapes.length && !p.name.startsWith("ground"))
    .map((p) => ({ n: p.name, g: p.group ? p.group.index : -1, m: p.material, t: p.tone, s: p.shapes.map(shapeOf) }));
  const data = {
    id,
    note: "Géométrie exportée des figures FORBITS Anatomy (docs/lm-anatomy). Repère : x avant, y gauche, z haut.",
    unitsPerMetre: MODEL.unitsPerMetre ?? 40,
    pieces: PARTS.map((p) => ({ id: p.id, fr: p.fr.name, en: p.en.name, sayFr: p.fr.say, sayEn: p.en.say })),
    groups,
    parts,
  };
  const json = JSON.stringify(data);
  realWrite(join(OUT, `${id}.json`), json);
  console.log(`${id}: ${parts.length} pièces, ${groups.length} groupes → ${(json.length / 1024).toFixed(0)} Ko`);
}
