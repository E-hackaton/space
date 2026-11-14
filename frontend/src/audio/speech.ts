/**
 * Narration provisoire par synthèse vocale du navigateur (Web Speech API).
 * Sera remplacée par les voix enregistrées (Howler) ; le texte reste toujours affiché à l'écran.
 */
export function speak(text: string, lang: string, onEnd?: () => void): void {
  const synth = window.speechSynthesis;
  if (!synth) {
    onEnd?.();
    return;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
  u.rate = 1;
  const voice = synth.getVoices().find((v) => v.lang.startsWith(u.lang.slice(0, 2)));
  if (voice) u.voice = voice;
  if (onEnd) u.onend = () => onEnd();
  synth.speak(u);
}

export function stopSpeaking(): void {
  window.speechSynthesis?.cancel();
}
