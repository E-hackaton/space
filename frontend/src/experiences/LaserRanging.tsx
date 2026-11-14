import { Lightning } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import {
  distanceFromRoundTrip,
  laserRoundTripSeconds,
  moonRecessionMeters,
  SPEED_OF_LIGHT_KM_S,
} from '../lib/physics'
import ui from '../styles/ui.module.css'
import styles from './Experience.module.css'

const ROUND_TRIP_S = laserRoundTripSeconds()
const FUTURE_SPANS = [
  { years: 100, label: '100 ans' },
  { years: 10_000, label: '10 000 ans' },
  { years: 1_000_000, label: '1 million d’années' },
] as const

const numberFr = (value: number, digits = 0) => value.toLocaleString('fr-FR', { maximumFractionDigits: digits })

/** Formate une distance en mètres ou en kilomètres, selon ce qui est le plus lisible. */
function formatLength(meters: number): string {
  return meters >= 1000 ? `${numberFr(meters / 1000, 1)} km` : `${numberFr(meters, 1)} m`
}

/**
 * Expérience : tirer un laser vers le réflecteur, chronométrer l'aller-retour, en déduire la distance.
 * L'impulsion voyage en temps réel : 2,56 secondes, comme dans un vrai observatoire.
 */
export function LaserRanging() {
  const reducedMotion = usePrefersReducedMotion()
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [future, setFuture] = useState<number>(FUTURE_SPANS[0].years)

  const inFlight = startedAt !== null && elapsed < ROUND_TRIP_S
  const finished = startedAt !== null && !inFlight

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

  return (
    <div className={styles.experience}>
      <svg viewBox="0 0 600 140" className={styles.scene} role="img" aria-label="La Terre à gauche, la Lune à droite, et l'impulsion laser entre les deux">
        <circle cx="45" cy="70" r="38" fill="#2E96F5" />
        <circle cx="575" cy="70" r="20" fill="#B8C2D9" />
        <rect x="550" y="62" width="8" height="16" fill="#EAFE07" />
        <line x1="83" y1="70" x2="550" y2="70" stroke="rgb(255 255 255 / 0.15)" strokeDasharray="4 6" />
        {inFlight && <circle cx={pulseX} cy="70" r="7" className={styles.pulse} />}
        <text x="45" y="128" textAnchor="middle" className={styles.sceneLabel}>Terre</text>
        <text x="575" y="128" textAnchor="middle" className={styles.sceneLabel}>Lune</text>
      </svg>

      <div className={styles.row}>
        <button type="button" className={ui.button} onClick={fire} disabled={inFlight}>
          <Lightning aria-hidden="true" weight="fill" /> {finished ? 'Tirer à nouveau' : 'Tirer le laser'}
        </button>
        <p className={styles.readout}>
          ⏱ {elapsed.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s
        </p>
      </div>

      <div aria-live="polite">
        {inFlight && <p>L'impulsion file vers la Lune à 300 000 km par seconde…</p>}
        {finished && (
          <div className={styles.result}>
            <p>
              <strong>Retour reçu après {numberFr(ROUND_TRIP_S, 2)} secondes !</strong>
            </p>
            <p className={styles.formula}>
              distance = vitesse de la lumière × durée ÷ 2
              <br />= {numberFr(SPEED_OF_LIGHT_KM_S)} km/s × {numberFr(ROUND_TRIP_S, 2)} s ÷ 2
              <br />≈ <strong>{numberFr(distanceFromRoundTrip(ROUND_TRIP_S))} km</strong>
            </p>
            <p>
              On divise par 2 parce que la lumière fait l'aller <em>et</em> le retour. Les vrais observatoires
              mesurent cette durée si précisément qu'ils connaissent la distance à quelques millimètres près.
            </p>
          </div>
        )}
      </div>

      {finished && (
        <fieldset className={styles.choiceGroup}>
          <legend>Et dans le futur ? La Lune s'éloigne d'environ 3,8 cm par an.</legend>
          {FUTURE_SPANS.map((span) => (
            <label key={span.years} className={styles.choice}>
              <input
                type="radio"
                name="laser-future"
                checked={future === span.years}
                onChange={() => setFuture(span.years)}
              />
              Dans {span.label}
            </label>
          ))}
          <p aria-live="polite">
            La Lune sera environ <strong>{formatLength(moonRecessionMeters(future))}</strong> plus loin qu'aujourd'hui.
          </p>
        </fieldset>
      )}
    </div>
  )
}
