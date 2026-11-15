// Machines de la Lune : des figures Anatomy (docs/lm-anatomy, vraies cotes) vers des GLB
// (un nœud par pièce, nommé d'après la pièce) et des fichiers engins/*.js pour build.mjs,
// afin d'obtenir des figures SVG dans le même style que celles de Mars (docs/mars1).
//
//   npx esbuild export-glb.ts --bundle --platform=node --format=esm --outfile=.export-glb.mjs \
//     --external:@gltf-transform/core --node-paths=../../../frontend/node_modules && node .export-glb.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { Document, NodeIO } from '@gltf-transform/core';
import { Mesher, addShape, type AnatomyData } from '../../../frontend/src/world/anatomy/geometry';

const HERE = dirname(fileURLToPath(import.meta.url));
const ANATOMY = join(HERE, '../../../frontend/public/models/anatomy');

/** Mêmes teintes que dans le jeu (AnatomyModel). */
function look(m: string | null, tone: string): { color: string; metal: number; rough: number } {
  switch (m) {
    case 'gold': return { color: '#d9a640', metal: 0.85, rough: 0.32 };
    case 'brass': return { color: '#b98d4f', metal: 0.8, rough: 0.35 };
    case 'chrome': return { color: '#e3e7ec', metal: 1, rough: 0.14 };
    case 'steel': return { color: tone === 'hi' ? '#c3c8cd' : '#8d939a', metal: 0.75, rough: 0.35 };
    case 'gunmetal': return { color: tone === 'hi' ? '#5b616a' : '#3d424a', metal: 0.6, rough: 0.42 };
    default: return { color: tone === 'hi' ? '#ebe8e1' : tone === 'mid' ? '#aeaaa2' : '#64615c', metal: 0, rough: 0.55 };
  }
}

interface Figure {
  file: string;
  model: string;
  pieces?: string[];
  exclude?: string[];
  excludeGroups?: string[];
  /** Découper en sous-pièces (« lrrr.panel ») plutôt qu'en pièces (« lrrr »). */
  subParts?: Record<string, { name: string; desc?: string }>;
  def: Record<string, unknown>;
}

const CREDIT = 'figure FORBITS Anatomy (docs/lm-anatomy), cotes tirées des rapports de mission NASA';
const CREDIT_SHORT = 'figure FORBITS Anatomy, d’après la NASA';

const FIGURES: Figure[] = [
  {
    file: '10-surveyor',
    model: 'surveyor',
    def: {
      id: 'surveyor-3',
      title: 'Surveyor 3',
      sub: 'sonde lunaire automatique · NASA/JPL',
      facts: [['masse posée', '302 kg'], ['hauteur', '3,0 m'], ['alunissage', '20 avr. 1967'], ['images', '6 315']],
    },
  },
  {
    file: '11-eagle',
    model: 'lunar-module',
    excludeGroups: ['asc', 'flag'],
    exclude: ['lrrr', 'psep'],
    def: {
      id: 'apollo-11-eagle',
      title: 'Eagle · étage de descente',
      sub: "module lunaire d'Apollo 11 · NASA/Grumman",
      facts: [['alunissage', '20 juil. 1969'], ['moteur de descente', '45 kN'], ['site', '0,674° N · 23,473° E']],
      intro:
        "Le 21 juillet 1969, l'étage de remontée d'Eagle a décollé en se servant de l'étage de descente comme rampe de lancement. Cet étage est resté dans la mer de la Tranquillité, avec le réflecteur laser et le sismomètre.",
    },
  },
  {
    file: '12-lrv',
    model: 'lunar-rover',
    def: {
      id: 'apollo-15-lrv',
      title: 'Rover lunaire (LRV)',
      sub: 'Apollo 15, 16 et 17 · NASA/Boeing',
      facts: [['masse à vide', '210 kg'], ['charge utile', '490 kg'], ['vitesse max.', '13 km/h'], ['roues', 'Ø 82 cm']],
    },
  },
  {
    file: '13-lrrr-apollo11',
    model: 'lunar-module',
    pieces: ['lrrr'],
    def: {
      id: 'apollo-11-lrrr',
      title: "Réflecteur laser d'Apollo 11",
      sub: 'expérience LRRR · 1969',
      facts: [['coins de cube', '100']],
      intro:
        "Déposé par l'équipage d'Apollo 11 près du module lunaire, ce panneau de 100 coins de cube renvoie la lumière exactement d'où elle vient : des observatoires y tirent encore des lasers pour mesurer la distance Terre-Lune.",
    },
  },
  {
    file: '14-psep-apollo11',
    model: 'lunar-module',
    pieces: ['psep'],
    def: {
      id: 'apollo-11-psep',
      title: "Sismomètre d'Apollo 11",
      sub: 'expérience sismique passive (PSEP) · 1969',
      facts: [["durée d'écoute", 'environ 3 semaines']],
      intro: 'Alimenté par deux panneaux solaires, ce sismomètre déposé par Apollo 11 a écouté les vibrations de la Lune pendant environ trois semaines.',
    },
  },
];

