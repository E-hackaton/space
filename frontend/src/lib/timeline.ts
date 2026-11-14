/**
 * Logique de la « machine à remonter le temps » : où en était chaque héros en une année donnée ?
 *
 * Des fonctions pures, sans React, pour qu'elles restent simples à lire et à tester.
 */

import type { EquipmentSummary } from '../types/api'

/** Première année de la frise : Surveyor 1, premier atterrissage en douceur américain sur la Lune. */
export const TIMELINE_START_YEAR = 1966
export const TIMELINE_END_YEAR = new Date().getFullYear()

/**
 * Phase d'un héros à une année donnée :
 * - `future` : pas encore lancé
 * - `traveling` : lancé, en route vers sa destination
 * - `working` : en mission
 * - `ended` : mission terminée (il devient un « fantôme »)
 */
export type HeroPhase = 'future' | 'traveling' | 'working' | 'ended'

function yearOf(date: string | null): number | null {
  return date ? Number(date.slice(0, 4)) : null
}

/** Année de fin de mission, ou null si le héros travaille encore aujourd'hui. */
export function missionEndYear(hero: EquipmentSummary): number | null {
  const explicitEnd = yearOf(hero.mission_end_date) ?? yearOf(hero.last_contact_date)
  if (explicitEnd !== null) return explicitEnd
  // Sans date de fin : toujours en service s'il est actif ou encore utile…
  if (hero.status === 'active' || hero.status === 'useful') return null
  // …sinon, sa mission s'est achevée l'année de son arrivée.
  return yearOf(hero.arrival_date) ?? yearOf(hero.launch_date)
}

export function phaseAt(hero: EquipmentSummary, year: number): HeroPhase {
  const launch = yearOf(hero.launch_date)
  const arrival = yearOf(hero.arrival_date) ?? launch

  if (launch !== null && year < launch) return 'future'
  if (arrival !== null && year < arrival) return 'traveling'

  const end = missionEndYear(hero)
  return end === null || year <= end ? 'working' : 'ended'
}

export type TimelineEventKind = 'launch' | 'arrival' | 'end'

export interface TimelineEvent {
  hero: EquipmentSummary
  kind: TimelineEventKind
}

/** Événements d'une année (lancements, arrivées, fins de mission), dans l'ordre logique. */
export function eventsInYear(heroes: EquipmentSummary[], year: number): TimelineEvent[] {
  const events: TimelineEvent[] = []
  for (const hero of heroes) {
    const launch = yearOf(hero.launch_date)
    const arrival = yearOf(hero.arrival_date)
    // Lancement et arrivée la même année (ex. Lune) : on ne garde que l'arrivée, plus parlante.
    if (launch === year && arrival !== year) events.push({ hero, kind: 'launch' })
    if (arrival === year) events.push({ hero, kind: 'arrival' })
    if (missionEndYear(hero) === year) events.push({ hero, kind: 'end' })
  }
  const order: Record<TimelineEventKind, number> = { launch: 0, arrival: 1, end: 2 }
  return events.sort((a, b) => order[a.kind] - order[b.kind])
}

/** Années qui comptent au moins un événement : ce sont les « crans » mis en valeur sur la frise. */
export function milestoneYears(heroes: EquipmentSummary[]): number[] {
  const years = new Set<number>()
  for (const hero of heroes) {
    for (const value of [yearOf(hero.launch_date), yearOf(hero.arrival_date), missionEndYear(hero)]) {
      if (value !== null) years.add(value)
    }
  }
  return [...years].sort((a, b) => a - b)
}
