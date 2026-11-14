import { useSyncExternalStore } from 'react'

import { addToCollection, getSnapshot, subscribe } from '../lib/collectionStore'

/** Accès en lecture et en écriture à la collection de cartes de l'élève. */
export function useCollection() {
  const collected = useSyncExternalStore(subscribe, getSnapshot)

  return {
    collected,
    has: (slug: string) => collected.includes(slug),
    add: addToCollection,
  }
}
