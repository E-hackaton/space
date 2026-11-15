/**
 * Débloque l'audio au premier clic de l'utilisateur (règle des navigateurs).
 * Provisoire : sera remplacé par l'initialisation de Howler.
 */
let unlocked = false;

export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctx) {
    const ctx = new Ctx();
    void ctx.resume().then(() => ctx.close());
  }
}