const pieceOf = (n: string) => n.split('.')[0];
const hexLinear = (hex: string) => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b, 1] as [number, number, number, number]; // THREE.Color est déjà linéaire
};

const io = new NodeIO();
for (const fig of FIGURES) {
  const data = JSON.parse(readFileSync(join(ANATOMY, `${fig.model}.json`), 'utf8')) as AnatomyData & {
    pieces: { id: string; fr: string; en: string; sayFr?: string; sayEn?: string }[];
    note?: string;
  };
  const banned = new Set(data.groups.map((g, i) => (fig.excludeGroups?.includes(g.name) ? i : -1)).filter((i) => i >= 0));
  data.groups.forEach((g, i) => banned.has(g.parent) && banned.add(i));
  const parts = data.parts.filter((p) => {
    const piece = pieceOf(p.n);
    if (fig.pieces && !fig.pieces.includes(piece)) return false;
    if (fig.exclude?.includes(piece)) return false;
    return !banned.has(p.g);
  });

  // Un maillage par (pièce, matériau), dans la pose de repos.
  const zero = new THREE.Vector3();
  const buckets = new Map<string, Map<string, Mesher>>();
  for (const p of parts) {
    const piece = pieceOf(p.n);
    const key = `${p.m}|${p.t}`;
    const byMat = buckets.get(piece) ?? new Map<string, Mesher>();
    buckets.set(piece, byMat);
    const m = byMat.get(key) ?? new Mesher();
    byMat.set(key, m);
    for (const s of p.s) addShape(m, s, zero);
  }

  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(fig.file);
  const mats = new Map<string, ReturnType<Document['createMaterial']>>();
  const box = new THREE.Box3();
  const pieceBoxes = new Map<string, THREE.Box3>();
  for (const [piece, byMat] of buckets) {
    const node = doc.createNode(piece);
    const mesh = doc.createMesh(piece);
    const pb = new THREE.Box3();
    for (const [key, m] of byMat) {
      if (!m.idx.length) continue;
      const [mat, tone] = key.split('|');
      let material = mats.get(key);
      if (!material) {
        const l = look(mat === 'null' ? null : mat, tone);
        material = doc.createMaterial(key).setBaseColorFactor(hexLinear(l.color)).setMetallicFactor(l.metal).setRoughnessFactor(l.rough).setDoubleSided(true);
        mats.set(key, material);
      }
      const pos = new Float32Array(m.pos);
      for (let i = 0; i < pos.length; i += 3) pb.expandByPoint(new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2]));
      const prim = doc
        .createPrimitive()
        .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pos).setBuffer(buffer))
        .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(m.nor)).setBuffer(buffer))
        .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(m.idx)).setBuffer(buffer))
        .setMaterial(material);
      mesh.addPrimitive(prim);
    }
    node.setMesh(mesh);
    scene.addChild(node);
    box.union(pb);
    pieceBoxes.set(piece, pb);
  }
  await io.write(join(HERE, 'glb', `${fig.file}.glb`), doc);

  // Repère du visualiseur : centré sur la boîte englobante, rayon de la sphère englobante = 1.
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const norm = (v: THREE.Vector3) => v.clone().sub(sphere.center).divideScalar(sphere.radius).toArray().map((x) => Math.round(x * 1000) / 1000);
  const meta = new Map(data.pieces.map((p) => [p.id, p]));
  const partsDef = [...pieceBoxes].map(([piece, b]) => {
    const info = meta.get(piece);
    const c = b.getCenter(new THREE.Vector3());
    const size = b.getSize(new THREE.Vector3()).length() / sphere.radius;
    return {
      id: piece,
      name: info?.fr ?? piece,
      at: norm(c),
      match: `^${piece}$`,
      zoom: Math.min(1.6, Math.max(0.6, size)),
      desc: info?.sayFr ?? '',
    };
  });
  // Introduction : celle de la fiche sourcée (docs/lm-anatomy/src/<machine>/model.mjs) si on n'en donne pas.
  const { TEXT } = (await import(join(HERE, `../../lm-anatomy/src/${fig.model}/model.mjs`))) as { TEXT: { fr: { caption: string } } };
  const caption = TEXT.fr.caption;
  const def = {
    file: `${fig.file}.glb`,
    credit: CREDIT,
    creditShort: CREDIT_SHORT,
    page: 'https://nssdc.gsfc.nasa.gov/',
    intro: caption ?? '',
    view: { az: 35, el: 20, dist: 3.3, target: [0, 0, 0] },
    r: 0.045,
    ...fig.def,
    parts: partsDef,
  };
  writeFileSync(
    join(HERE, 'engins', `${fig.file}.js`),
    `// Données de l'engin ${fig.def.title} : chiffres, texte et pièces annotées (généré par export-glb.ts).\n// \`at\` = position dans le modèle normalisé (centré, rayon 1, Y vers le haut).\nexport default ${JSON.stringify(def, null, 2)};\n`,
  );
  console.log(`${fig.file}: ${partsDef.length} pièces`);
}
