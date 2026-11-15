import { duckSfx } from './sfx';

/**
 * Narration : uniquement les voix ElevenLabs pré-générées (MP3), pour n'entendre qu'une seule voix.
 * Un texte sans fichier audio (phrases de Sankofa construites en direct) n'est pas lu à voix haute :
 * il reste affiché, et `onEnd` est appelé après un temps de lecture, pour que le pilote auto avance.
 *
 * Une seule narration à la fois : toute nouvelle lecture coupe la précédente.
 */

let player: HTMLAudioElement | null = null;
let timer = 0;
/** Identifie la lecture en cours : une lecture coupée ne doit jamais appeler le `onEnd` de la suivante. */
let token = 0;

export interface SpeakOptions {
  /** URL du MP3 ElevenLabs ; sans elle, le texte n'est pas lu (seulement affiché). */
  audio?: string | null;
  /** Appelé quand la lecture va jusqu'au bout (pas quand on la coupe). */
  onEnd?: () => void;
}

/** Temps qu'il faut pour lire le texte à l'écran (environ 55 ms par caractère, 3 s au moins). */
const readingTime = (text: string) => Math.max(3000, text.length * 55);

export function speak(text: string, _lang: string, { audio, onEnd }: SpeakOptions = {}): void {
  stopSpeaking();
  const current = token;
  const finish = () => {
    if (token !== current) return;
    duckSfx(false);
    onEnd?.();
  };
  const silent = () => {
    timer = window.setTimeout(finish, readingTime(text));
  };

  if (!audio) {
    silent();
    return;
  }
  duckSfx(true);
  player = new Audio(audio);
  player.addEventListener('ended', finish);
  // Fichier introuvable ou lecture bloquée : on garde les sous-titres, sans autre voix.
  player.play().catch(() => {
    if (token !== current) return;
    duckSfx(false);
    silent();
  });
}

export function stopSpeaking(): void {
  token += 1;
  window.clearTimeout(timer);
  player?.pause();
  player = null;
  duckSfx(false);
}
