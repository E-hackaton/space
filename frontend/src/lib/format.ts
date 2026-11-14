import type { IsoDate } from '../types/api'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Formate une date ISO (« 2004-01-25 ») en français (« 25 janvier 2004 »).
 *
 * La date est construite en UTC : sinon, selon le fuseau du navigateur, « 2004-01-25 »
 * pourrait s'afficher « 24 janvier ».
 */
export function formatDate(value: IsoDate | null): string | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)))
}

export function yearOf(value: IsoDate | null): string | null {
  return value ? value.slice(0, 4) : null
}
