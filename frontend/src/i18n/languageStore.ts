/**
 * Langue de l'interface et du contenu, mémorisée sur l'appareil.
 *
 * Un petit store externe (comme la collection) : le client API le lit pour chaque requête,
 * et les composants s'y abonnent avec useSyncExternalStore (voir useI18n).
 */

export type Language = 'fr' | 'en'

export const LANGUAGES: readonly Language[] = ['fr', 'en']

const STORAGE_KEY = 'sankofa.language'
const listeners = new Set<() => void>()

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language === value)
}

/** Langue de départ : celle choisie précédemment, sinon celle du navigateur, sinon le français. */
function initialLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (isLanguage(saved)) return saved
  } catch {
    // stockage indisponible (navigation privée…) : on se rabat sur le navigateur
  }
  return window.navigator.language.toLowerCase().startsWith('en') ? 'en' : 'fr'
}

let current: Language = initialLanguage()
document.documentElement.lang = current

export function getLanguage(): Language {
  return current
}

export function setLanguage(language: Language): void {
  if (language === current) return
  current = language
  // L'attribut lang permet aux lecteurs d'écran de prononcer le texte avec le bon accent.
  document.documentElement.lang = language
  try {
    window.localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // le choix reste valable jusqu'à la fermeture de l'onglet
  }
  listeners.forEach((listener) => listener())
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
