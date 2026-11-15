const D = __DATA__;
const root = document.querySelector(".lm");
const stage = root.querySelector(".lm-stage");
const backSvg = stage.querySelector(".lm-back");
const liveSvg = stage.querySelector(".iso-live");
const overSvg = stage.querySelector(".lm-over");
const readout = root.querySelector("[data-readout]");
const liveRegion = root.querySelector(".lm-live");
const fire = root.querySelector("[data-fire]");
const fireLabel = root.querySelector("[data-fire-label]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const LIGHT = document.body.dataset.theme === "light" ? 1 : 0;
const M = D.model.unitsPerMetre;
const P = D.P;
const DEG = Math.PI / 180;

// ---------- language ----------
let lang = "fr";
try { lang = localStorage.getItem("forbits-lang") === "en" ? "en" : "fr"; } catch (error) {}
const T = () => D.text[lang];
const partText = (id) => D.parts.find((part) => part.id === id)[lang];
const num = (value, digits) => { const text = value.toFixed(digits); return lang === "fr" ? text.replace(".", ",") : text; };
function applyLang() {
  document.documentElement.lang = lang;
  root.querySelectorAll("[data-t]").forEach((el) => {
    const key = el.dataset.t;
    el.textContent = key.startsWith("part.") ? partText(key.slice(5)).name : T()[key];
  });
  root.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  stage.setAttribute("aria-label", T().aria3d);
  backSvg.setAttribute("aria-label", T().label);
  fireLabel.textContent = phase === "left" || phase === "burn" ? T().rewind : T().liftoff;
  kick();
}
root.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
  lang = b.dataset.lang;
  try { localStorage.setItem("forbits-lang", lang); } catch (error) {}
  applyLang();
}));

// ---------- the turning scene ----------
let renderMs = 4;
const controller = TURN.mount(stage, D.turn, { follow: (v) => v, onHold: () => { touring = false; setTimeout(() => { const v = controller.values || {}; if (typeof v.lm === "number") turn.x = turn.target = v.lm; }, 0); } });
const pieceOf = (name) => {
  const head = name.split(".")[0];
  return head === "ground" ? null : head;
};

// ---------- ascent physics (the same model as the caption) ----------
const { thrust: F_APS, isp, mass0 } = D.model.aps;
const MDOT = F_APS / (isp * D.model.g0);
const ascent = { t: 0, h: 0, v: 0 };
function stepAscent(dt) {
  const n = Math.max(1, Math.ceil(dt * 240));
  for (let i = 0; i < n; i++) {
    const s = dt / n;
    const build = Math.min(1, ascent.t / 0.15);
    const a = (F_APS * build) / (mass0 - MDOT * ascent.t) - D.model.g;
    if (ascent.h > 0 || a > 0) { ascent.v += a * s; ascent.h += ascent.v * s; }
    ascent.t += s;
  }
}
// the flag: a rigid pole pivoting at its foot under lunar gravity
const POLE_M = 84 / M;
const FLAG_C = (3 * D.model.g) / (2 * POLE_M);
const FLAG_REST = D.flagMax * DEG;
const flag = { th: 0, w: 0, falling: false };

// ---------- debris: foil shreds thrown off at staging, ballistic in vacuum ----------
const NS = "http://www.w3.org/2000/svg";
const debrisG = overSvg.querySelector(".lm-debris");
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const flecks = Array.from({ length: 42 }, () => {
  const a = rand() * Math.PI * 2;
  const r = 40 + rand() * 30;
  const out = (1.6 + rand() * 3.6) * M;
  const el = document.createElementNS(NS, "circle");
  el.setAttribute("r", "1.1");
  el.style.display = "none";
  debrisG.appendChild(el);
  return { a, r, z: 120 + rand() * 10, out, up: (0.8 + rand() * 3.2) * M, spin: 4 + rand() * 9, phase: rand() * 6.28, life: 1.6 + rand() * 1.4, el };
});
let debrisTurn = 0;
function drawDebris(age) {
  const g = D.model.g * M;
  for (const fl of flecks) {
    if (age <= 0 || age > fl.life || still.matches) { fl.el.style.display = "none"; continue; }
    const a = fl.a + debrisTurn;
    const z = fl.z + fl.up * age - 0.5 * g * age * age;
    const rr = fl.r + fl.out * age;
    const p = [Math.cos(a) * rr, Math.sin(a) * rr, Math.max(z, 0)];
    const fade = Math.min(1, (fl.life - age) / 0.5) * Math.min(1, age / 0.06) * (z < 0 ? Math.max(0, 1 + z / 20) : 1) * Math.max(0, Math.min(1, (D.ground + 60 - rr) / 60));
    const glint = 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(fl.spin * age + fl.phase)), 6);
    const s = iso(p, P);
    fl.el.style.display = "";
    fl.el.setAttribute("cx", s[0].toFixed(1));
    fl.el.setAttribute("cy", s[1].toFixed(1));
    fl.el.setAttribute("opacity", (fade * glint).toFixed(3));
  }
}

