import { ArrowLeft, ArrowRight, Pause, Play, SpeakerHigh, SpeakerSlash, X } from '@phosphor-icons/react'
import { lazy, Suspense, useEffect, useEffectEvent, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useNarration } from '../hooks/useNarration'
import type { Messages } from '../i18n/messages/fr'
import { useI18n } from '../i18n/useI18n'
import { formatDate } from '../lib/format'
import { canUseWebGL } from '../lib/webgl'
import ui from '../styles/ui.module.css'
import type { EquipmentDetail, MachineFocus } from '../types/api'
import styles from './MissionTour.module.css'
import { Loading } from './StatusMessage'

// La scène 3D (three.js) n'est téléchargée qu'à l'ouverture d'une machine.
const MachineStage = lazy(() => import('../three/MachineStage'))

interface MissionTourProps {
  hero: EquipmentDetail
  /** Ancre de la section suivante (le défi), proposée à la fin de la visite. */
  nextSectionId?: string
}

/** Une étape de la visite : la présentation de la machine, puis les étapes datées de sa mission. */
interface TourStep {
  key: string
  /** Libellé au-dessus du point de la frise : « Présentation », « Arrivée »… */
  phaseLabel: string
  /** Année sous le point de la frise. */
  shortDate: string
  /** Date complète dans le panneau, si elle est connue. */
  fullDate: string | null
  title: string
  body: string
  focus: MachineFocus
  audio: string | null
}

/**
 * Construit la visite : d'abord la machine se présente (« Bonjour, je suis… »),
 * puis elle raconte sa mission étape par étape, dans l'ordre chronologique.
 */
function buildSteps(hero: EquipmentDetail, t: Messages): TourStep[] {
  const presentation: TourStep = {
    key: 'presentation',
    phaseLabel: t.presentation.label,
    shortDate: '★',
    fullDate: null,
    // Texte et voix ElevenLabs fournis par l'API, comme pour les étapes de la mission.
    title: hero.presentation.title,
    body: hero.presentation.body,
    focus: 'overview',
    audio: hero.presentation.audio,
  }

  const chapters = hero.chapters.map<TourStep>((chapter) => ({
    key: `chapter-${chapter.order}`,
    phaseLabel: t.story.phases[chapter.phase],
    // Sur la frise, l'année suffit ; la date complète s'affiche dans le panneau.
    // Sans date : « Aujourd'hui » n'a de sens que pour l'héritage ; ailleurs, un simple tiret.
    shortDate: formatDate(chapter.date, t.locale, 'year') ?? (chapter.phase === 'legacy' ? t.story.undated : '–'),
    fullDate: formatDate(chapter.date, t.locale, chapter.date_precision),
    title: chapter.title,
    body: chapter.body,
    focus: chapter.focus,
    audio: chapter.audio,
  }))

  return [presentation, ...chapters]
}

/**
 * La machine se présente, puis raconte sa mission étape par étape.
 * À chaque étape, la caméra 3D va vers la pièce concernée. En « visite guidée », chaque étape
 * est lue à voix haute puis la suivante s'enchaîne, comme un mini-documentaire.
 * Les points « + » de la 3D ouvrent la fiche d'un composant (nom, rôle, importance).
 *
 * Pour repartir de la première étape en changeant de héros, le parent passe une `key` différente.
 */
export function MissionTour({ hero, nextSectionId }: MissionTourProps) {
  const { t, language } = useI18n()
  const narration = useNarration()
  const location = useLocation()
  // Arrivé avec Sankofa depuis le globe : la présentation démarre toute seule.
  const arrivedWithGuide = (location.state as { arrivedWithGuide?: boolean } | null)?.arrivedWithGuide === true
  const [index, setIndex] = useState(0)
  const [touring, setTouring] = useState(arrivedWithGuide)
  const [selectedPart, setSelectedPart] = useState<MachineFocus | null>(null)

  const steps = buildSteps(hero, t)
  const step = steps[index]

  // En visite guidée : on lit l'étape, puis on passe à la suivante quand la voix a fini.
  const narrateCurrentStep = useEffectEvent(() => {
    if (!step) return
    narration.speak({
      text: `${step.title} ${step.body}`,
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
  const part = selectedPart && selectedPart !== 'overview' ? t.parts.items[selectedPart] : null

  function goTo(nextIndex: number) {
    narration.stop()
    setSelectedPart(null)
    setIndex(nextIndex)
  }

  function toggleTour() {
    if (touring) {
      narration.stop()
      setTouring(false)
    } else {
      setSelectedPart(null)
      setTouring(true)
    }
  }

  function toggleListen() {
    if (!step) return
    setTouring(false)
    if (narration.speaking) narration.stop()
    else narration.speak({ text: `${step.title} ${step.body}`, audio: step.audio, language })
  }

  function selectPart(focus: MachineFocus) {
    // Explorer un composant met la visite en pause : l'utilisateur garde la main.
    narration.stop()
    setTouring(false)
    setSelectedPart(focus)
  }

  return (
    <div className={styles.tour}>
      {canUseWebGL() && (
        <Suspense fallback={<Loading />}>
          <div className={styles.stage}>
            <MachineStage
              kind={hero.kind}
              slug={hero.slug}
              world={hero.body}
              focus={selectedPart ?? step.focus}
              label={t.story.stageLabel(hero.name)}
              onPartSelect={selectPart}
              partLabel={(focus) => (focus === 'overview' ? hero.name : t.parts.discover(t.parts.items[focus].name))}
            />

            {part ? (
              <aside className={styles.partCard} aria-live="polite">
                <div className={styles.partHeader}>
                  <h3>{part.name}</h3>
                  <button type="button" className={styles.partClose} onClick={() => setSelectedPart(null)}>
                    <X aria-hidden="true" weight="bold" />
                    <span className="visually-hidden">{t.parts.close}</span>
                  </button>
                </div>
                <p className={styles.partLabel}>{t.parts.whatItDoes}</p>
                <p>{part.does}</p>
                <p className={styles.partLabel}>{t.parts.whyItMatters}</p>
                <p>{part.why}</p>
              </aside>
            ) : (
              <p className={styles.partHint}>{t.parts.hint}</p>
            )}
          </div>
        </Suspense>
      )}

      <nav aria-label={t.story.timeline}>
        <ol className={styles.timeline}>
          {steps.map((item, position) => (
            <li key={item.key}>
              <button
                type="button"
                className={position === index ? styles.dateActive : position < index ? styles.dateDone : styles.date}
                aria-current={position === index ? 'step' : undefined}
                onClick={() => {
                  setTouring(false)
                  goTo(position)
                }}
              >
                <span className={styles.phase}>{item.phaseLabel}</span>
                <span className={styles.dot} aria-hidden="true" />
                {item.shortDate}
                <span className="visually-hidden"> · {item.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={ui.eyebrow}>
            {step.phaseLabel} · {t.story.chapterOf(index + 1, steps.length)}
            {step.fullDate && ` · ${step.fullDate}`}
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
