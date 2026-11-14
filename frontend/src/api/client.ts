import type { ApiEquipmentDetail, ApiEquipmentSummary } from './types';

/**
 * Accès à l'API Django. Par défaut, même origine que le site (Caddy en production,
 * proxy Vite en développement) ; `VITE_API_URL` permet de viser un backend hébergé ailleurs.
 */
const API_ROOT = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiError extends Error {}

async function getJson<T>(path: string, lang: string): Promise<T> {
  const url = `${API_ROOT}${path}${path.includes('?') ? '&' : '?'}lang=${encodeURIComponent(lang)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ApiError(`${response.status} sur ${path}`);
  return (await response.json()) as T;
}

export const fetchEquipmentList = (lang: string) => getJson<ApiEquipmentSummary[]>('/equipment/', lang);

export const fetchEquipment = (slug: string, lang: string) =>
  getJson<ApiEquipmentDetail>(`/equipment/${encodeURIComponent(slug)}/`, lang);
