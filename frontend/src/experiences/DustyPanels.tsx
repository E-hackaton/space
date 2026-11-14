import { ArrowClockwise, FastForward, Tornado } from '@phosphor-icons/react'
import { useState } from 'react'

import type { Messages } from '../i18n/messages/fr'
import { useI18n } from '../i18n/useI18n'
import ui from '../styles/ui.module.css'
import styles from './Experience.module.css'

/** Poussière déposée sur les panneaux à chaque tranche de 100 sols (jours martiens). Valeur illustrative. */
const DUST_PER_STEP = 0.09
const SOLS_PER_STEP = 100
/** Probabilité qu'un tourbillon de vent nettoie les panneaux pendant une tranche de 100 sols. */
const CLEANING_CHANCE = 0.3
/** En dessous de cette énergie, le rover doit économiser : il ne peut plus faire de science. */
const LOW_POWER = 0.3
const MAX_DUST = 0.92

/**
 * Dernier événement de la simulation. On stocke une donnée, pas une phrase : si l'utilisateur
 * change de langue en pleine partie, le message s'affiche aussitôt dans la nouvelle langue.
 */
type RoverEvent = { kind: 'start' } | { kind: 'cleaned' } | { kind: 'dusty'; lowPower: boolean } | { kind: 'storm' }

interface RoverState {
  sol: number
  dust: number
  storm: boolean
  event: RoverEvent
}

const INITIAL_STATE: RoverState = { sol: 0, dust: 0, storm: false, event: { kind: 'start' } }

/** Énergie produite (0 à 1) : la lumière qui traverse le ciel, puis la poussière. */
function powerOf(state: RoverState): number {
  const sunlight = state.storm ? 0.02 : 1
  return sunlight * (1 - state.dust)
}

function describeEvent(state: RoverState, text: Messages['experiences']['dust'], locale: string): string {
  const sol = state.sol.toLocaleString(locale)
  switch (state.event.kind) {
    case 'start':
      return text.start
    case 'cleaned':
      return text.cleaned(sol)
    case 'dusty':
      return text.dusty(sol) + (state.event.lowPower ? text.lowPower : '')
    case 'storm':
      return text.storm
  }
}

/**
 * Expérience : vivre la mission d'Opportunity côté énergie.
 * La poussière couvre les panneaux solaires, des coups de vent les nettoient par chance,
 * jusqu'à la tempête de 2018. Simulation illustrative : seules les dates réelles sont exactes.
 */
export function DustyPanels() {
  const { t } = useI18n()
  const text = t.experiences.dust
  const [state, setState] = useState<RoverState>(INITIAL_STATE)
  const percent = Math.round(powerOf(state) * 100)

  function advance() {
    setState((current) => {
      const sol = current.sol + SOLS_PER_STEP
      if (Math.random() < CLEANING_CHANCE) {
        return { ...current, sol, dust: current.dust * 0.3, event: { kind: 'cleaned' } }
      }
      const dust = Math.min(MAX_DUST, current.dust + DUST_PER_STEP)
      return { ...current, sol, dust, event: { kind: 'dusty', lowPower: 1 - dust < LOW_POWER } }
    })
  }

  function triggerStorm() {
    setState((current) => ({ ...current, storm: true, event: { kind: 'storm' } }))
  }

  return (
    <div className={styles.experience}>
      <div className={`${styles.marsScene} ${state.storm ? styles.marsSceneStorm : ''}`}>
        <svg viewBox="0 0 300 120" className={styles.scene} role="img" aria-label={text.sceneLabel(Math.round(state.dust * 100))}>
          <circle cx="250" cy="30" r="16" fill="#EAFE07" opacity={state.storm ? 0.08 : 0.9} />
          {/* Panneaux solaires : la couche de poussière (ocre) devient opaque à mesure qu'elle s'accumule. */}
          <rect x="70" y="50" width="160" height="14" fill="#0960E1" />
          <rect x="70" y="50" width="160" height="14" fill="#C1793E" opacity={state.dust} />
          <rect x="120" y="64" width="60" height="22" rx="4" fill="#B8C2D9" />
          <circle cx="125" cy="94" r="8" fill="#5A6578" />
          <circle cx="150" cy="94" r="8" fill="#5A6578" />
          <circle cx="175" cy="94" r="8" fill="#5A6578" />
          <rect x="0" y="102" width="300" height="18" fill="#8E4A2A" />
        </svg>
      </div>

      <div className={styles.row}>
        <p className={styles.readout}>{text.sol(state.sol.toLocaleString(t.locale))}</p>
        <div className={styles.energy}>
          <span>{text.energy}</span>
          <span
            className={styles.gauge}
            role="meter"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={text.energyLabel}
          >
            <span className={percent < LOW_POWER * 100 ? styles.gaugeLow : styles.gaugeLift} style={{ width: `${percent}%` }} />
          </span>
          <span>{percent} %</span>
        </div>
      </div>

      <p aria-live="polite" className={styles.eventLog}>
        {describeEvent(state, text, t.locale)}
      </p>

      {state.storm ? (
        <div className={styles.result}>
          <p>{text.asleep}</p>
          <button type="button" className={ui.buttonGhost} onClick={() => setState(INITIAL_STATE)}>
            <ArrowClockwise aria-hidden="true" /> {text.replay}
          </button>
        </div>
      ) : (
        <div className={styles.row}>
          <button type="button" className={ui.button} onClick={advance}>
            <FastForward aria-hidden="true" weight="fill" /> {text.advance}
          </button>
          {state.sol >= 500 && (
            <button type="button" className={ui.buttonGhost} onClick={triggerStorm}>
              <Tornado aria-hidden="true" /> {text.toStorm}
            </button>
          )}
        </div>
      )}

      <p className={styles.note}>{text.note}</p>
    </div>
  )
}
