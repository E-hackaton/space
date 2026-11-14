/** Appels typés vers les routes de l'API des héros. */

import type { BodySlug, CelestialBody, EquipmentDetail, EquipmentSummary } from '../types/api'
import { apiGet } from './client'

export function fetchBodies(signal?: AbortSignal): Promise<CelestialBody[]> {
  return apiGet<CelestialBody[]>('bodies/', {}, signal)
}

export function fetchEquipmentList(body?: BodySlug, signal?: AbortSignal): Promise<EquipmentSummary[]> {
  return apiGet<EquipmentSummary[]>('equipment/', { body }, signal)
}

export function fetchEquipment(slug: string, signal?: AbortSignal): Promise<EquipmentDetail> {
  // encodeURIComponent : le slug vient de l'URL de la page, donc de l'utilisateur.
  return apiGet<EquipmentDetail>(`equipment/${encodeURIComponent(slug)}/`, {}, signal)
}
