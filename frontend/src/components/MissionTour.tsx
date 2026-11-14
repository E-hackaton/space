import { ArrowLeft, ArrowRight, Pause, Play, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { lazy, Suspense, useEffect, useEffectEvent, useState } from 'react'

import { useNarration } from '../hooks/useNarration'
import { useI18n } from '../i18n/useI18n'
import { formatDate } from '../lib/format'
import { canUseWebGL } from '../lib/webgl'
import ui from '../styles/ui.module.css'
import type { EquipmentDetail } from '../types/api'
import styles from './MissionTour.module.css'
import { Loading } from './StatusMessage'

// La scène 3D (three.js) n'est téléchargée qu'à l'ouverture d'une machine.
const MachineStage = lazy(() => import('../three/MachineStage'))

interface MissionTourProps {
  hero: EquipmentDetail
  /** Ancre de la section suivante (le défi), proposée à la fin de la visite. */
  nextSectionId?: string
}

/**
 * La machine raconte sa mission, étape par étape et dans l'ordre chronologique.
 * À chaque étape, la caméra 3D va vers la pièce concernée. En « visite guidée », chaque étape
 * est lue à voix haute puis la suivante s'enchaîne, comme un mini-documentaire.
 *
 * Pour repartir de la première étape en changeant de héros, le parent passe une `key` différente.
 */
export function MissionTour({ hero, nextSectionId }: MissionTourProps) {
  const { t, language } = useI18n()
  const narration = useNarration()
  const [index, setIndex] = useState(0)
  const [touring, setTouring] = useState(false)
  const steps = hero.chapters
  const step = steps[index]

  // En visite guidée : on lit l'étape, puis on passe à la suivante quand la voix a fini.
  const narrateCurrentStep = useEffectEvent(() => {
    if (!step) return
    narration.speak({
      text: `${step.title}. ${step.body}`,
      audio: step.audio,
      language,
      onEnd: () => {
        if (index < steps.length - 1) setIndex(index + 1)
        else setTouring(false) // fin de la visite
      },
    })
  })

  useEffect(() => {
    if (touring) narrateCurrentStep()
  }, [touring, index])

  if (!step) return null

  const isFirst = index === 0
  const isLast = index === steps.length - 1

  function goTo(nextIndex: number) {
    narration.stop()
    setIndex(nextIndex)
  }

  function toggleTour() {
    if (touring) {
      narration.stop()
      setTouring(false)
    } else {
      setTouring(true)
    }
  }

  function toggleListen() {
    if (!step) return
    setTouring(false)
    if (narration.speaking) narration.stop()
    else narration.speak({ text: `${step.title}. ${step.body}`, audio: step.audio, language })
  }

  const stepDate = (position: number) => {
    const item = steps[position]
    if (!item?.date) return t.story.undated
    // Sur la frise, l'année suffit ; la date complète s'affiche dans le panneau.
    return formatDate(item.date, t.locale, 'year') ?? t.story.undated
  }

  return (
    <div className={styles.tour}>
      {canUseWebGL() && (
        <Suspense fallback={<Loading />}>
          <MachineStage
            kind={hero.kind}
            slug={hero.slug}
            world={hero.body}
            focus={step.focus}
            label={t.story.stageLabel(hero.name)}
          />
        </Suspense>
      )}

      <nav aria-label={t.story.timeline}>
        <ol className={styles.timeline}>
          {steps.map((item, position) => (
            <li key={item.order}>
              <button
                type="button"
                className={position === index ? styles.dateActive : position < index ? styles.dateDone : styles.date}
                aria-current={position === index ? 'step' : undefined}
                onClick={() => {
                  setTouring(false)
                  goTo(position)
                }}
              >
                <span className={styles.phase}>{t.story.phases[item.phase]}</span>
                <span className={styles.dot} aria-hidden="true" />
                {stepDate(position)}
                <span className="visually-hidden"> · {item.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={ui.eyebrow}>
            {t.story.phases[step.phase]} · {t.story.chapterOf(index + 1, steps.length)}
            {step.date && ` · ${formatDate(step.date, t.locale, step.date_precision)}`}
          </p>
          <button type="button" className={styles.listen} onClick={toggleListen} aria-pressed={narration.speaking && !touring}>
            {narration.speaking && !touring ? <SpeakerSlash aria-hidden="true" /> : <SpeakerHigh aria-hidden="true" />}
            {narration.speaking && !touring ? t.story.stop : t.story.listen}
          </button>
        </div>

        {/* La région live reste en place ; seul son contenu change (sinon le lecteur d'écran n'annonce rien). */}
        <div aria-live="polite">
          <div key={index} className={styles.page}>
            <h3>{step.title}</h3>
            <p className={styles.body}>{step.body}</p>
          </div>
        </div>

        <div className={styles.controls}>
          <button type="button" className={ui.buttonGhost} onClick={() => goTo(index - 1)} disabled={isFirst}>
            <ArrowLeft aria-hidden="true" />
            <span className={styles.controlLabel}>{t.story.previous}</span>
          </button>

          <button type="button" className={ui.button} onClick={toggleTour} aria-pressed={touring}>
            {touring ? <Pause aria-hidden="true" weight="fill" /> : <Play aria-hidden="true" weight="fill" />}
            {touring ? t.story.pauseTour : t.story.guidedTour}
          </button>

          {isLast ? (
            nextSectionId && (
              <a href={`#${nextSectionId}`} className={ui.buttonGhost} onClick={() => narration.stop()}>
                <span className={styles.controlLabel}>{t.story.challenge}</span> <ArrowRight aria-hidden="true" />
              </a>
            )
          ) : (
            <button type="button" className={ui.buttonGhost} onClick={() => goTo(index + 1)}>
              <span className={styles.controlLabel}>{t.story.next}</span> <ArrowRight aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
