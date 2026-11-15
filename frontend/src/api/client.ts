import type { ApiEquipmentDetail, ApiEquipmentSummary } from './types';

/**
 * Accès à l'API Django. Par défaut, même origine que le site (Caddy en production,
 * proxy Vite en développement) ; `VITE_API_URL` permet de viser un backend hébergé ailleurs.
 */
const API_ROOT = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiError extends Error {}

/**
 * Copie statique de l'API (backend : `python manage.py export_static_api`), utilisée quand Django
 * ne répond pas : le site reste complet hors ligne ou serveur arrêté.
 */
const STATIC_ROOT = '/data/api';
/** L'API a déjà échoué pendant cette visite : on ne la sollicite plus (pas d'erreurs en rafale). */
let apiDown = false;

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal });
    if (!response.ok) throw new ApiError(`${response.status} sur ${url}`);
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

async function getJson<T>(path: string, lang: string, staticPath: string): Promise<T> {
  if (!apiDown) {
    try {
      const url = `${API_ROOT}${path}${path.includes('?') ? '&' : '?'}lang=${encodeURIComponent(lang)}`;
      return await fetchJson<T>(url, 5000);
    } catch {
      apiDown = true;
    }
  }
  return fetchJson<T>(`${STATIC_ROOT}/${staticPath}`, 10000);
}

export const fetchEquipmentList = (lang: string) => getJson<ApiEquipmentSummary[]>('/equipment/', lang, `equipment-${lang === 'en' ? 'en' : 'fr'}.json`);

export const fetchEquipment = (slug: string, lang: string) =>
  getJson<ApiEquipmentDetail>(`/equipment/${encodeURIComponent(slug)}/`, lang, `equipment/${encodeURIComponent(slug)}-${lang === 'en' ? 'en' : 'fr'}.json`);
