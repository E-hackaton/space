const D = __DATA__;
const root = document.querySelector(".lm");
const stage = root.querySelector(".lm-stage");
const backSvg = stage.querySelector(".lm-back");
const frontSvg = stage.querySelector(".lm-front");
const sorted = frontSvg.querySelector(".lm-sorted");
const readout = root.querySelector("[data-readout]");
const live = root.querySelector("[data-live]");
const fire = root.querySelector("[data-fire]");
const fireLabel = root.querySelector("[data-fire-label]");
const flashEl = stage.querySelector(".lm-flash");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const LIGHT = document.body.dataset.theme === "light" ? 1 : 0;
const M = D.model.unitsPerMetre;
const P = D.P;

// ---------- language ----------
let lang = "fr";
try { lang = localStorage.getItem("forbits-lang") === "en" ? "en" : "fr"; } catch (error) {}
const T = () => D.text[lang];
const partText = (id) => D.parts.find((part) => part.id === id)[lang];
function applyLang() {
  document.documentElement.lang = lang;
  root.querySelectorAll("[data-t]").forEach((el) => {
    const key = el.dataset.t;
    el.textContent = key.startsWith("part.") ? partText(key.slice(5)).name : T()[key];
  });
  root.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  stage.setAttribute("aria-label", T().aria);
  backSvg.setAttribute("aria-label", T().label);
  fireLabel.textContent = phase === "left" || phase === "burn" ? T().rewind : T().liftoff;
  dirty = true;
  run();
}
root.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
  lang = b.dataset.lang;
  try { localStorage.setItem("forbits-lang", lang); } catch (error) {}
  applyLang();
}));
const num = (value, digits) => {
  const text = value.toFixed(digits);
  return lang === "fr" ? text.replace(".", ",") : text;
};

// ---------- items ----------
const EZ = D.ez;
const nodes = [...frontSvg.querySelectorAll(".lm-sorted > .it")].map((el) => {
  const [mx, my, mz] = el.dataset.m.split(",").map(Number);
  return { el, piece: el.dataset.piece, ride: el.dataset.ride || el.dataset.piece, key: Number(el.dataset.k), lift: (mx * D.V[0] + my * D.V[1] + mz * D.V[2]), moves: mz !== 0 };
});
const allItems = [...stage.querySelectorAll(".it")];
const apsClip = frontSvg.querySelector(".lm-clip");
const apsItem = apsClip ? apsClip.closest(".it") : null;
let order = nodes.map((_, i) => i);

// ---------- ascent physics (the same model as the caption) ----------
const { thrust: F_APS, isp, mass0 } = D.model.aps;
const MDOT = F_APS / (isp * D.model.g0);
const ascent = { t: 0, h: 0, v: 0, build: 0 };
function stepAscent(dt) {
  const n = Math.max(1, Math.ceil(dt * 240));
  for (let i = 0; i < n; i++) {
    const s = dt / n;
    ascent.build = Math.min(1, ascent.t / 0.15);
    const m = mass0 - MDOT * ascent.t;
    const a = (F_APS * ascent.build) / m - D.model.g;
    if (ascent.h > 0 || a > 0) { ascent.v += a * s; ascent.h += ascent.v * s; }
    ascent.t += s;
  }
}

