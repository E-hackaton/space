import { ArrowClockwise, FastForward, Tornado } from '@phosphor-icons/react'
import { useState } from 'react'

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

interface RoverState {
  sol: number
  dust: number
  storm: boolean
  lastEvent: string
}

const INITIAL_STATE: RoverState = {
  sol: 0,
  dust: 0,
  storm: false,
  lastEvent: 'Sol 0 : Opportunity se réveille dans le cratère Eagle, panneaux propres. Mission prévue : 90 sols.',
}

/** Énergie produite (0 à 1) : la lumière qui traverse le ciel, puis la poussière. */
function powerOf(state: RoverState): number {
  const sunlight = state.storm ? 0.02 : 1
  return sunlight * (1 - state.dust)
}

/**
 * Expérience : vivre la mission d'Opportunity côté énergie.
 * La poussière couvre les panneaux solaires, des coups de vent les nettoient par chance,
 * jusqu'à la tempête de 2018. Simulation illustrative : seules les dates réelles sont exactes.
 */
export function DustyPanels() {
  const [state, setState] = useState<RoverState>(INITIAL_STATE)
  const power = powerOf(state)
  const asleep = state.storm

  function advance() {
    setState((current) => {
      const sol = current.sol + SOLS_PER_STEP
      if (Math.random() < CLEANING_CHANCE) {
        return {
          ...current,
          sol,
          dust: current.dust * 0.3,
          lastEvent: `Sol ${sol} : un tourbillon de vent est passé et a soufflé la poussière ! Énergie retrouvée.`,
        }
      }
      const dust = Math.min(MAX_DUST, current.dust + DUST_PER_STEP)
      const warning = 1 - dust < LOW_POWER ? ' Énergie faible : Opportunity se met en mode économie.' : ''
      return { ...current, sol, dust, lastEvent: `Sol ${sol} : la poussière s'accumule…${warning}` }
    })
  }

  function triggerStorm() {
    setState((current) => ({
      ...current,
      storm: true,
      lastEvent:
        "Juin 2018 : une tempête de poussière recouvre presque toute la planète. Le ciel devient noir en plein jour. Dans la réalité, le dernier signal d'Opportunity arrive le 10 juin 2018.",
    }))
  }

  const percent = Math.round(power * 100)

  return (
    <div className={styles.experience}>
      <div className={`${styles.marsScene} ${state.storm ? styles.marsSceneStorm : ''}`}>
        <svg viewBox="0 0 300 120" className={styles.scene} role="img" aria-label={`Opportunity et ses panneaux solaires, couverts de poussière à ${Math.round(state.dust * 100)} %`}>
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
        <p className={styles.readout}>Sol {state.sol.toLocaleString('fr-FR')}</p>
        <div className={styles.energy}>
          <span>Énergie</span>
          <span className={styles.gauge} role="meter" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Énergie des panneaux solaires">
            <span className={percent < LOW_POWER * 100 ? styles.gaugeLow : styles.gaugeLift} style={{ width: `${percent}%` }} />
          </span>
          <span>{percent} %</span>
        </div>
      </div>

      <p aria-live="polite" className={styles.eventLog}>
        {state.lastEvent}
      </p>

      {asleep ? (
        <div className={styles.result}>
          <p>
            Plus de lumière, plus d'énergie : Opportunity s'endort. Pendant des mois, les ingénieurs envoient plus de
            mille appels. La mission est déclarée terminée le 13 février 2019, après près de 15 ans au lieu de 90 jours.
          </p>
          <button type="button" className={ui.buttonGhost} onClick={() => setState(INITIAL_STATE)}>
            <ArrowClockwise aria-hidden="true" /> Revivre la mission
          </button>
        </div>
      ) : (
        <div className={styles.row}>
          <button type="button" className={ui.button} onClick={advance}>
            <FastForward aria-hidden="true" weight="fill" /> Avancer de 100 sols
          </button>
          {state.sol >= 500 && (
            <button type="button" className={ui.buttonGhost} onClick={triggerStorm}>
              <Tornado aria-hidden="true" /> Arriver en 2018
            </button>
          )}
        </div>
      )}

      <p className={styles.note}>
        Opportunity n'avait pas d'essuie-glace : ce sont des coups de vent martiens qui ont nettoyé ses panneaux, par
        chance, plusieurs fois. C'est l'une des raisons de sa longévité. Simulation simplifiée.
      </p>
    </div>
  )
}
