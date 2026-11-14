/**
 * Narration : voix ElevenLabs pré-générée (MP3 servi par Django) quand elle existe,
 * sinon synthèse vocale du navigateur (Web Speech API). Le texte reste toujours affiché à l'écran.
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
  const finish = () => {
    if (token === current) onEnd?.();
  };

  if (audio) {
    player = new Audio(audio);
    player.addEventListener('ended', finish);
    // Fichier introuvable ou lecture bloquée par le navigateur : on bascule sur la voix de synthèse.
    player.play().catch(() => {
      if (token === current) speakWithBrowser(text, lang, finish);
    });
    return;
  }
  speakWithBrowser(text, lang, finish);
}

export function stopSpeaking(): void {
  token += 1;
  player?.pause();
  player = null;
  window.speechSynthesis?.cancel();
}

function speakWithBrowser(text: string, lang: string, onEnd: () => void): void {
  const synth = window.speechSynthesis;
  if (!synth) {
    onEnd();
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
  u.rate = 1;
  const voice = synth.getVoices().find((v) => v.lang.startsWith(u.lang.slice(0, 2)));
  if (voice) u.voice = voice;
  u.onend = onEnd;
  synth.speak(u);
}