// ---------- flag: a rigid pole pivoting at its foot under lunar gravity ----------
const flag = { th: 0, w: 0, falling: false };
const FL = D.flag;
const POLE_M = FL.pole / M;
const FLAG_C = (3 * D.model.g) / (2 * POLE_M);
const FLAG_REST = Math.PI / 2 - 0.03;
const flagEls = {
  pole: frontSvg.querySelector(".lm-flag-pole"),
  cloth: frontSvg.querySelector(".lm-flag-cloth"),
  stripes: frontSvg.querySelector(".lm-flag-stripes"),
  edge: frontSvg.querySelector(".lm-flag-edge"),
  foot: frontSvg.querySelector(".lm-flag-foot"),
};
const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const WIDE = (() => { const a = (D.P.azimuth + 90) * Math.PI / 180; return [Math.cos(a), Math.sin(a), 0]; })();
// it fell toward the camera side, flat on the regolith (Aldrin saw it go over)
const NORMAL = (() => { const n = [-WIDE[1], WIDE[0], 0]; return n[0] * D.V[0] + n[1] * D.V[1] > 0 ? n : vmul(n, -1); })();
function drawFlag() {
  const foot = [FL.at[0], FL.at[1], 0];
  const c = Math.cos(flag.th);
  const s = Math.sin(flag.th);
  const up = [NORMAL[0] * s, NORMAL[1] * s, c]; // the pole tips over away from the stage
  const lift = Math.max(0, 0.9 * s); // a lying pole rests on its own radius
  const base = vadd(foot, [0, 0, lift * 0.6]);
  const top = vadd(base, vmul(up, FL.pole));
  const [cw, ch] = FL.cloth;
  const corner = (u, v) => vadd(vadd(top, vmul(WIDE, u)), vmul(up, -v));
  const pts = [corner(0, 0), corner(cw, 0), corner(cw, ch), corner(0, ch)].map((p) => iso(p, P));
  flagEls.pole.setAttribute("d", pathOf([iso(base, P), iso(top, P)]));
  flagEls.cloth.setAttribute("d", pathOf(pts, true));
  flagEls.edge.setAttribute("d", pathOf(pts, true) + pathOf([iso(vadd(top, vmul(WIDE, cw)), P), iso(vadd(top, vmul(WIDE, cw + 2)), P)]));
  const lines = [];
  for (let i = 1; i < 7; i++) {
    const v = (ch * i) / 7;
    const u0 = v < ch * 0.54 ? cw * 0.4 : 0;
    lines.push(pathOf([iso(corner(u0, v), P), iso(corner(cw, v), P)]));
  }
  lines.push(pathOf([iso(corner(cw * 0.4, 0), P), iso(corner(cw * 0.4, ch * 0.54), P), iso(corner(0, ch * 0.54), P)]));
  flagEls.stripes.setAttribute("d", lines.join(""));
  const f = iso(foot, P);
  flagEls.foot.setAttribute("cx", f[0].toFixed(1));
  flagEls.foot.setAttribute("cy", f[1].toFixed(1));
}

// ---------- debris: shreds of gold foil thrown off by the staging, ballistic in vacuum ----------
const DEBRIS = 42;
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const flecks = Array.from({ length: DEBRIS }, () => {
  const a = rand() * Math.PI * 2;
  const r = 40 + rand() * 30;
  const out = (1.6 + rand() * 3.6) * M;
  return { p0: [Math.cos(a) * r, -6 + Math.sin(a) * r, 120 + rand() * 10], v: [Math.cos(a) * out, Math.sin(a) * out, (0.8 + rand() * 3.2) * M], spin: 4 + rand() * 9, phase: rand() * 6.28, life: 1.6 + rand() * 1.4 };
});
const NS = "http://www.w3.org/2000/svg";
const debrisBack = document.createElementNS(NS, "g");
const debrisFront = document.createElementNS(NS, "g");
debrisBack.setAttribute("class", "lm-debris");
debrisFront.setAttribute("class", "lm-debris");
backSvg.appendChild(debrisBack);
sorted.after(debrisFront);
const dots = flecks.map(() => {
  const b = document.createElementNS(NS, "circle");
  const f = document.createElementNS(NS, "circle");
  b.setAttribute("r", "1.1");
  f.setAttribute("r", "1.1");
  b.style.display = f.style.display = "none";
  debrisBack.appendChild(b);
  debrisFront.appendChild(f);
  return { b, f };
});
const ASC_DEPTH = 0 * D.V[0] + -6 * D.V[1] + 170 * D.V[2];
function drawDebris(age) {
  const g = D.model.g * M;
  flecks.forEach((fl, i) => {
    const { b, f } = dots[i];
    if (age <= 0 || age > fl.life || still.matches) { b.style.display = f.style.display = "none"; return; }
    let z = fl.p0[2] + fl.v[2] * age - 0.5 * g * age * age;
    const p = [fl.p0[0] + fl.v[0] * age, fl.p0[1] + fl.v[1] * age, Math.max(z, 0)];
    const r = Math.hypot(p[0], p[1]);
    const fade = Math.min(1, (fl.life - age) / 0.5) * Math.min(1, age / 0.06) * (z < 0 ? Math.max(0, 1 + z / 20) : 1) * Math.max(0, Math.min(1, (D.ground + 60 - r) / 60));
    const glint = 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(fl.spin * age + fl.phase)), 6);
    const s = iso(p, P);
    const near = p[0] * D.V[0] + p[1] * D.V[1] + p[2] * D.V[2] > ASC_DEPTH;
    const on = near ? f : b;
    const off = near ? b : f;
    off.style.display = "none";
    on.style.display = "";
    on.setAttribute("cx", s[0].toFixed(1));
    on.setAttribute("cy", s[1].toFixed(1));
    on.setAttribute("opacity", (fade * glint).toFixed(3));
  });
}

