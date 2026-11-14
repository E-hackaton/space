import { useEffect, useRef, useState } from 'react'

import type { Language } from '../i18n/languageStore'

const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

const SPEECH_LANG: Record<Language, string> = { fr: 'fr-FR', en: 'en-GB' }

export interface NarrationRequest {
  text: string
  /** MP3 généré par ElevenLabs. S'il est absent, on lit le texte avec la voix du navigateur. */
  audio: string | null
  language: Language
  /** Appelé quand la lecture se termine normalement (pas quand on l'arrête). */
  onEnd?: () => void
}

/**
 * Narration d'un texte : voix naturelle ElevenLabs si le fichier existe, sinon synthèse vocale
 * du navigateur (Web Speech API). Les composants n'ont pas à savoir laquelle est utilisée.
 */
export function useNarration() {
  const [speaking, setSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Identifie la lecture en cours : une lecture annulée ne doit pas éteindre l'indicateur de la suivante.
  const tokenRef = useRef(0)

  function stop() {
    tokenRef.current += 1
    audioRef.current?.pause()
    audioRef.current = null
    if (speechSupported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  // On coupe la voix en quittant la page.
  useEffect(() => stop, [])

  function speak({ text, audio, language, onEnd }: NarrationRequest) {
    stop()
    const token = tokenRef.current
    const finish = (completed: boolean) => {
      if (tokenRef.current !== token) return
      setSpeaking(false)
      if (completed) onEnd?.()
    }

    setSpeaking(true)

    if (audio) {
      const player = new Audio(audio)
      audioRef.current = player
      player.addEventListener('ended', () => finish(true))
      // Fichier introuvable ou lecture bloquée : on bascule sur la voix du navigateur.
      player.play().catch(() => {
        if (tokenRef.current === token) speakWithBrowser(text, language, finish)
      })
      return
    }

    speakWithBrowser(text, language, finish)
  }

  return { supported: true, speaking, speak, stop }
}

function speakWithBrowser(text: string, language: Language, finish: (completed: boolean) => void) {
  if (!speechSupported) {
    finish(false)
    return
  }
  const synth = window.speechSynthesis
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = SPEECH_LANG[language]
  utterance.rate = 0.95
  const voice = synth.getVoices().find((candidate) => candidate.lang.toLowerCase().startsWith(language))
  if (voice) utterance.voice = voice
  utterance.onend = () => finish(true)
  utterance.onerror = () => finish(false)
  synth.speak(utterance)
}
