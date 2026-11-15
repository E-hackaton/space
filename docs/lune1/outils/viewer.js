// Script intégré dans chaque SVG : affiche le modèle 3D officiel de la NASA (encodé dans le SVG),
// le fait tourner et zoomer, et annote ses pièces au survol avec des étiquettes SVG.
// Regroupé en un seul script par outils/build.mjs.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const SVG = "http://www.w3.org/2000/svg";
const doc = document;
const $ = (id) => doc.getElementById(id);
const E = JSON.parse($("engin-data").textContent);
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const params = new URLSearchParams(location.search);
const svgEl = (tag, attrs = {}, parent) => {
  const el = doc.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.append(el);
  return el;
};

// ---------- scène ----------
const host = $("scene");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
host.append(renderer.domElement);
const canvas = renderer.domElement;

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const sun = new THREE.DirectionalLight(0xfff1e0, 2.2);
sun.position.set(3, 5, 4);
scene.add(sun, new THREE.HemisphereLight(0xbfd4ff, 0x3a2a20, 0.5));

const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.12;
controls.maxDistance = 9;
controls.autoRotateSpeed = 0.9;

const holder = new THREE.Group();
scene.add(holder);
const marker = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0xff7a2e, transparent: true, opacity: 0.3, depthTest: false }));
marker.visible = false;
marker.renderOrder = 5;
scene.add(marker);

const vec = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const home = () => ({ az: E.view?.az ?? 35, el: E.view?.el ?? 18, dist: E.view?.dist ?? 3.4, target: E.view?.target || [0, 0, 0] });
function setCamera(az, el, dist, target = [0, 0, 0]) {
  const a = (az * Math.PI) / 180;
  const e = (el * Math.PI) / 180;
  controls.target.copy(vec(target));
  camera.position.set(target[0] + dist * Math.cos(e) * Math.sin(a), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(e) * Math.cos(a));
  controls.update();
}

// ---------- repères et étiquette (éléments SVG) ----------
const dotsG = $("dots");
const label = $("label");
const lead = svgEl("path", { class: "lead" }, label);
const card = svgEl("rect", { class: "card", rx: 9 }, label);
const nameT = svgEl("text", { class: "name" }, label);
const descT = svgEl("text", { class: "desc" }, label);
const pin = svgEl("circle", { class: "pin", r: 5 }, label);

function wrap(text, width) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > width) {
      lines.push(line);
      line = word;
    } else line = line ? line + " " + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

let model = null;
let mixer = null;
const spinners = [];
let running = false;
let focus = null;
let locked = null;
let fly = null;
let touched = false;
const dots = E.parts.map((p) => {
  const el = svgEl("circle", { class: "dot", r: 4.5, "data-part": p.id, tabindex: 0, role: "img", "aria-label": p.name }, dotsG);
  const t = svgEl("title", {}, el);
  t.textContent = p.name;
  el.addEventListener("pointerenter", () => show(p));
  el.addEventListener("pointerleave", () => show(locked));
  el.addEventListener("focus", () => show(p));
  el.addEventListener("blur", () => show(locked));
  el.addEventListener("click", () => toggleLock(p));
  el.addEventListener("dblclick", () => zoomTo(p));
  return { p, el, pos: vec(p.at), all: [p.at, ...(p.more || [])].map(vec), hidden: false };
});

function show(p) {
  if (p === focus) return;
  focus = p;
  dots.forEach((d) => d.el.classList.toggle("on", d.p === p));
  label.classList.toggle("off", !p);
  if (p) {
    nameT.textContent = p.name;
    descT.textContent = "";
    wrap(p.desc, 46).slice(0, 5).forEach((line, i) => {
      const s = svgEl("tspan", { x: 0, dy: i ? 17 : 0 }, descT);
      s.textContent = line;
    });
  }
  let tinted = false;
  if (model)
    model.traverse((o) => {
      if (!o.isMesh) return;
      const on = !!p && o.userData.part === p;
      tinted = tinted || on;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (m.emissive) {
          if (m.userData.e0 === undefined) m.userData.e0 = [m.emissive.getHex(), m.emissiveIntensity];
          m.emissive.setHex(on ? 0xff5a00 : m.userData.e0[0]);
          m.emissiveIntensity = on ? 0.55 : m.userData.e0[1];
        } else if (m.color) {
          if (m.userData.c0 === undefined) m.userData.c0 = m.color.getHex();
          m.color.setHex(on ? 0xffb080 : m.userData.c0);
        }
      });
    });
  marker.visible = !!p && !tinted;
  if (p) {
    marker.position.copy(vec(p.at));
    marker.scale.setScalar((p.r || E.r || 0.06) * 1.6);
  }
}
// Place l'étiquette près du repère, du côté où il y a de la place.
function placeLabel(x, y) {
  const W = innerWidth;
  const H = innerHeight;
  const nb = nameT.getBBox();
  const db = descT.getBBox();
  const w = Math.max(nb.width, db.width) + 28;
  const h = 36 + db.height;
  const right = x + 40 + w < W - 10;
  const bx = right ? x + 40 : x - 40 - w;
  const by = Math.max(10, Math.min(H - h - 10, y - h - 26 > 10 ? y - h - 26 : y + 26));
  card.setAttribute("x", bx);
  card.setAttribute("y", by);
  card.setAttribute("width", w);
  card.setAttribute("height", h);
  nameT.setAttribute("transform", `translate(${bx + 14} ${by + 24})`);
  descT.setAttribute("transform", `translate(${bx + 14} ${by + 45})`);
  [...descT.children].forEach((s) => s.setAttribute("x", 0));
  const ax = right ? bx : bx + w;
  const ay = by + (y < by ? 0 : y > by + h ? h : h / 2);
  lead.setAttribute("d", `M${x.toFixed(1)} ${y.toFixed(1)} L${(ax + (right ? -14 : 14)).toFixed(1)} ${ay.toFixed(1)} L${ax.toFixed(1)} ${ay.toFixed(1)}`);
  pin.setAttribute("cx", x);
  pin.setAttribute("cy", y);
}

