import { Lightning } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useI18n } from '../i18n/useI18n'
import {
  distanceFromRoundTrip,
  laserRoundTripSeconds,
  moonRecessionMeters,
  SPEED_OF_LIGHT_KM_S,
} from '../lib/physics'
import ui from '../styles/ui.module.css'
import styles from './Experience.module.css'

const ROUND_TRIP_S = laserRoundTripSeconds()
/** Durées proposées ; leurs libellés sont dans t.experiences.laser.futureSpans, dans le même ordre. */
const FUTURE_YEARS = [100, 10_000, 1_000_000] as const

/**
 * Expérience : tirer un laser vers le réflecteur, chronométrer l'aller-retour, en déduire la distance.
 * L'impulsion voyage en temps réel : 2,56 secondes, comme dans un vrai observatoire.
 */
export function LaserRanging() {
  const { t } = useI18n()
  const text = t.experiences.laser
  const reducedMotion = usePrefersReducedMotion()
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [futureIndex, setFutureIndex] = useState(0)

  const inFlight = startedAt !== null && elapsed < ROUND_TRIP_S
  const finished = startedAt !== null && !inFlight

  const number = (value: number, digits = 0) => value.toLocaleString(t.locale, { maximumFractionDigits: digits })
  /** Distance en mètres ou en kilomètres, selon ce qui est le plus lisible. */
  const length = (meters: number) => (meters >= 1000 ? `${number(meters / 1000, 1)} km` : `${number(meters, 1)} m`)

  // Chronomètre animé image par image (requestAnimationFrame) pendant le vol de l'impulsion.
  // Sans animation, le résultat est affiché directement (voir fire()).
  useEffect(() => {
    if (startedAt === null || reducedMotion) return
    let frame = 0
    const tick = (now: number) => {
      const seconds = (now - startedAt) / 1000
      setElapsed(Math.min(seconds, ROUND_TRIP_S))
      if (seconds < ROUND_TRIP_S) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [startedAt, reducedMotion])

  function fire() {
    setElapsed(reducedMotion ? ROUND_TRIP_S : 0)
    setStartedAt(performance.now())
  }

  // Position de l'impulsion : aller (0 → 1) puis retour (1 → 0).
  const half = ROUND_TRIP_S / 2
  const position = elapsed <= half ? elapsed / half : 2 - elapsed / half
  const pulseX = 70 + position * 460
  const roundTrip = number(ROUND_TRIP_S, 2)

  return (
    <div className={styles.experience}>
      <svg viewBox="0 0 600 140" className={styles.scene} role="img" aria-label={text.sceneLabel}>
        <circle cx="45" cy="70" r="38" fill="#2E96F5" />
        <circle cx="575" cy="70" r="20" fill="#B8C2D9" />
        <rect x="550" y="62" width="8" height="16" fill="#EAFE07" />
        <line x1="83" y1="70" x2="550" y2="70" stroke="rgb(255 255 255 / 0.15)" strokeDasharray="4 6" />
        {inFlight && <circle cx={pulseX} cy="70" r="7" className={styles.pulse} />}
        <text x="45" y="128" textAnchor="middle" className={styles.sceneLabel}>
          {text.earth}
        </text>
        <text x="575" y="128" textAnchor="middle" className={styles.sceneLabel}>
          {text.moon}
        </text>
      </svg>

      <div className={styles.row}>
        <button type="button" className={ui.button} onClick={fire} disabled={inFlight}>
          <Lightning aria-hidden="true" weight="fill" /> {finished ? text.fireAgain : text.fire}
        </button>
        <p className={styles.readout}>
          ⏱ {elapsed.toLocaleString(t.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s
        </p>
      </div>

      <div aria-live="polite">
        {inFlight && <p>{text.inFlight}</p>}
        {finished && (
          <div className={styles.result}>
            <p>
              <strong>{text.returned(roundTrip)}</strong>
            </p>
            <p className={styles.formula}>
              {text.formula}
              <br />= {number(SPEED_OF_LIGHT_KM_S)} km/s × {roundTrip} s ÷ 2
              <br />≈ <strong>{number(distanceFromRoundTrip(ROUND_TRIP_S))} km</strong>
            </p>
            <p>{text.explanation}</p>
          </div>
        )}
      </div>

      {finished && (
        <fieldset className={styles.choiceGroup}>
          <legend>{text.futureLegend}</legend>
          {FUTURE_YEARS.map((years, index) => (
            <label key={years} className={styles.choice}>
              <input
                type="radio"
                name="laser-future"
                checked={futureIndex === index}
                onChange={() => setFutureIndex(index)}
              />
              {text.inFuture(text.futureSpans[index] ?? '')}
            </label>
          ))}
          <p aria-live="polite">{text.futureResult(length(moonRecessionMeters(FUTURE_YEARS[futureIndex] ?? 0)))}</p>
        </fieldset>
      )}
    </div>
  )
}
