/**
 * Ouverture de la visite d'accueil de Sankofa, partagée entre l'en-tête (bouton « ? »)
 * et la fenêtre du guide. On mémorise si l'utilisateur l'a déjà vue, pour ne l'ouvrir
 * automatiquement qu'à la première visite.
 */

const SEEN_KEY = 'sankofa.guide.seen'
const listeners = new Set<() => void>()

let open = false

export function isGuideOpen(): boolean {
  return open
}

export function subscribeGuide(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setOpen(value: boolean): void {
  open = value
  listeners.forEach((listener) => listener())
}

export function openGuide(): void {
  setOpen(true)
}

export function closeGuide(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // stockage indisponible : le guide se rouvrira à la prochaine visite, ce n'est pas grave
  }
  setOpen(false)
}

export function hasSeenGuide(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}
