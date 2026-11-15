import { duckSfx } from './sfx';
import { useStore } from '../store/useStore';

/**
 * Narration : voix ElevenLabs pré-générée (MP3 servi par Django) quand elle existe,
 * sinon synthèse vocale du navigateur (Web Speech API). Le texte reste toujours affiché à l'écran.
 *
 * Pour une voix de navigateur propre :
 * - on choisit la meilleure voix installée (voix « naturelles » de Google, Microsoft, Apple),
 *   jamais eSpeak quand une autre existe : c'est elle qui « gratte » sous Linux ;
 * - on attend que la liste des voix soit chargée (elle arrive en différé) ;
 * - on lit phrase par phrase : les longues lectures se coupent ou craquent dans Chrome ;
 * - les effets sonores baissent pendant que la voix parle.
 *
 * Une seule narration à la fois : toute nouvelle lecture coupe la précédente.
 */

let player: HTMLAudioElement | null = null;
/** Identifie la lecture en cours : une lecture coupée ne doit jamais appeler le `onEnd` de la suivante. */
let token = 0;

export interface SpeakOptions {
  /** URL du MP3 ElevenLabs, ou null/undefined pour la voix du navigateur. */
  audio?: string | null;
  /** Appelé quand la lecture va jusqu'au bout (pas quand on la coupe). */
  onEnd?: () => void;
}

export function speak(text: string, lang: string, { audio, onEnd }: SpeakOptions = {}): void {
  stopSpeaking();
  const current = token;
  duckSfx(true);
  const finish = () => {
    if (token !== current) return;
    duckSfx(false);
    onEnd?.();
  };

  if (audio) {
    player = new Audio(audio);
    player.addEventListener('ended', finish);
    // Fichier introuvable ou lecture bloquée par le navigateur : on bascule sur la voix de synthèse.
    player.play().catch(() => {
      if (token === current) speakWithBrowser(text, lang, current, finish);
    });
    return;
  }
  speakWithBrowser(text, lang, current, finish);
}

export function stopSpeaking(): void {
  token += 1;
  player?.pause();
  player = null;
  window.speechSynthesis?.cancel();
  duckSfx(false);
}

/* ------------------------------------------------------------ choix de la voix */

/** Note d'une voix : plus elle est haute, plus la voix est naturelle. */
function score(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  if (/espeak|mbrola/.test(n)) return -100;
  let s = 0;
  if (/natural|neural|online/.test(n)) s += 50; // Microsoft Edge : voix neuronales
  if (/premium|enhanced|siri/.test(n)) s += 45; // Apple : voix améliorées
  if (/google/.test(n)) s += 40; // Chrome : voix Google
  if (/microsoft/.test(n)) s += 15;
  if (/amélie|amelie|thomas|audrey|marie|denise|henri|vivienne|samantha|daniel|serena|aria|jenny|guy/.test(n)) s += 10;
  if (!v.localService) s += 5; // les voix en ligne sont souvent meilleures
  if (v.default) s += 2;
  return s;
}

let cached: { lang: string; voice: SpeechSynthesisVoice | null } | null = null;

/** Voix du navigateur disponibles pour une langue, de la plus naturelle à la moins naturelle. */
export function listVoices(lang: string): SpeechSynthesisVoice[] {
  const synth = window.speechSynthesis;
  if (!synth) return [];
  const code = lang === 'fr' ? 'fr' : 'en';
  return synth
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith(code))
    .sort((a, b) => score(b) - score(a));
}

function bestVoice(lang: string): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis;
  if (!synth) return null;
  // Voix choisie dans les Paramètres, si elle existe sur cet appareil et parle la bonne langue.
  const chosen = useStore.getState().voiceName;
  if (chosen) {
    const v = synth.getVoices().find((x) => x.name === chosen && x.lang.toLowerCase().startsWith(lang === 'fr' ? 'fr' : 'en'));
    if (v) return v;
  }
  if (!chosen && cached && cached.lang === lang && cached.voice) return cached.voice;
  const code = lang === 'fr' ? 'fr' : 'en';
  const voices = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith(code));
  // Préférence régionale : France pour le français, puis tout autre français ; États-Unis / Royaume-Uni pour l'anglais.
  const region = (v: SpeechSynthesisVoice) => (code === 'fr' ? (v.lang === 'fr-FR' ? 3 : 0) : /en-(US|GB)/.test(v.lang) ? 3 : 0);
  const best = voices.sort((a, b) => score(b) + region(b) - (score(a) + region(a)))[0] ?? null;
  cached = { lang, voice: best };
  return best;
}

/** Les voix arrivent en différé : on attend au plus 1,5 s qu'elles soient là. */
function voicesReady(): Promise<void> {
  const synth = window.speechSynthesis;
  if (!synth || synth.getVoices().length) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener('voiceschanged', done);
      cached = null;
      resolve();
    };
    synth.addEventListener('voiceschanged', done);
    window.setTimeout(done, 1500);
  });
}

/** Découpe en phrases (et en morceaux de 220 caractères au plus). */
function sentences(text: string): string[] {
  const parts = text.replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]*["»”)]?\s*/g) ?? [text];
  const out: string[] = [];
  for (const p of parts) {
    const s = p.trim();
    if (!s) continue;
    if (s.length <= 220) out.push(s);
    else for (const chunk of s.match(/.{1,220}(\s|$)/g) ?? [s]) out.push(chunk.trim());
  }
  return out;
}

function speakWithBrowser(text: string, lang: string, current: number, onEnd: () => void): void {
  const synth = window.speechSynthesis;
  if (!synth) {
    onEnd();
    return;
  }
  void voicesReady().then(() => {
    if (token !== current) return;
    const voice = bestVoice(lang);
    // Seule eSpeak est installée : sa voix grince ; on garde les sous-titres sans la voix.
    if (voice && /espeak|mbrola/i.test(voice.name) && voice.name !== useStore.getState().voiceName) {
      // On laisse le temps de lire les sous-titres, comme si la voix parlait.
      window.setTimeout(() => token === current && onEnd(), Math.max(3000, text.length * 55));
      return;
    }
    const queue = sentences(text);
    const next = (i: number) => {
      if (token !== current) return;
      if (i >= queue.length) {
        onEnd();
        return;
      }
      const u = new SpeechSynthesisUtterance(queue[i]);
      u.lang = voice?.lang ?? (lang === 'fr' ? 'fr-FR' : 'en-US');
      if (voice) u.voice = voice;
      u.rate = useStore.getState().voiceRate;
      u.pitch = 1;
      u.volume = 1;
      u.onend = () => next(i + 1);
      u.onerror = () => next(i + 1);
      synth.speak(u);
    };
    next(0);
  });
}
