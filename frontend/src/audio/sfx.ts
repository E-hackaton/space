/*
 * Effets sonores, synthétisés en direct avec la Web Audio API : aucun fichier, aucun droit d'auteur.
 *
 * Chaque monde sonne selon sa physique :
 * - Terre : air dense, moteur clair et crissement des roues sur le sol ;
 * - Mars : atmosphère très ténue (moins de 1 % de la pression terrestre), sons plus faibles et étouffés ;
 * - Lune : pas d'air, donc pas de son dans le vide. On n'entend que ce qui passe par la structure
 *   du véhicule : une vibration sourde, très filtrée.
 *
 * Rien ne joue avant un geste de l'utilisateur (règle des navigateurs).
 */

export type SoundWorld = 'earth' | 'mars' | 'moon' | 'space';

const PROFILE: Record<SoundWorld, { cutoff: number; volume: number; grit: number; pitch: number }> = {
  earth: { cutoff: 1800, volume: 1, grit: 0.5, pitch: 1 },
  mars: { cutoff: 700, volume: 0.45, grit: 0.25, pitch: 0.9 },
  moon: { cutoff: 260, volume: 0.55, grit: 0, pitch: 0.75 },
  space: { cutoff: 900, volume: 0.5, grit: 0, pitch: 1.3 },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;

function audio(): AudioContext | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.55 : 0;
    master.connect(ctx.destination);
    // Bruit blanc (2 s, en boucle) : base des grondements, du sable et des réacteurs.
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ctx;
}

/** À appeler sur un geste de l'utilisateur : débloque le son. */
export function unlockSfx() {
  const a = audio();
  if (a && a.state === 'suspended') void a.resume();
}

/** Coupe ou rétablit tous les effets. */
export function setSfxEnabled(on: boolean) {
  enabled = on;
  if (master && ctx) master.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.05);
}

function noiseSource(a: AudioContext) {
  const s = a.createBufferSource();
  s.buffer = noise;
  s.loop = true;
  return s;
}

/* ------------------------------------------------------------ moteur continu */

interface Engine {
  osc: OscillatorNode;
  sub: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  grit: BiquadFilterNode;
  gritGain: GainNode;
  src: AudioBufferSourceNode;
}
let engine: Engine | null = null;

function startEngine(a: AudioContext): Engine {
  const osc = a.createOscillator();
  osc.type = 'sawtooth';
  const sub = a.createOscillator();
  sub.type = 'triangle';
  const filter = a.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 2;
  const gain = a.createGain();
  gain.gain.value = 0;
  osc.connect(filter);
  sub.connect(filter);
  filter.connect(gain).connect(master!);
  // Roues sur le sol : bruit filtré autour de 2 à 3 kHz.
  const src = noiseSource(a);
  const grit = a.createBiquadFilter();
  grit.type = 'bandpass';
  grit.frequency.value = 2400;
  grit.Q.value = 0.8;
  const gritGain = a.createGain();
  gritGain.gain.value = 0;
  src.connect(grit).connect(gritGain).connect(master!);
  osc.start();
  sub.start();
  src.start();
  return { osc, sub, filter, gain, grit, gritGain, src };
}

/**
 * Moteur du véhicule : à appeler à chaque image avec la vitesse (unités/s).
 * `on` faux : le moteur s'éteint doucement.
 */
export function engineUpdate(world: SoundWorld, speed: number, on: boolean, kind: 'rover' | 'hover' = 'rover') {
  const a = ctx;
  if (!a || a.state !== 'running') return;
  if (!engine) engine = startEngine(a);
  const p = PROFILE[world];
  const s = Math.min(1, Math.abs(speed) / (kind === 'hover' ? 3 : 8));
  const t = a.currentTime;
  const base = (kind === 'hover' ? 70 : 38) * p.pitch;
  engine.osc.frequency.setTargetAtTime(base + s * 90 * p.pitch, t, 0.08);
  engine.sub.frequency.setTargetAtTime((base + s * 90 * p.pitch) / 2, t, 0.08);
  engine.filter.frequency.setTargetAtTime(p.cutoff * (0.35 + s * 0.65), t, 0.1);
  const idle = kind === 'hover' ? 0.07 : 0.04;
  engine.gain.gain.setTargetAtTime(on ? (idle + s * 0.14) * p.volume : 0, t, 0.15);
  engine.gritGain.gain.setTargetAtTime(on && kind === 'rover' ? s * 0.12 * p.grit : 0, t, 0.1);
}

