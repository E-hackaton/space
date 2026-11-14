import { useEffect, useRef, useState } from 'react'

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

/**
 * Lecture à voix haute en français, avec la synthèse vocale du navigateur (Web Speech API).
 * Utile aux plus jeunes lecteurs et aux élèves malvoyants. Aucun service externe n'est appelé.
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  // On garde l'énoncé en cours : quand on en lance un nouveau, l'ancien est annulé et déclenche
  // son événement « end ». Sans ce repère, il couperait l'indicateur du nouvel énoncé.
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null)

  // On coupe la voix en quittant la page.
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel()
    }
  }, [])

  function speak(text: string) {
    if (!isSupported) return
    const synth = window.speechSynthesis
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.95
    const frenchVoice = synth.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('fr'))
    if (frenchVoice) utterance.voice = frenchVoice

    const finish = () => {
      if (currentUtterance.current === utterance) {
        currentUtterance.current = null
        setSpeaking(false)
      }
    }
    utterance.onend = finish
    utterance.onerror = finish

    currentUtterance.current = utterance
    setSpeaking(true)
    synth.speak(utterance)
  }

  function stop() {
    if (!isSupported) return
    currentUtterance.current = null
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  return { supported: isSupported, speaking, speak, stop }
}
