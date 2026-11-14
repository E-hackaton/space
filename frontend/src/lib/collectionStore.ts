/**
 * Collection des cartes gagnées par l'élève, gardée dans le navigateur (localStorage).
 *
 * Un petit store externe, plutôt qu'un état React local, pour que tous les composants
 * (compteur de l'en-tête, page Collection, fiche héros) restent synchronisés.
 * Il s'utilise avec useSyncExternalStore (voir hooks/useCollection.ts).
 */

const STORAGE_KEY = 'sankofa.collection.v1'

type Listener = () => void

const listeners = new Set<Listener>()
let snapshot: readonly string[] = readFromStorage()

function readFromStorage(): string[] {
  // localStorage peut être indisponible (navigation privée, stockage bloqué) : on démarre vide.
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function persist(next: readonly string[]): void {
  snapshot = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // La collection reste disponible jusqu'à la fermeture de l'onglet : acceptable.
  }
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Doit renvoyer la même référence tant que rien ne change (exigence de useSyncExternalStore). */
export function getSnapshot(): readonly string[] {
  return snapshot
}

export function addToCollection(slug: string): void {
  if (!snapshot.includes(slug)) persist([...snapshot, slug])
}
