import { CaretLeft, CaretRight, ClockCounterClockwise, Pause, Play } from '@phosphor-icons/react'
import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'

import { useI18n } from '../i18n/useI18n'
import {
  eventsInYear,
  milestoneYears,
  phaseAt,
  TIMELINE_END_YEAR,
  TIMELINE_START_YEAR,
} from '../lib/timeline'
import type { EquipmentSummary } from '../types/api'
import styles from './TimeMachine.module.css'

/** Durée d'une année pendant la lecture automatique. */
const PLAY_STEP_MS = 450

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
  const { t } = useI18n()
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
          <ClockCounterClockwise aria-hidden="true" weight="bold" /> {t.timeMachine.title}
        </h2>
        <p className={styles.year} aria-live="polite">
          <span className="visually-hidden">{t.timeMachine.yearShown}</span>
          {year}
        </p>
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.playButton} onClick={togglePlay}>
          {isPlaying ? <Pause aria-hidden="true" weight="fill" /> : <Play aria-hidden="true" weight="fill" />}
          <span className="visually-hidden">{isPlaying ? t.timeMachine.pause : t.timeMachine.play}</span>
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => jumpTo(previousMilestone)}
          disabled={previousMilestone === undefined}
        >
          <CaretLeft aria-hidden="true" weight="bold" />
          <span className="visually-hidden">{t.timeMachine.previous}</span>
        </button>

        <label htmlFor={sliderId} className="visually-hidden">
          {t.timeMachine.sliderLabel(TIMELINE_START_YEAR, TIMELINE_END_YEAR)}
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
          <span className="visually-hidden">{t.timeMachine.next}</span>
        </button>
        <button type="button" className={styles.todayButton} onClick={() => jumpTo(TIMELINE_END_YEAR)}>
          {t.timeMachine.today}
        </button>
      </div>

      <p className={styles.summary}>
        <span className={styles.chipWorking}>{t.timeMachine.working(working)}</span>
        {traveling > 0 && <span className={styles.chipTraveling}>{t.timeMachine.traveling(traveling)}</span>}
        <span className={styles.chipEnded}>{t.timeMachine.ghosts(ended)}</span>
      </p>

      <ul className={styles.events} aria-live="polite">
        {events.length === 0 ? (
          <li className={styles.quiet}>{t.timeMachine.quiet}</li>
        ) : (
          events.map((event) => (
            <li key={`${event.kind}-${event.hero.slug}`} className={styles[event.kind]}>
              {t.timeMachine.events[event.kind]} <Link to={`/heros/${event.hero.slug}`}>{event.hero.name}</Link>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
