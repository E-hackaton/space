/**
 * Client HTTP minimal pour l'API Django.
 *
 * L'URL de base vient de la variable d'environnement VITE_API_URL. Vide par défaut :
 * en développement, le proxy Vite redirige /api vers Django (voir vite.config.ts).
 */

import { getLanguage } from '../i18n/languageStore'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

/** Erreur HTTP explicite, pour distinguer « introuvable » (404) d'une panne réseau. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type QueryParams = Record<string, string | undefined>

function buildUrl(path: string, params: QueryParams): string {
  // Chaque requête demande les textes (et les voix) dans la langue choisie par l'utilisateur.
  const query = new URLSearchParams({ lang: getLanguage() })
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, value)
  }
  return `${API_BASE_URL}/api/${path}?${query.toString()}`
}

/** Effectue un GET et renvoie le JSON typé, ou lève une ApiError. */
export async function apiGet<T>(path: string, params: QueryParams = {}, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) {
    throw new ApiError(response.status, `La requête ${path} a échoué (HTTP ${response.status}).`)
  }
  return (await response.json()) as T
}