function flyTo(target, dist) {
  const dir = camera.position.clone().sub(controls.target).normalize();
  fly = { t0: controls.target.clone(), t1: vec(target), d0: camera.position.distanceTo(controls.target), d1: dist, dir, k: 0 };
}
function stopAuto() {
  controls.autoRotate = false;
  if (!touched) {
    touched = true;
    $("hint").classList.add("off");
  }
}
function toggleLock(p) {
  stopAuto();
  if (p && p.toggles) running = !running;
  locked = p && locked !== p ? p : null;
  focus = undefined;
  show(locked || p);
}
function zoomTo(p) {
  stopAuto();
  locked = p;
  focus = undefined;
  show(p);
  flyTo(p.at, p.zoom || 1.2);
}
function goHome() {
  locked = null;
  show(null);
  const h = home();
  flyTo(h.target, h.dist);
}

// ---------- modèle encodé dans le SVG ----------
async function load() {
  const bin = atob($("glb").textContent.replace(/\s+/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer, "");
  model = gltf.scene;
  const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
  holder.scale.setScalar(1 / sphere.radius);
  holder.position.copy(sphere.center).multiplyScalar(-1 / sphere.radius);
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
    o.userData.part = null; // le nœud nommé le plus proche décide de la pièce
    for (let n = o; n; n = n.parent) {
      const found = E.parts.find((p) => p.match && new RegExp(p.match).test(n.name));
      if (found) {
        o.userData.part = found;
        break;
      }
    }
  });
  holder.add(model);
  holder.updateMatrixWorld(true);
  if (gltf.animations.length) {
    mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
  }
  (E.spin || []).forEach((sp) => {
    const node = model.getObjectByName(sp.node);
    if (node) spinners.push({ node, axis: vec(sp.axis).normalize(), speed: sp.speed, pivot: new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3()) });
  });
  $("loading").classList.add("off");
  controls.autoRotate = !still && !params.has("still");
  if (params.has("run")) running = true;
  doc.documentElement.dataset.ready = "1";
}
const h0 = home();
setCamera(h0.az, h0.el, h0.dist, h0.target);
load().catch((error) => {
  $("loading").textContent = "Le modèle n'a pas pu être chargé : " + error.message;
});

// ---------- pointeur ----------
const mouse = new THREE.Vector2();
const ray = new THREE.Raycaster();
let down = null;
function partUnder(ev) {
  if (!model) return null;
  const r = canvas.getBoundingClientRect();
  mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObject(model, true)[0];
  if (!hit) return null;
  // Le maillage touché appartient à une pièce (`match`) : elle l'emporte, sauf sur une pièce
  // sans maillage propre (ex. batteries dans le fuselage) dont le repère est tout proche.
  const owner = hit.object.userData.part || null;
  let best = null;
  let bestD = Infinity;
  for (const d of dots) {
    if (owner && d.p !== owner && d.p.match) continue;
    for (const q of d.all) {
      const dist = q.distanceTo(hit.point) / (d.p.reach || 0.12);
      if (dist < 1 && dist < bestD) {
        best = d.p;
        bestD = dist;
      }
    }
  }
  return best || owner;
}
canvas.addEventListener("pointerdown", (ev) => {
  stopAuto();
  fly = null;
  down = [ev.clientX, ev.clientY];
});
canvas.addEventListener("wheel", () => {
  stopAuto();
  fly = null;
}, { passive: true });
canvas.addEventListener("pointermove", (ev) => {
  if (ev.buttons) return;
  const p = partUnder(ev);
  canvas.style.cursor = p ? "pointer" : "grab";
  show(p || locked);
});
canvas.addEventListener("pointerleave", () => show(locked));
canvas.addEventListener("pointerup", (ev) => {
  if (!down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 5) return;
  toggleLock(partUnder(ev));
});
canvas.addEventListener("dblclick", (ev) => {
  const p = partUnder(ev);
  if (p) zoomTo(p);
  else goHome();
});
addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") goHome();
  else if (ev.key === "+" || ev.key === "=") flyTo(controls.target.toArray(), Math.max(controls.minDistance, camera.position.distanceTo(controls.target) * 0.72));
  else if (ev.key === "-") flyTo(controls.target.toArray(), Math.min(controls.maxDistance, camera.position.distanceTo(controls.target) * 1.4));
});

