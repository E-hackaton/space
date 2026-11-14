import { useId, useState, type CSSProperties } from 'react'

import { useI18n } from '../i18n/useI18n'
import { hoverRpm, liftNewtons, weightNewtons, type Planet } from '../lib/physics'
import styles from './Experience.module.css'

const PLANETS: readonly Planet[] = ['earth', 'mars']
const MAX_RPM = 3000

/** Altitude d'affichage (0 à 1) : plus la portance dépasse le poids, plus l'hélicoptère monte. */
function altitudeRatio(lift: number, weight: number): number {
  if (lift <= weight) return 0
  return Math.min(1, (lift - weight) / weight)
}

/**
 * Expérience : régler la vitesse des pales d'Ingenuity pour décoller, sur Terre puis sur Mars.
 * Elle fait comprendre pourquoi voler sur Mars est si difficile : l'air y est environ 100 fois moins dense.
 */
export function IngenuityFlight() {
  const { t } = useI18n()
  const text = t.experiences.ingenuity
  const sliderId = useId()
  const [planet, setPlanet] = useState<Planet>('mars')
  const [rpm, setRpm] = useState(1200)

  const lift = liftNewtons(planet, rpm)
  const weight = weightNewtons(planet)
  const flying = lift > weight
  const altitude = altitudeRatio(lift, weight)
  const neededRpm = Math.round(hoverRpm(planet) / 10) * 10
  // Échelle commune aux deux jauges : la plus grande des deux valeurs remplit la barre.
  const gaugeMax = Math.max(lift, weight) * 1.1

  return (
    <div className={styles.experience}>
      <fieldset className={styles.choiceGroup}>
        <legend>{text.where}</legend>
        {PLANETS.map((value) => (
          <label key={value} className={styles.choice}>
            <input type="radio" name="ingenuity-planet" checked={planet === value} onChange={() => setPlanet(value)} />
            {text.planets[value]}
          </label>
        ))}
      </fieldset>

      <div className={`${styles.sky} ${planet === 'mars' ? styles.skyMars : styles.skyEarth}`}>
        {/* Le style dynamique (hauteur, vitesse des pales) passe par des variables CSS. */}
        <div
          className={styles.helicopter}
          style={{ '--altitude': altitude, '--spin': `${Math.max(0.05, 600 / Math.max(rpm, 1))}s` } as CSSProperties}
        >
          <svg viewBox="0 0 80 60" width="96" height="72" aria-hidden="true">
            <g className={rpm > 0 ? styles.rotor : undefined}>
              <rect x="4" y="6" width="72" height="3" rx="1.5" fill="#EAFE07" />
            </g>
            <rect x="38" y="8" width="4" height="14" fill="#B8C2D9" />
            <rect x="26" y="22" width="28" height="18" rx="5" fill="#2E96F5" />
            <line x1="28" y1="40" x2="16" y2="56" stroke="#B8C2D9" strokeWidth="2" />
            <line x1="52" y1="40" x2="64" y2="56" stroke="#B8C2D9" strokeWidth="2" />
          </svg>
        </div>
        <div className={styles.ground} />
      </div>

      <label htmlFor={sliderId} className={styles.sliderLabel}>
        <strong>{text.speed(rpm.toLocaleString(t.locale))}</strong>
      </label>
      <input
        id={sliderId}
        type="range"
        min={0}
        max={MAX_RPM}
        step={50}
        value={rpm}
        onChange={(event) => setRpm(Number(event.target.value))}
        className={styles.slider}
      />

      <div className={styles.gauges} aria-hidden="true">
        <span>{text.lift}</span>
        <span className={styles.gauge}>
          <span className={styles.gaugeLift} style={{ width: `${(lift / gaugeMax) * 100}%` }} />
        </span>
        <span>{text.weight}</span>
        <span className={styles.gauge}>
          <span className={styles.gaugeWeight} style={{ width: `${(weight / gaugeMax) * 100}%` }} />
        </span>
      </div>

      <p aria-live="polite" className={flying ? styles.success : undefined}>
        {flying ? text.takeoff(text.planets[planet], neededRpm.toLocaleString(t.locale)) : text.grounded}
      </p>
      <p className={styles.note}>{text.note}</p>
    </div>
  )
}