// ---------- WebGL: staging flash, faint vacuum plume, exhaust on the deck; masked by the ascent stage ----------
const FRAGMENT = GLSL_TURN + `
uniform float uFlash;
uniform float uFlashR;
uniform float uThrust;
uniform float uH;
uniform float uAng;
uniform float uLight;
const float DECK=${D.deckZ.toFixed(1)};
float octagon(vec2 p){vec2 q=abs(p);float d=max(q.x,q.y);d=max(d,(q.x+q.y)*0.70710678);return d-84.5;}
vec2 rot(vec2 p,float a){float c=cos(a),s=sin(a);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
vec4 over(vec4 top,vec4 under){return top+under*(1.-top.a);}
vec4 inkFor(vec3 seen,float cover){vec3 absorbed=1.-seen;float a=max(max(absorbed.r,max(absorbed.g,absorbed.b)),cover);return vec4(vec3(a)-absorbed,a);}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 V=towardViewer();
  vec3 p0=rayOf(vb);
  float px=pixelOf();
  vec2 AX=rot(vec2(0.,-14.),uAng);
  vec3 C=vec3(rot(vec2(0.,-6.),uAng),130.);
  vec3 d=C-p0;
  float dist=length(d-dot(d,V)*V);
  float flash=uFlash*(exp(-pow(dist/uFlashR,2.))*.85+exp(-pow(dist/(uFlashR*.32),2.))*.9);
  float plume=0.;
  float ez=DECK+uH-2.;
  if(uThrust>.001&&ez>DECK+.5){
    float t0=(DECK-p0.z)/V.z;
    float t1=(ez-p0.z)/V.z;
    for(int i=0;i<20;i++){
      float f=(float(i)+hash12(gl_FragCoord.xy+float(i)*7.13+fract(uTime)*31.))/20.;
      vec3 p=p0+mix(t0,t1,f)*V;
      float zd=ez-p.z;
      float rad=9.+zd*.7;
      float r=length(p.xy-AX);
      plume+=exp(-pow(r/rad,2.))*(81./(rad*rad));
    }
    plume*=abs(t1-t0)/20.*.03*uThrust;
  }
  vec3 q=onFloor(vb,DECK);
  float rise=max(uH,0.);
  float onDeck=1.-smoothstep(-.7*px,.7*px,octagon(rot(q.xy,-uAng)));
  float deck=uThrust*onDeck*exp(-rise/150.)*exp(-pow(length(q.xy-AX)/(18.+.45*rise),2.))*smoothstep(0.,4.,uH);
  float mask=1.-coverOf(vb,.7*px);
  vec3 dark=vec3(1.,.82,.55)*flash*1.3+vec3(1.,.64,.42)*plume+vec3(1.,.55,.28)*deck*.55;
  dark=tonemap(dark,1.1)*mask;
  float m=max(dark.r,max(dark.g,dark.b));
  float n=(hash12(gl_FragCoord.xy+fract(uTime*.61)*91.)+hash12(gl_FragCoord.yx*1.37+fract(uTime*.37)*57.)-1.)/255.;
  dark=max(dark+n*smoothstep(0.,1.5/255.,m),0.);
  vec4 outDark=vec4(dark,max(dark.r,max(dark.g,dark.b)));
  float e=1.-exp(-2.2*flash);
  vec3 seenFlash=mix(vec3(1.),vec3(1.,.7,.18),smoothstep(0.,.45,e));
  seenFlash=mix(seenFlash,vec3(1.,.97,.86),smoothstep(.62,.95,e));
  vec4 inkFlash=inkFor(seenFlash,.9*smoothstep(.6,.92,e));
  float ep=1.-exp(-1.8*(plume+deck*.6));
  vec4 inkPlume=vec4(vec3(.95,.48,.16)*ep*.42,ep*.42);
  vec4 ink=over(inkFlash,inkPlume)*mask;
  ink.rgb=min(ink.rgb,vec3(ink.a));
  ink+=n*smoothstep(0.,1.5/255.,ink.a);
  ink=max(ink,0.);
  gl_FragColor=mix(outDark,ink,uLight);
}`;
let layer = null;
try {
  layer = glLayer({ canvas: stage.querySelector(".lm-gl"), fragment: FRAGMENT, view: [D.W, D.H], camera: D.camera, uniforms: ["uFlash", "uFlashR", "uThrust", "uH", "uAng", "uCoverEdge", "uCoverCount"], fixed: { uLight: LIGHT } });
} catch (error) { layer = null; }
if (layer) stage.setAttribute("data-gl", "");
const COVER = ["ascent.cabin", "ascent.mid", "ascent.aft", "ascent.cheek-ox", "ascent.cheek-fuel", "ascent.base"];

