import { CaretLeft, CaretRight, ClockCounterClockwise, Pause, Play } from '@phosphor-icons/react'
import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  eventsInYear,
  milestoneYears,
  phaseAt,
  TIMELINE_END_YEAR,
  TIMELINE_START_YEAR,
  type TimelineEventKind,
} from '../lib/timeline'
import type { EquipmentSummary } from '../types/api'
import styles from './TimeMachine.module.css'

/** Durée d'une année pendant la lecture automatique. */
const PLAY_STEP_MS = 450

const EVENT_LABELS: Record<TimelineEventKind, string> = {
  launch: 'Décollage de',
  arrival: 'Arrivée de',
  end: 'Fin de mission pour',
}

interface TimeMachineProps {
  heroes: EquipmentSummary[]
  year: number
  onYearChange: (year: number) => void
}

/**
 * La machine à remonter le temps de Sankofa (dont le nom veut dire « regarder en arrière »).
 * On choisit une année : la carte montre qui est en route, qui travaille, qui s'est tu.
 */
export function TimeMachine({ heroes, year, onYearChange }: TimeMachineProps) {
  const [playing, setPlaying] = useState(false)
  const sliderId = useId()
  const milestones = milestoneYears(heroes)
  const events = eventsInYear(heroes, year)

  const phases = heroes.map((hero) => phaseAt(hero, year))
  const working = phases.filter((phase) => phase === 'working').length
  const ended = phases.filter((phase) => phase === 'ended').length
  const traveling = phases.filter((phase) => phase === 'traveling').length

  // La lecture s'arrête d'elle-même en arrivant à aujourd'hui : c'est une valeur dérivée,
  // pas un état de plus à synchroniser.
  const isPlaying = playing && year < TIMELINE_END_YEAR

  // Lecture automatique : on avance d'un an à intervalle régulier.
  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setTimeout(() => onYearChange(year + 1), PLAY_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [isPlaying, year, onYearChange])

  function togglePlay() {
    if (isPlaying) {
      setPlaying(false)
      return
    }
    // Relancer depuis aujourd'hui repart du début : sinon le bouton ne ferait rien.
    if (year >= TIMELINE_END_YEAR) onYearChange(TIMELINE_START_YEAR)
    setPlaying(true)
  }

  function jumpTo(target: number | undefined) {
    if (target === undefined) return
    setPlaying(false)
    onYearChange(target)
  }

  const previousMilestone = [...milestones].reverse().find((value) => value < year)
  const nextMilestone = milestones.find((value) => value > year)

  return (
    <section className={styles.machine} aria-labelledby={`${sliderId}-title`}>
      <div className={styles.header}>
        <h2 id={`${sliderId}-title`} className={styles.title}>
          <ClockCounterClockwise aria-hidden="true" weight="bold" /> Machine à remonter le temps
        </h2>
        <p className={styles.year} aria-live="polite">
          <span className="visually-hidden">Année affichée : </span>
          {year}
        </p>
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.playButton} onClick={togglePlay}>
          {isPlaying ? <Pause aria-hidden="true" weight="fill" /> : <Play aria-hidden="true" weight="fill" />}
          <span className="visually-hidden">{isPlaying ? 'Mettre en pause' : 'Lancer le voyage dans le temps'}</span>
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => jumpTo(previousMilestone)}
          disabled={previousMilestone === undefined}
        >
          <CaretLeft aria-hidden="true" weight="bold" />
          <span className="visually-hidden">Événement précédent</span>
        </button>

        <label htmlFor={sliderId} className="visually-hidden">
          Choisir une année entre {TIMELINE_START_YEAR} et {TIMELINE_END_YEAR}
        </label>
        <input
          id={sliderId}
          type="range"
          className={styles.slider}
          min={TIMELINE_START_YEAR}
          max={TIMELINE_END_YEAR}
          step={1}
          value={year}
          list={`${sliderId}-milestones`}
          onChange={(event) => jumpTo(Number(event.target.value))}
        />
        <datalist id={`${sliderId}-milestones`}>
          {milestones.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>

        <button
          type="button"
          className={styles.iconButton}
          onClick={() => jumpTo(nextMilestone)}
          disabled={nextMilestone === undefined}
        >
          <CaretRight aria-hidden="true" weight="bold" />
          <span className="visually-hidden">Événement suivant</span>
        </button>
        <button type="button" className={styles.todayButton} onClick={() => jumpTo(TIMELINE_END_YEAR)}>
          Aujourd'hui
        </button>
      </div>

      <p className={styles.summary}>
        <span className={styles.chipWorking}>{working} en mission</span>
        {traveling > 0 && <span className={styles.chipTraveling}>{traveling} en route</span>}
        <span className={styles.chipEnded}>{ended} fantôme{ended > 1 ? 's' : ''}</span>
      </p>

      <ul className={styles.events} aria-live="polite">
        {events.length === 0 ? (
          <li className={styles.quiet}>Rien de nouveau cette année… Les héros poursuivent leur route.</li>
        ) : (
          events.map((event) => (
            <li key={`${event.kind}-${event.hero.slug}`} className={styles[event.kind]}>
              {EVENT_LABELS[event.kind]} <Link to={`/heros/${event.hero.slug}`}>{event.hero.name}</Link>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