export function engineStop() {
  if (!engine || !ctx) return;
  const e = engine;
  engine = null;
  e.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
  e.gritGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
  window.setTimeout(() => {
    e.osc.stop();
    e.sub.stop();
    e.src.stop();
  }, 600);
}

/* ------------------------------------------------------------ événements */

function burst(a: AudioContext, { from, to, q = 0.7, attack, hold, release, level, type = 'lowpass' as BiquadFilterType }: { from: number; to: number; q?: number; attack: number; hold: number; release: number; level: number; type?: BiquadFilterType }) {
  const t = a.currentTime;
  const src = noiseSource(a);
  const f = a.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + attack + hold);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level, t + attack);
  g.gain.setValueAtTime(level, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  src.connect(f).connect(g).connect(master!);
  src.start(t);
  src.stop(t + attack + hold + release + 0.1);
}

function tone(a: AudioContext, { f0, f1, dur, level, type = 'sine' as OscillatorType, delay = 0 }: { f0: number; f1: number; dur: number; level: number; type?: OscillatorType; delay?: number }) {
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Décollage : allumage, grondement qui monte, puis s'éloigne (~5 s). */
export function playLiftoff(world: SoundWorld = 'earth') {
  const a = audio();
  if (!a) return;
  const p = PROFILE[world];
  tone(a, { f0: 180, f1: 60, dur: 0.5, level: 0.3 * p.volume, type: 'square' });
  burst(a, { from: 200, to: p.cutoff * 1.2, attack: 1.2, hold: 2.2, release: 2, level: 0.9 * p.volume });
  tone(a, { f0: 48, f1: 30, dur: 4.5, level: 0.45 * p.volume, type: 'sine', delay: 0.2 });
  // crépitement des gaz
  burst(a, { from: 3000, to: 1500, attack: 0.6, hold: 2, release: 1.5, level: 0.15 * p.volume, type: 'highpass' });
}

/** Atterrissage : rétrofusée qui faiblit, puis contact avec le sol. */
export function playLanding(world: SoundWorld) {
  const a = audio();
  if (!a) return;
  const p = PROFILE[world];
  burst(a, { from: Math.max(400, p.cutoff), to: 150, attack: 0.4, hold: 2.8, release: 0.8, level: 0.7 * p.volume });
  tone(a, { f0: 70, f1: 28, dur: 0.7, level: 0.6, type: 'sine', delay: 3.6 });
  burst(a, { from: 600, to: 80, attack: 0.01, hold: 0.05, release: 0.6, level: 0.4 * p.volume });
}

/** Détection d'un objet oublié : double « ping » radio avec écho. */
export function playDetect() {
  const a = audio();
  if (!a) return;
  tone(a, { f0: 880, f1: 870, dur: 0.18, level: 0.25 });
  tone(a, { f0: 1320, f1: 1300, dur: 0.3, level: 0.22, delay: 0.16 });
  tone(a, { f0: 1320, f1: 1300, dur: 0.3, level: 0.07, delay: 0.5 });
}

/** Découverte confirmée (l'histoire commence) : accord montant. */
export function playFound() {
  const a = audio();
  if (!a) return;
  [523, 659, 784].forEach((f, i) => tone(a, { f0: f, f1: f, dur: 0.6, level: 0.12, type: 'triangle', delay: i * 0.09 }));
}

/** Choc contre un rocher. */
export function playBump(world: SoundWorld) {
  const a = audio();
  if (!a) return;
  const p = PROFILE[world];
  burst(a, { from: Math.min(1200, p.cutoff), to: 90, attack: 0.005, hold: 0.03, release: 0.35, level: 0.5 * p.volume });
  tone(a, { f0: 90, f1: 45, dur: 0.25, level: 0.35 });
}

/* ------------------------------------------------------------ ambiance de l'espace (accueil) */

/*
 * Dans le vide, il n'y a pas de son : cette ambiance est une musique d'atmosphère, pas un
 * enregistrement. Accord grave qui respire, souffle filtré, et rares notes cristallines en écho.
 */
interface Ambience {
  out: GainNode;
  nodes: AudioScheduledSourceNode[];
  timer: number;
}
let ambience: Ambience | null = null;

export function startSpaceAmbience() {
  const a = audio();
  if (!a || ambience) return;
  if (a.state === 'suspended') void a.resume();
  const t = a.currentTime;
  const out = a.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(1, t + 4);
  out.connect(master!);
  const nodes: AudioScheduledSourceNode[] = [];

  // Écho long, partagé par l'accord et les notes.
  const delay = a.createDelay(2);
  delay.delayTime.value = 0.9;
  const feedback = a.createGain();
  feedback.gain.value = 0.45;
  const wet = a.createGain();
  wet.gain.value = 0.35;
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(out);

  // Accord grave (la, mi, la) légèrement désaccordé, filtré, qui respire.
  const pad = a.createBiquadFilter();
  pad.type = 'lowpass';
  pad.frequency.value = 420;
  pad.Q.value = 3;
  const padGain = a.createGain();
  padGain.gain.value = 0.055;
  pad.connect(padGain).connect(out);
  padGain.connect(delay);
  for (const [f, type] of [[55, 'sine'], [82.4, 'triangle'], [110.3, 'sine'], [164.8, 'triangle']] as [number, OscillatorType][]) {
    const o = a.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = (Math.random() - 0.5) * 12;
    o.connect(pad);
    o.start(t);
    nodes.push(o);
  }
  const breath = a.createOscillator();
  breath.frequency.value = 0.07;
  const breathDepth = a.createGain();
  breathDepth.gain.value = 260;
  breath.connect(breathDepth).connect(pad.frequency);
  breath.start(t);
  nodes.push(breath);

  // Souffle cosmique : bruit dans un filtre étroit qui ondule.
  const src = noiseSource(a);
  const band = a.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 700;
  band.Q.value = 6;
  const windGain = a.createGain();
  windGain.gain.value = 0.035;
  src.connect(band).connect(windGain).connect(out);
  const sweep = a.createOscillator();
  sweep.frequency.value = 0.045;
  const sweepDepth = a.createGain();
  sweepDepth.gain.value = 450;
  sweep.connect(sweepDepth).connect(band.frequency);
  src.start(t);
  sweep.start(t);
  nodes.push(src, sweep);

  // Notes cristallines (gamme pentatonique), toutes les 4 à 9 secondes.
  const SCALE = [880, 987.8, 1174.7, 1318.5, 1568, 1760];
  const ping = () => {
    if (!ambience) return;
    const now = a.currentTime;
    const o = a.createOscillator();
    o.type = 'sine';
    o.frequency.value = SCALE[Math.floor(Math.random() * SCALE.length)];
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.03, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 3);
    o.connect(g);
    g.connect(out);
    g.connect(delay);
    o.start(now);
    o.stop(now + 3.1);
    ambience.timer = window.setTimeout(ping, 4000 + Math.random() * 5000);
  };
  ambience = { out, nodes, timer: window.setTimeout(ping, 2500) };
}

export function stopSpaceAmbience() {
  if (!ambience || !ctx) return;
  const { out, nodes, timer } = ambience;
  ambience = null;
  window.clearTimeout(timer);
  out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5);
  window.setTimeout(() => {
    nodes.forEach((n) => n.stop());
    out.disconnect();
  }, 2500);
}
