import { useEffect, useEffectEvent, useState } from 'react'

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T }

type Settled<T> = Exclude<ApiState<T>, { status: 'loading' }>

/**
 * Charge une ressource et expose son état (chargement, erreur, succès).
 *
 * @param key identifiant de la ressource (ex. `equipment:opportunity`). Quand il change,
 *            la requête est relancée et la précédente est annulée.
 * @param fetcher fonction qui effectue la requête. Elle peut changer à chaque rendu sans
 *                relancer le chargement : seul `key` compte.
 */
export function useApi<T>(key: string, fetcher: (signal: AbortSignal) => Promise<T>): ApiState<T> {
  // On mémorise la clé avec le résultat : si la clé change, l'ancien résultat est ignoré
  // et l'on renvoie « loading », sans appeler setState pendant le rendu ou l'effet.
  const [result, setResult] = useState<{ key: string; state: Settled<T> } | null>(null)

  // useEffectEvent lit toujours la dernière version de `fetcher` sans en faire une dépendance.
  const load = useEffectEvent((signal: AbortSignal) => fetcher(signal))

  useEffect(() => {
    const controller = new AbortController()

    load(controller.signal)
      .then((data) => setResult({ key, state: { status: 'success', data } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return // requête annulée volontairement : rien à afficher
        const normalized = error instanceof Error ? error : new Error(String(error))
        setResult({ key, state: { status: 'error', error: normalized } })
      })

    return () => controller.abort()
  }, [key])

  return result?.key === key ? result.state : { status: 'loading' }
}