// ---------- boucle ----------
function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const mA = new THREE.Matrix4();
const mB = new THREE.Matrix4();
function turnAbout(node, pivot, axis, angle) {
  if (!angle) return;
  node.parent.updateWorldMatrix(true, false);
  mA.makeTranslation(pivot.x, pivot.y, pivot.z).multiply(mB.makeRotationAxis(axis, angle)).multiply(mB.makeTranslation(-pivot.x, -pivot.y, -pivot.z));
  node.updateMatrix();
  mB.copy(node.parent.matrixWorld).invert().multiply(mA).multiply(node.parent.matrixWorld).multiply(node.matrix);
  mB.decompose(node.position, node.quaternion, node.scale);
}
const clock = new THREE.Clock();
const tmp = new THREE.Vector3();
let speed = 0;
let frameNo = 0;
const screenOf = (p) => {
  tmp.copy(p).project(camera);
  return [(tmp.x * 0.5 + 0.5) * innerWidth, (-tmp.y * 0.5 + 0.5) * innerHeight, tmp.z];
};
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  speed += ((running ? 1 : 0) - speed) * (1 - Math.exp(-dt / 0.6));
  if (mixer) {
    mixer.timeScale = speed;
    mixer.update(dt);
  }
  spinners.forEach((sp) => turnAbout(sp.node, sp.pivot, sp.axis, sp.speed * speed * dt));
  if (fly) {
    fly.k = Math.min(1, fly.k + dt / 0.7);
    const e = fly.k * fly.k * (3 - 2 * fly.k);
    controls.target.lerpVectors(fly.t0, fly.t1, e);
    camera.position.copy(controls.target).addScaledVector(fly.dir, fly.d0 + (fly.d1 - fly.d0) * e);
    if (fly.k >= 1) fly = null;
  }
  controls.update();
  renderer.render(scene, camera);
  frameNo++;
  dots.forEach((d, i) => {
    const [x, y, z] = screenOf(d.pos);
    d.el.setAttribute("cx", x.toFixed(1));
    d.el.setAttribute("cy", y.toFixed(1));
    if (model && (frameNo + i) % 6 === 0) {
      const dist = camera.position.distanceTo(d.pos);
      ray.set(camera.position, tmp.copy(d.pos).sub(camera.position).normalize());
      const hit = ray.intersectObject(model, true)[0];
      // caché si le modèle coupe le rayon nettement avant le repère (tolérance à l'échelle de la pièce)
      const tol = Math.min(0.03, Math.max(0.006, (d.p.reach || 0.12) * 0.4));
      d.hidden = z > 1 || !!(hit && hit.distance < dist - tol);
      d.el.classList.toggle("hidden", d.hidden);
    }
  });
  if (focus) {
    const [x, y] = screenOf(vec(focus.at));
    placeLabel(x, y);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- outils de réglage des annotations (développement) ----------
window.__pick = (az, el, dist, cols = 30, rows = 20, target = [0, 0, 0]) => {
  controls.autoRotate = false;
  setCamera(az, el, dist, target);
  renderer.render(scene, camera);
  const out = {};
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      ray.setFromCamera(new THREE.Vector2(((c + 0.5) / cols) * 2 - 1, -((r + 0.5) / rows) * 2 + 1), camera);
      const hit = model && ray.intersectObject(model, true)[0];
      if (hit) out[c + "," + r] = hit.point.toArray().map((v) => Math.round(v * 1000) / 1000).concat(hit.object.name);
    }
  return out;
};
window.__view = (az, el, dist, target) => {
  controls.autoRotate = false;
  setCamera(az, el, dist, target || [0, 0, 0]);
};
window.__show = (id) => {
  controls.autoRotate = false;
  const p = E.parts.find((q) => q.id === id) || null;
  locked = p;
  focus = undefined;
  show(p);
};
