// Construit un SVG autonome et interactif par engin (copie de docs/mars1/outils/build.mjs) : le modèle 3D est encodé
// dans le fichier, avec la visionneuse (three.js) et les pièces annotées.
// Usage : node outils/build.mjs [filtre]   →   svg/<engin>.svg
// Prérequis : les paquets de outils/package.json (npm install dans outils/, ou NODE_PATH vers un node_modules).
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULES = process.env.NODE_PATH || join(HERE, "node_modules");
const require = createRequire(join(MODULES, "x.js"));
const esbuild = require("esbuild");
const only = process.argv[2];

// Modèles sans compression Draco (outils/undraco.mjs) pour que la visionneuse n'ait besoin d'aucun décodeur.
const GLB_DIR = existsSync(join(HERE, "glb")) ? join(HERE, "glb") : join(ROOT, "modeles");

const bundle = (
  await esbuild.build({
    entryPoints: [join(HERE, "viewer.js")],
    bundle: true,
    format: "iife",
    minify: true,
    write: false,
    target: "es2020",
    nodePaths: [MODULES],
    legalComments: "none",
  })
).outputFiles[0].text;
const cdata = (text) => text.split("]]>").join("]]]]><![CDATA[>");
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = readFileSync(join(HERE, "viewer.css"), "utf8");

const engins = [];
for (const file of readdirSync(join(HERE, "engins")).filter((f) => f.endsWith(".js")).sort()) {
  const E = (await import(pathToFileURL(join(HERE, "engins", file)) + "?t=" + Date.now())).default;
  const name = file.replace(/\.js$/, "");
  engins.push({ name, E });
  if (only && !name.includes(only)) continue;
  const glb = readFileSync(join(GLB_DIR, E.file)).toString("base64").replace(/.{1,120}/g, "$&\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" class="engin" role="img" aria-label="${esc(E.title)} : modèle 3D interactif, pièces annotées au survol">
<title>${esc(E.title)} — modèle 3D interactif</title>
<desc>${esc(E.intro)} Modèle 3D : ${esc(E.credit)}. Glisser pour tourner, molette pour zoomer, survoler une pièce pour l'annoter, double-clic pour zoomer sur elle.</desc>
<defs><radialGradient id="fond" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#1b2130"/><stop offset=".62" stop-color="#0b0d13"/><stop offset="1" stop-color="#06070a"/></radialGradient></defs>
<style>${CSS}</style>
<rect class="bg" width="100%" height="100%"/>
<foreignObject x="0" y="0" width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" id="scene"></div></foreignObject>
<g id="dots"></g>
<g id="label" class="off"></g>
<text x="24" y="40"><tspan class="t-title">${esc(E.title)}</tspan><tspan class="t-sub" dx="10">${esc(E.sub)}</tspan></text>
<text id="loading" x="50%" y="50%">Chargement du modèle 3D…</text>
<text class="t-hint" id="hint" x="24" y="100%" dy="-18">glisser : tourner · molette : zoomer · survoler une pièce : l'annoter · double-clic : zoomer dessus</text>
<text class="t-credit" x="100%" y="100%" dx="-24" dy="-18" text-anchor="end">Modèle 3D : ${esc(E.creditShort ?? E.credit)}</text>
<script type="application/json" id="engin-data"><![CDATA[${cdata(JSON.stringify(E))}]]></script>
<script type="application/octet-stream" id="glb"><![CDATA[
${glb}]]></script>
<script><![CDATA[${cdata(bundle)}]]></script>
</svg>`;
  mkdirSync(join(ROOT, "svg"), { recursive: true });
  writeFileSync(join(ROOT, "svg", name + ".svg"), svg);
  console.log(`svg/${name}.svg`, (svg.length / 1e6).toFixed(1), "Mo,", E.parts.length, "pièces annotées");
}

if (existsSync(join(ROOT, "index.html"))) console.log("(index.html n'est plus généré : chaque SVG suffit)");
