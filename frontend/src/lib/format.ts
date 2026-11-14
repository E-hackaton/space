import type { DatePrecision, IsoDate } from '../types/api'

const OPTIONS: Record<DatePrecision, Intl.DateTimeFormatOptions> = {
  day: { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' },
  month: { month: 'long', year: 'numeric', timeZone: 'UTC' },
  year: { year: 'numeric', timeZone: 'UTC' },
}

/**
 * Formate une date ISO (« 2004-01-25 ») dans la langue de l'utilisateur :
 * « 25 janvier 2004 », « janvier 2004 » ou « 2004 » selon la précision connue.
 *
 * La date est construite et formatée en UTC : sinon, selon le fuseau du navigateur,
 * « 2004-01-25 » pourrait s'afficher « 24 janvier ».
 */
export function formatDate(value: IsoDate | null, locale: string, precision: DatePrecision = 'day'): string | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Intl.DateTimeFormat(locale, OPTIONS[precision]).format(new Date(Date.UTC(year, month - 1, day)))
}

export function yearOf(value: IsoDate | null): string | null {
  return value ? value.slice(0, 4) : null
}