// ---------- selection: light every live part of one assembly ----------
const buttons = [...root.querySelectorAll(".lm-part")];
let selected = null;
function select(id) {
  if (id === selected) return;
  selected = id;
  liveSvg.querySelectorAll("[data-name]").forEach((el) => {
    if (id && pieceOf(el.dataset.name) === id) el.setAttribute("data-on", "");
    else el.removeAttribute("data-on");
  });
  id ? stage.setAttribute("data-focus", "") : stage.removeAttribute("data-focus");
  buttons.forEach((b) => (b.dataset.part === id ? b.setAttribute("data-on", "") : b.removeAttribute("data-on")));
  kick();
}

// ---------- state ----------
let phase = "rest";
let burnClock = 0;
let returnFrom = 0;
const back = { x: 0, v: 0 };
const turn = { x: 0, target: 0 };
let lastText = "";
const say = (text) => { if (text !== lastText) { readout.textContent = text; lastText = text; } };
const announce = (text) => { liveRegion.textContent = text; };
function liftoff() {
  if (phase === "burn" || phase === "left") return rewind();
  phase = "burn";
  burnClock = 0;
  Object.assign(ascent, { t: 0, h: 0, v: 0 });
  Object.assign(flag, { th: 0, w: 0, falling: false });
  debrisTurn = turn.x * DEG;
  fire.dataset.state = "burn";
  fireLabel.textContent = T().rewind;
  announce(T().phases.armed);
  if (still.matches) { phase = "left"; ascent.h = 999; flag.th = FLAG_REST; fire.dataset.state = "left"; announce(T().phases.left); }
  kick();
}
function rewind() {
  if (phase === "rest" || phase === "return") return;
  phase = "return";
  returnFrom = Math.min(ascent.h * M, 700);
  Object.assign(back, { x: 1, v: 0 });
  fire.dataset.state = "";
  fireLabel.textContent = T().liftoff;
  if (still.matches) back.x = 0;
  kick();
}

// ---------- the loop ----------
let frame = 0;
let last = 0;
let clock = 0;
let visible = false;
let dirty = true;
let skip = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  const calm = still.matches;
  let active = false;
  if (touring) tour(dt);
  if (!dragging) {
    const before = turn.x;
    turn.x = calm ? turn.target : turn.x + (turn.target - turn.x) * (1 - Math.exp(-dt / 0.18));
    if (Math.abs(turn.target - turn.x) < 0.01) turn.x = turn.target;
    if (turn.x !== before) active = true;
  } else active = true;
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
    flag.th = Math.min(flag.th, FLAG_REST * back.x);
    flag.falling = false;
    if (!moving || back.x < 1e-3) { phase = "rest"; ascent.h = 0; flag.th = 0; back.x = 0; announce(T().phases.rest); }
    active = true;
  }
  if (flag.falling && flag.th < FLAG_REST) {
    for (let i = 0; i < 4; i++) { flag.w += FLAG_C * Math.sin(flag.th) * (dt / 4); flag.th += flag.w * (dt / 4); }
    if (flag.th >= FLAG_REST) { flag.th = FLAG_REST; flag.w = 0; }
    active = true;
  }
  const lift = phase === "rest" ? 0 : Math.min(ascent.h * M, 2500);
  // render the live layer, at half rate when a frame costs too much
  if (!skip || !active) {
    const t0 = performance.now();
    controller.set({ lm: turn.x, asc: lift, flag: -flag.th / DEG });
    renderMs = renderMs * 0.9 + (performance.now() - t0) * 0.1;
  }
  skip = renderMs > 14 ? !skip : false;
  // readout from the same model that moves the stage
  const deg = ((Math.round(turn.x) % 360) + 360) % 360;
  if (phase === "burn") say(`T+${num(ascent.t, 1)} s · ${num(ascent.h, ascent.h < 100 ? 1 : 0)} m · ${num(ascent.v, 1)} m/s · ${ascent.t < D.model.aps.rise ? T().rising : T().pitch}`);
  else if (phase === "left") say(T().left);
  else if (phase === "return") say(T().returning);
  else if (selected) say(`${partText(selected).name} · ${partText(selected).say}`);
  else say(`${T().rest} · ${deg}°`);
  // effects
  const age = phase === "burn" ? burnClock : -1;
  const flash = calm || age < 0 ? 0 : burst(age, 0.06, 0.22);
  const thrust = phase === "burn" && !calm ? smooth(0, 0.15, age) : 0;
  drawDebris(age);
  if (layer) {
    if (flash > 1e-3 || (thrust > 1e-3 && lift < 900)) {
      const cover = TURN.cover(controller, COVER);
      layer.draw({ uFlash: flash, uFlashR: 34 + 90 * smooth(0, 0.35, age), uThrust: thrust, uH: lift, uAng: turn.x * DEG, uCoverEdge: cover.uCoverEdge, uCoverCount: cover.uCoverCount }, clock);
    } else layer.clear();
  }
  if (age >= 0 && age < 3.5) active = true;
  const keep = active || touring || dirty;
  dirty = false;
  frame = visible && keep ? requestAnimationFrame(tick) : 0;
}
function kick() {
  dirty = true;
  if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); }
}
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) kick(); }, { rootMargin: "120px 0px" }).observe(stage);