// ---------- WebGL: staging flash, the faint vacuum plume, light on the deck ----------
const FRAGMENT = `
uniform float uFlash;
uniform float uFlashR;
uniform float uThrust;
uniform float uH;
uniform float uLight;
const vec2 AX=vec2(0.,-14.);
const float DECK=${D.deckZ.toFixed(1)};
float octagon(vec2 p){
  vec2 q=abs(p);
  float d=max(q.x,q.y);
  d=max(d,(q.x+q.y)*0.70710678);
  return d-84.5;
}
vec4 over(vec4 top,vec4 under){return top+under*(1.-top.a);}
vec4 inkFor(vec3 seen,float cover){vec3 absorbed=1.-seen;float a=max(max(absorbed.r,max(absorbed.g,absorbed.b)),cover);return vec4(vec3(a)-absorbed,a);}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 V=towardViewer();
  vec3 p0=rayOf(vb);
  float px=pixelOf();
  // staging flash: a glowing shell around the interstage
  vec3 C=vec3(0.,-6.,130.);
  vec3 d=C-p0;
  float dist=length(d-dot(d,V)*V);
  float flash=uFlash*(exp(-pow(dist/uFlashR,2.))*.85+exp(-pow(dist/(uFlashR*.32),2.))*.9);
  // plume: from the bell's exit plane down to the deck, widening as it expands into vacuum
  float plume=0.;
  float ez=DECK-30.+uH;
  if(uThrust>.001&&ez>DECK+.5){
    float t0=(DECK-p0.z)/V.z;
    float t1=(ez-p0.z)/V.z;
    for(int i=0;i<20;i++){
      float f=(float(i)+hash12(gl_FragCoord.xy+float(i)*7.13+fract(uTime)*31.))/20.;
      vec3 p=p0+mix(t0,t1,f)*V;
      float zd=ez-p.z;
      float rad=7.+zd*.7;
      float r=length(p.xy-AX);
      plume+=exp(-pow(r/rad,2.))*(64./(rad*rad))*smoothstep(0.,6.,zd+6.);
    }
    plume*=abs(t1-t0)/20.*.03*uThrust;
  }
  // exhaust spreading over the deck it was standing on
  vec3 q=onFloor(vb,DECK);
  float rise=max(uH-30.,0.);
  float onDeck=1.-smoothstep(-.7*px,.7*px,octagon(q.xy));
  float deck=uThrust*onDeck*exp(-rise/150.)*exp(-pow(length(q.xy-AX)/(18.+.45*rise),2.))*smoothstep(0.,4.,uH);
  vec3 dark=vec3(1.,.82,.55)*flash*1.3+vec3(1.,.64,.42)*plume+vec3(1.,.55,.28)*deck*.55;
  dark=tonemap(dark,1.1);
  float m=max(dark.r,max(dark.g,dark.b));
  float n=(hash12(gl_FragCoord.xy+fract(uTime*.61)*91.)+hash12(gl_FragCoord.yx*1.37+fract(uTime*.37)*57.)-1.)/255.;
  dark=max(dark+n*smoothstep(0.,1.5/255.,m),0.);
  vec4 outDark=vec4(dark,max(dark.r,max(dark.g,dark.b)));
  // paper: a saturated body with a pale core for the flash, an orange tint for the plume and the deck
  float e=1.-exp(-2.2*flash);
  vec3 seenFlash=mix(vec3(1.),vec3(1.,.7,.18),smoothstep(0.,.45,e));
  seenFlash=mix(seenFlash,vec3(1.,.97,.86),smoothstep(.62,.95,e));
  vec4 inkFlash=inkFor(seenFlash,.9*smoothstep(.6,.92,e));
  float ep=1.-exp(-1.8*(plume+deck*.6));
  vec4 inkPlume=vec4(vec3(.95,.48,.16)*ep*.42,ep*.42);
  vec4 ink=over(inkFlash,inkPlume);
  ink.rgb=min(ink.rgb,vec3(ink.a));
  ink+=n*smoothstep(0.,1.5/255.,ink.a);
  ink=max(ink,0.);
  gl_FragColor=mix(outDark,ink,uLight);
}`;
let layer = null;
try {
  layer = glLayer({ canvas: stage.querySelector(".lm-gl"), fragment: FRAGMENT, view: [D.W, D.H], camera: D.camera, uniforms: ["uFlash", "uFlashR", "uThrust", "uH"], fixed: { uLight: LIGHT } });
} catch (error) { layer = null; }
if (layer) stage.setAttribute("data-gl", "");
const flashAt = iso([0, -6, 130], P);
flashEl.style.setProperty("--gx", `${((flashAt[0] / D.W) * 100).toFixed(2)}%`);
flashEl.style.setProperty("--gy", `${((flashAt[1] / D.H) * 100).toFixed(2)}%`);

