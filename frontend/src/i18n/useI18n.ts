import { useSyncExternalStore } from 'react'

import { getLanguage, setLanguage, subscribeLanguage, type Language } from './languageStore'
import { en } from './messages/en'
import { fr, type Messages } from './messages/fr'

const MESSAGES: Record<Language, Messages> = { fr, en }

/** Dictionnaire d'une langue, utilisable hors des composants (ex. libellés calculés). */
export function messagesFor(language: Language): Messages {
  return MESSAGES[language]
}

/**
 * Langue courante et textes de l'interface.
 *
 * `t` est un objet typé : `t.home.title`, `t.home.heroesToDiscover(3)`. Une faute de frappe
 * dans une clé est une erreur de compilation, pas un texte manquant à l'écran.
 */
export function useI18n() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage)
  return { language, setLanguage, t: MESSAGES[language] }
}
