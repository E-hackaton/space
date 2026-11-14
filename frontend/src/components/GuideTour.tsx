import { ArrowLeft, ArrowRight, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { lazy, Suspense, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react'

import { fetchGuide } from '../api/heroes'
import { useApi } from '../hooks/useApi'
import { useNarration } from '../hooks/useNarration'
import { useI18n } from '../i18n/useI18n'
import { closeGuide, isGuideOpen, subscribeGuide } from '../lib/guideStore'
import { canUseWebGL } from '../lib/webgl'
import ui from '../styles/ui.module.css'
import styles from './GuideTour.module.css'
import { LanguageSwitch } from './LanguageSwitch'
import { SankofaAvatar } from './SankofaAvatar'
import { Typewriter } from './Typewriter'

// Le robot 3D (three.js) n'est téléchargé que pendant la visite.
const SankofaBot = lazy(() => import('../three/SankofaBot'))

/** La visite d'accueil, affichée quand le store du guide est ouvert. */
export function GuideTour() {
  const open = useSyncExternalStore(subscribeGuide, isGuideOpen)
  return open ? <GuideDialog /> : null
}

/** « launch » = écran d'envol (langue et son), puis les étapes numérotées du guide. */
type Stage = 'launch' | number

/**
 * Sankofa explique le site en quelques étapes courtes, avec sa voix.
 *
 * Le premier écran demande un clic pour démarrer : les navigateurs interdisent de jouer du son
 * avant une action de l'utilisateur. On en profite pour choisir la langue et le son.
 */
function GuideDialog() {
  const { t, language } = useI18n()
  const guide = useApi('guide', fetchGuide)
  const narration = useNarration()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [stage, setStage] = useState<Stage>('launch')
  const [sound, setSound] = useState(true)

  const steps = guide.status === 'success' ? guide.data : []
  const step = typeof stage === 'number' ? steps[stage] : undefined

  // <dialog> natif en mode modal : focus piégé, touche Échap, reste de la page inerte.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // Sankofa lit chaque étape à voix haute quand le son est activé.
  const narrate = useEffectEvent(() => {
    if (step && sound) narration.speak({ text: step.text, audio: step.audio, language })
  })
  // steps.length : si le script arrive après le clic sur « Commencer », on lit quand même la 1re étape.
  useEffect(() => {
    narrate()
  }, [stage, language, steps.length])

  function toggleSound() {
    if (sound) narration.stop()
    setSound(!sound)
  }

  function finish() {
    narration.stop()
    dialogRef.current?.close() // déclenche onClose → closeGuide()
    document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' })
  }

  const isLast = typeof stage === 'number' && stage === steps.length - 1

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={t.guide.dialogLabel}
      onClose={() => {
        narration.stop()
        closeGuide()
      }}
    >
      <div className={styles.bot}>
        {canUseWebGL() ? (
          <Suspense fallback={<SankofaAvatar size={140} />}>
            <SankofaBot speaking={narration.speaking} />
          </Suspense>
        ) : (
          <SankofaAvatar size={140} />
        )}
      </div>

      <div className={styles.content}>
        <p className={styles.speaker}>{t.common.speaker}</p>

        {stage === 'launch' ? (
          <>
            <h2 className={styles.title}>{t.guide.launchTitle}</h2>
            <p className={styles.text}>{t.guide.launchText}</p>
            <LanguageSwitch />
            <div className={styles.actions}>
              <button
                type="button"
                className={ui.button}
                onClick={() => {
                  setSound(true)
                  setStage(0)
                }}
              >
                <SpeakerHigh aria-hidden="true" /> {t.guide.startWithSound}
              </button>
              <button
                type="button"
                className={ui.buttonGhost}
                onClick={() => {
                  setSound(false)
                  setStage(0)
                }}
              >
                {t.guide.startSilent}
              </button>
            </div>
          </>
        ) : (
          step && (
            <>
              {/* La région live annonce chaque nouvelle phrase de Sankofa aux lecteurs d'écran. */}
              <p className={styles.text} aria-live="polite">
                <Typewriter key={`${stage}-${language}`} text={step.text} />
              </p>

              <div className={styles.progress}>
                <span className={styles.dots} aria-hidden="true">
                  {steps.map((item, position) => (
                    <span key={item.key} className={position <= (stage as number) ? styles.dotDone : styles.dot} />
                  ))}
                </span>
                <span className="visually-hidden">{t.guide.stepOf((stage as number) + 1, steps.length)}</span>
                <button type="button" className={styles.sound} onClick={toggleSound} aria-pressed={sound}>
                  {sound ? <SpeakerHigh aria-hidden="true" /> : <SpeakerSlash aria-hidden="true" />}
                  <span className="visually-hidden">{sound ? t.guide.soundOn : t.guide.soundOff}</span>
                </button>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.skip} onClick={() => dialogRef.current?.close()}>
                  {t.guide.skip}
                </button>
                <span className={styles.navigation}>
                  {(stage as number) > 0 && (
                    <button type="button" className={ui.buttonGhost} onClick={() => setStage((stage as number) - 1)}>
                      <ArrowLeft aria-hidden="true" />
                      <span className="visually-hidden">{t.guide.previous}</span>
                    </button>
                  )}
                  {isLast ? (
                    <button type="button" className={ui.button} onClick={finish}>
                      {t.guide.finish} <ArrowRight aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="button" className={ui.button} onClick={() => setStage((stage as number) + 1)}>
                      {t.guide.next} <ArrowRight aria-hidden="true" />
                    </button>
                  )}
                </span>
              </div>
            </>
          )
        )}
      </div>
    </dialog>
  )
}