// ---------- selection ----------
const buttons = [...root.querySelectorAll(".lm-part")];
let selected = null;
function select(id) {
  if (id === selected) return;
  selected = id;
  allItems.forEach((el) => (id && el.dataset.piece === id ? el.setAttribute("data-on", "") : el.removeAttribute("data-on")));
  id ? stage.setAttribute("data-focus", "") : stage.removeAttribute("data-focus");
  buttons.forEach((b) => (b.dataset.part === id ? b.setAttribute("data-on", "") : b.removeAttribute("data-on")));
  dirty = true;
  run();
}

// ---------- state ----------
let phase = "rest"; // rest · burn · left · return
let burnClock = 0;
let returnFrom = 0;
const back = { x: 0, v: 0 };
let dirty = true;
let lastText = "";
function say(text) {
  if (text !== lastText) { readout.textContent = text; lastText = text; }
}
function announce(text) { live.textContent = text; }
function liftoff() {
  if (phase === "burn" || phase === "left") return rewind();
  phase = "burn";
  burnClock = 0;
  Object.assign(ascent, { t: 0, h: 0, v: 0, build: 0 });
  flag.th = 0.02; flag.w = 0; flag.falling = false;
  fire.dataset.state = "burn";
  fireLabel.textContent = T().rewind;
  announce(T().phases.armed);
  if (still.matches) {
    phase = "left";
    ascent.h = 999;
    flag.th = FLAG_REST;
    fire.dataset.state = "left";
    announce(T().phases.left);
  }
  run();
}
function rewind() {
  if (phase === "rest" || phase === "return") return;
  phase = "return";
  returnFrom = Math.min(ascent.h * M, 640);
  back.x = 1; back.v = 0;
  fire.dataset.state = "";
  fireLabel.textContent = T().liftoff;
  if (still.matches) { back.x = 0; }
  run();
}