// ---------- idle tour: a slow turn, a part at a time, a liftoff now and then ----------
const TOUR = ["ascent", "antennas", "rcs", "windows", "descent", "gear", "probes", "ladder", "mesa", "lrrr", "psep", "flag", null, "liftoff", "wait", "wait", "wait", "rewind", "dps", null];
let touring = !still.matches;
let tourClock = 0;
let tourStep = -1;
let idleTimer = 0;
function tour(dt) {
  tourClock += dt;
  if (phase === "rest") turn.target += dt * 9;
  const step = Math.floor(tourClock / 2.8) % TOUR.length;
  if (step === tourStep) return;
  tourStep = step;
  const what = TOUR[step];
  if (what === "liftoff") { select(null); if (phase === "rest") liftoff(); }
  else if (what === "rewind") { if (phase === "left" || phase === "burn") rewind(); }
  else if (what !== "wait" && phase === "rest") select(what);
}
function takeOver() {
  touring = false;
  turn.target = turn.x;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (!still.matches) { touring = true; tourClock = 0; tourStep = -1; kick(); } }, 9000);
}

// ---------- input: drag turns the disc, hover names a part ----------
let dragging = false;
let grab = null;
stage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  takeOver();
  grab = { id: event.pointerId, x: event.clientX, y: event.clientY, at: controller.angleAt(event.clientX, event.clientY, 0, "lm"), from: turn.x, live: false };
});
stage.addEventListener("pointermove", (event) => {
  if (grab && grab.id === event.pointerId) {
    if (!grab.live && Math.hypot(event.clientX - grab.x, event.clientY - grab.y) > 4) {
      grab.live = true;
      dragging = true;
      stage.setPointerCapture(event.pointerId);
      stage.setAttribute("data-drag", "");
    }
    if (grab.live) {
      const a = controller.angleAt(event.clientX, event.clientY, 0, "lm");
      turn.x = turn.target = grab.from + (a - grab.at);
      kick();
      return;
    }
  }
  if (event.pointerType === "mouse") {
    takeOver();
    const part = event.target.closest && event.target.closest("[data-name]");
    select(part ? pieceOf(part.dataset.name) : null);
  }
});
const release = (event) => {
  if (!grab || grab.id !== event.pointerId) return;
  if (!grab.live) {
    const part = event.target.closest && event.target.closest("[data-name]");
    select(part ? pieceOf(part.dataset.name) : null);
  }
  grab = null;
  dragging = false;
  stage.removeAttribute("data-drag");
  kick();
};
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);
stage.addEventListener("pointerleave", (event) => { if (!grab) select(null); });
buttons.forEach((b) => {
  b.addEventListener("mouseenter", () => { takeOver(); select(b.dataset.part); });
  b.addEventListener("focus", () => { takeOver(); select(b.dataset.part); });
  b.addEventListener("click", () => { takeOver(); select(b.dataset.part); });
});
fire.addEventListener("click", () => { takeOver(); liftoff(); });
stage.addEventListener("keydown", (event) => {
  const ids = D.parts.map((p) => p.id);
  let index = ids.indexOf(selected);
  if (event.key === "ArrowRight") { event.preventDefault(); takeOver(); turn.target = Math.round(turn.target / 15) * 15 + (event.shiftKey ? 90 : 15); kick(); return; }
  if (event.key === "ArrowLeft") { event.preventDefault(); takeOver(); turn.target = Math.round(turn.target / 15) * 15 - (event.shiftKey ? 90 : 15); kick(); return; }
  if (event.key === "Home") { event.preventDefault(); takeOver(); turn.target = Math.round(turn.target / 360) * 360; kick(); return; }
  if (event.key === "ArrowDown") index = (index + 1) % ids.length;
  else if (event.key === "ArrowUp") index = (index - 1 + ids.length) % ids.length;
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
controller.set({ lm: 0, asc: 0, flag: 0 });
