const D = __DATA__;
const root = document.querySelector(".lm");
const stage = root.querySelector(".lm-stage");
const backSvg = stage.querySelector(".lm-back");
const liveSvg = stage.querySelector(".iso-live");
const readout = root.querySelector("[data-readout]");
const liveRegion = root.querySelector(".lm-live");
const fire = root.querySelector("[data-fire]");
const fireLabel = root.querySelector("[data-fire-label]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const M = D.model.unitsPerMetre;
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
  fireLabel.textContent = T().dig;
  yearLabel.textContent = T().year[year];
  kick();
}
root.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
  lang = b.dataset.lang;
  try { localStorage.setItem("forbits-lang", lang); } catch (error) {}
  applyLang();
}));

// ---------- the turning scene ----------
let renderMs = 4;
const controller = TURN.mount(stage, D.turn, { follow: (v) => v, onHold: () => { touring = false; } });
const pieceOf = (name) => {
  const head = name.split(".")[0];
  return head === "ground" ? null : head;
};

// ---------- the sampler: one dig is a pure function of time, from the same module the build uses ----------
const digAt = null;
const dig = { on: false, t: 0 };
let year = 1967;
const yearButton = root.querySelector("[data-year-button]");
const yearLabel = root.querySelector("[data-year-label]");
function startDig() {
  if (year === 1969) setYear(1967);
  dig.on = true;
  dig.t = 0;
  fire.dataset.state = "burn";
  liveRegion.textContent = T().phases.dig;
  kick();
}
function setYear(y) {
  year = y;
  stage.dataset.year = String(y);
  yearLabel.textContent = T().year[y];
  if (y === 1969) { dig.on = false; dig.t = 0; fire.dataset.state = ""; }
  liveRegion.textContent = y === 1969 ? T().phases.y1969 : T().phases.y1967;
  kick();
}
yearButton.addEventListener("click", () => { takeOver(); setYear(year === 1967 ? 1969 : 1967); });
// ---------- selection ----------
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

// ---------- the loop ----------
const turn = { x: 0, target: 0 };
let lastText = "";
const say = (text) => { if (text !== lastText) { readout.textContent = text; lastText = text; } };
let frame = 0;
let last = 0;
let visible = false;
let dirty = true;
let skip = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  let active = false;
  if (touring) tour(dt);
  if (!dragging) {
    const before = turn.x;
    turn.x = calm ? turn.target : turn.x + (turn.target - turn.x) * (1 - Math.exp(-dt / 0.18));
    if (Math.abs(turn.target - turn.x) < 0.01) turn.x = turn.target;
    if (turn.x !== before) active = true;
  } else active = true;
  if (dig.on) {
    dig.t += calm ? D.digEnd : dt;
    if (dig.t >= D.digEnd) { dig.on = false; dig.t = 0; fire.dataset.state = ""; liveRegion.textContent = T().phases.rest; }
    active = true;
  }
  const arm = dig.on ? digAt(dig.t, D.dig) : { ext: 0, pitch: 12, contact: 0 };
  if (!skip || !active) {
    const t0 = performance.now();
    const values = { disc: turn.x, pitch: arm.pitch, ext: arm.ext };
    controller.set(values);
    renderMs = renderMs * 0.9 + (performance.now() - t0) * 0.1;
  }
  skip = renderMs > 14 ? !skip : false;
  const deg = ((Math.round(turn.x) % 360) + 360) % 360;
  if (dig.on) say(`${T().reach} ${num((D.dig.armLen + arm.ext) / M, 2)} m · ${num(arm.pitch, 0)}° · ${arm.contact ? T().trench : T().digging}`);
  else if (selected) say(`${partText(selected).name} · ${partText(selected).say}`);
  else if (year === 1969) say(`${T().gone} · ${deg}°`);
  else say(`${T().rest} · ${deg}°`);
  const keep = active || touring || dirty;
  dirty = false;
  frame = visible && keep ? requestAnimationFrame(tick) : 0;
}
function kick() {
  dirty = true;
  if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); }
}
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) kick(); }, { rootMargin: "120px 0px" }).observe(stage);

// ---------- idle tour: a slow turn, the parts one by one, then a lap or two ----------
const TOUR = ["frame", "legs", "verniers", "tanks", "retro", "mast", "antenna", "solar", "compartments", "camera", "omni", "sampler", null, "dig", "wait", "wait", "wait", "y1969", "wait", "wait", "y1967"];
let touring = !still.matches;
let tourClock = 0;
let tourStep = -1;
let idleTimer = 0;
function tour(dt) {
  tourClock += dt;
  if (!dig.on) turn.target += dt * 9;
  const step = Math.floor(tourClock / 2.8) % TOUR.length;
  if (step === tourStep) return;
  tourStep = step;
  const what = TOUR[step];
  if (what === "dig") { select(null); startDig(); }
  else if (what === "y1969") { select(null); setYear(1969); }
  else if (what === "y1967") setYear(1967);
  else if (what !== "wait" && !dig.on) select(what);
}
function takeOver() {
  touring = false;
  turn.target = turn.x;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (!still.matches) { touring = true; tourClock = 0; tourStep = -1; kick(); } }, 9000);
}

// ---------- input ----------
let dragging = false;
let grab = null;
stage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  takeOver();
  grab = { id: event.pointerId, x: event.clientX, y: event.clientY, at: controller.angleAt(event.clientX, event.clientY, 0, "disc"), from: turn.x, live: false };
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
      const a = controller.angleAt(event.clientX, event.clientY, 0, "disc");
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
stage.addEventListener("pointerleave", () => { if (!grab) select(null); });
buttons.forEach((b) => {
  b.addEventListener("mouseenter", () => { takeOver(); select(b.dataset.part); });
  b.addEventListener("focus", () => { takeOver(); select(b.dataset.part); });
  b.addEventListener("click", () => { takeOver(); select(b.dataset.part); });
});
fire.addEventListener("click", () => { takeOver(); if (!dig.on) startDig(); });
stage.addEventListener("keydown", (event) => {
  const ids = D.parts.map((p) => p.id);
  let index = ids.indexOf(selected);
  if (event.key === "ArrowRight") { event.preventDefault(); takeOver(); turn.target = Math.round(turn.target / 15) * 15 + (event.shiftKey ? 90 : 15); kick(); return; }
  if (event.key === "ArrowLeft") { event.preventDefault(); takeOver(); turn.target = Math.round(turn.target / 15) * 15 - (event.shiftKey ? 90 : 15); kick(); return; }
  if (event.key === "Home") { event.preventDefault(); takeOver(); turn.target = Math.round(turn.target / 360) * 360; kick(); return; }
  if (event.key === "ArrowDown") index = (index + 1) % ids.length;
  else if (event.key === "ArrowUp") index = (index - 1 + ids.length) % ids.length;
  else if (event.key === "d" || event.key === "D" || event.key === " " || event.key === "Enter") { event.preventDefault(); takeOver(); if (!dig.on) startDig(); return; }
  else if (event.key === "a" || event.key === "A") { event.preventDefault(); takeOver(); setYear(year === 1967 ? 1969 : 1967); return; }
  else if (event.key === "Escape") { takeOver(); select(null); dig.on = false; dig.t = 0; fire.dataset.state = ""; kick(); return; }
  else return;
  event.preventDefault();
  takeOver();
  select(ids[index]);
  liveRegion.textContent = `${partText(ids[index]).name} · ${partText(ids[index]).say}`;
});
stage.addEventListener("focus", () => { liveRegion.textContent = selected ? partText(selected).name : T().rest; });

applyLang();
controller.set({ disc: 0, pitch: 12, ext: 0 });