// ---------- the loop ----------
let frame = 0;
let last = 0;
let clock = 0;
let visible = false;
let liftUnits = 0;
function place() {
  const dy = EZ[1] * liftUnits;
  const dx = EZ[0] * liftUnits;
  for (const node of nodes) {
    if (!node.moves) continue;
    if (liftUnits > 0.01) node.el.setAttribute("transform", `translate(${(dx).toFixed(2)} ${(dy).toFixed(2)})`);
    else node.el.removeAttribute("transform");
  }
  const share = liftUnits / D.lift[2];
  const next = nodes.map((_, i) => i).sort((a, b) => nodes[a].key + (nodes[a].moves ? nodes[a].lift * share : 0) - (nodes[b].key + (nodes[b].moves ? nodes[b].lift * share : 0)));
  if (next.some((v, i) => v !== order[i])) {
    const frag = document.createDocumentFragment();
    next.forEach((i) => frag.appendChild(nodes[i].el));
    sorted.appendChild(frag);
    order = next;
  }
  // the ascent bell shows only above the deck plane it sits in
  if (apsClip) {
    const s = Math.max(0, Math.min(liftUnits, D.aps.len));
    const r = D.aps.r0 + (D.aps.r1 - D.aps.r0) * Math.pow(s / D.aps.len, D.aps.q);
    const c = iso([D.aps.o[0], D.aps.o[1], D.deckZ], P);
    const k = D.camera.k;
    const rx = r * k + 0.6;
    const ry = r * k * D.camera.cam[2] + 0.6;
    const big = 4000;
    const d = liftUnits >= D.aps.len ? `M${-big} ${-big}H${big}V${big}H${-big}Z` : `M${(c[0] - big).toFixed(1)} ${(c[1] - big).toFixed(1)}H${(c[0] + big).toFixed(1)}V${c[1].toFixed(1)}H${(c[0] + rx).toFixed(1)}A${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 1 ${(c[0] - rx).toFixed(1)} ${c[1].toFixed(1)}H${(c[0] - big).toFixed(1)}Z`;
    apsClip.setAttribute("d", d);
    apsClip.setAttribute("transform", liftUnits > 0.01 ? `translate(${(-dx).toFixed(2)} ${(-dy).toFixed(2)})` : "");
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  const calm = still.matches;
  let active = false;
  if (touring) tour(dt);
  if (phase === "burn") {
    burnClock += dt;
    stepAscent(dt);
    if (burnClock > 0.25 && !flag.falling) { flag.falling = true; flag.w = 0.45; }
    if (burnClock > 12) { phase = "left"; fire.dataset.state = "left"; announce(T().phases.left); }
    active = true;
  }
  if (phase === "return") {
    const moving = settle(back, 0, dt, 0.42, calm);
    ascent.h = (returnFrom * back.x) / M;
    flag.th = Math.min(flag.th, FLAG_REST * back.x * 1.0);
    flag.falling = false;
    if (!moving || back.x < 1e-3) { phase = "rest"; ascent.h = 0; flag.th = 0; back.x = 0; announce(T().phases.rest); }
    active = true;
  }
  if (flag.falling && flag.th < FLAG_REST) {
    const n = 4;
    for (let i = 0; i < n; i++) {
      flag.w += FLAG_C * Math.sin(flag.th) * (dt / n);
      flag.th += flag.w * (dt / n);
    }
    if (flag.th >= FLAG_REST) { flag.th = FLAG_REST; flag.w = 0; }
    active = true;
  }
  liftUnits = phase === "rest" ? 0 : Math.min(ascent.h * M, 2000);
  place();
  drawFlag();
  // readout from the same model that moves the stage
  if (phase === "burn") {
    const t = T();
    const v = ascent.v;
    const text = `T+${num(ascent.t, 1)} s · ${num(ascent.h, ascent.h < 100 ? 1 : 0)} m · ${num(v, 1)} m/s · ${ascent.t < D.model.aps.rise ? t.rising : t.pitch}`;
    say(text);
  } else if (phase === "left") say(T().left);
  else if (phase === "return") say(T().returning);
  else if (selected) say(`${partText(selected).name} · ${partText(selected).say}`);
  else say(T().rest);
  // effects
  const age = phase === "burn" ? burnClock : -1;
  const flash = calm || age < 0 ? 0 : burst(age, 0.06, 0.22);
  const thrust = phase === "burn" && !calm ? smooth(0, 0.15, age) : 0;
  drawDebris(phase === "burn" ? age : -1);
  if (layer) {
    if (flash > 1e-3 || (thrust > 1e-3 && liftUnits < 900)) layer.draw({ uFlash: flash, uFlashR: 34 + 90 * smooth(0, 0.35, age), uThrust: thrust, uH: liftUnits }, clock);
    else layer.clear();
  } else flashEl.style.opacity = (flash * 0.8).toFixed(3);
  if (age >= 0 && age < 3.5) active = true;
  const keep = active || touring || dirty;
  dirty = false;
  frame = visible && keep ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); }
}
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

// ---------- idle tour ----------
const TOUR = ["ascent", "windows", "antennas", "rcs", "descent", "gear", "probes", "ladder", "mesa", "lrrr", "psep", "liftoff", "wait", "wait", "wait", "rewind", "dps", "flag"];
let touring = !still.matches;
let tourClock = 0;
let tourStep = -1;
let idleTimer = 0;
function tour(dt) {
  tourClock += dt;
  const step = Math.floor(tourClock / 2.6) % TOUR.length;
  if (step === tourStep) return;
  tourStep = step;
  const what = TOUR[step];
  if (what === "liftoff") { select(null); if (phase === "rest") liftoff(); }
  else if (what === "rewind") { if (phase === "left" || phase === "burn") rewind(); }
  else if (what !== "wait") { if (phase === "rest") select(what); }
}
function takeOver() {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (!still.matches) { touring = true; tourClock = 0; tourStep = -1; run(); } }, 9000);
}

// ---------- input ----------
stage.addEventListener("pointermove", (event) => {
  takeOver();
  const item = event.target.closest && event.target.closest(".it");
  const id = item && item.dataset.piece !== "stand" ? item.dataset.piece : null;
  select(id);
});
stage.addEventListener("pointerleave", () => select(null));
stage.addEventListener("click", (event) => {
  const item = event.target.closest && event.target.closest(".it");
  if (!item) return;
  takeOver();
  select(item.dataset.piece !== "stand" ? item.dataset.piece : null);
});
buttons.forEach((b) => {
  b.addEventListener("mouseenter", () => { takeOver(); select(b.dataset.part); });
  b.addEventListener("focus", () => { takeOver(); select(b.dataset.part); });
  b.addEventListener("click", () => { takeOver(); select(b.dataset.part); });
});
fire.addEventListener("click", () => { takeOver(); liftoff(); });
stage.addEventListener("keydown", (event) => {
  const ids = D.parts.map((p) => p.id);
  let index = ids.indexOf(selected);
  if (event.key === "ArrowRight" || event.key === "ArrowDown") index = (index + 1) % ids.length;
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") index = (index - 1 + ids.length) % ids.length;
  else if (event.key === "Home") index = 0;
  else if (event.key === "End") index = ids.length - 1;
  else if (event.key === "l" || event.key === "L" || event.key === " " || event.key === "Enter") { event.preventDefault(); takeOver(); liftoff(); return; }
  else if (event.key === "Escape") { takeOver(); select(null); rewind(); return; }
  else return;
  event.preventDefault();
  takeOver();
  select(ids[index]);
  announce(`${partText(ids[index]).name} · ${partText(ids[index]).say}`);
});
stage.addEventListener("focus", () => announce(selected ? partText(selected).name : T().rest));

applyLang();
drawFlag();
place();
