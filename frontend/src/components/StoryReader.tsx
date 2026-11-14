import { ArrowLeft, ArrowRight, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { useState } from 'react'

import { useSpeech } from '../hooks/useSpeech'
import ui from '../styles/ui.module.css'
import type { StoryChapter } from '../types/api'
import styles from './StoryReader.module.css'

interface StoryReaderProps {
  chapters: StoryChapter[]
  /** Ancre de la section suivante (le quiz), proposée à la fin du récit. */
  nextSectionId?: string
}

/**
 * Lecture de l'histoire chapitre par chapitre, comme les pages d'un livre, avec lecture à voix haute.
 * Un seul chapitre à la fois : des textes courts conviennent mieux à de jeunes lecteurs.
 *
 * Pour repartir du premier chapitre quand on change de héros, le parent passe une `key` différente.
 */
export function StoryReader({ chapters, nextSectionId }: StoryReaderProps) {
  const [index, setIndex] = useState(0)
  const speech = useSpeech()
  const chapter = chapters[index]

  if (!chapter) return null

  const isFirst = index === 0
  const isLast = index === chapters.length - 1

  function goTo(nextIndex: number) {
    speech.stop() // la voix ne doit pas continuer à lire l'ancien chapitre
    setIndex(nextIndex)
  }

  function toggleSpeech() {
    if (!chapter) return
    if (speech.speaking) speech.stop()
    else speech.speak(`${chapter.title}. ${chapter.body}`)
  }

  return (
    <div className={styles.reader}>
      <div className={styles.pageHeader}>
        <p className={ui.eyebrow}>
          Chapitre {index + 1} sur {chapters.length}
        </p>
        {speech.supported && (
          <button type="button" className={styles.listen} onClick={toggleSpeech} aria-pressed={speech.speaking}>
            {speech.speaking ? <SpeakerSlash aria-hidden="true" /> : <SpeakerHigh aria-hidden="true" />}
            {speech.speaking ? 'Arrêter' : 'Écouter'}
          </button>
        )}
      </div>

      {/* La région live reste en place ; seul son contenu change (sinon le lecteur d'écran n'annonce rien). */}
      <div aria-live="polite">
        {/* La clé relance l'animation d'entrée à chaque changement de chapitre. */}
        <div key={index} className={styles.page}>
          <h3>{chapter.title}</h3>
          <p className={styles.body}>{chapter.body}</p>
        </div>
      </div>

      <div className={styles.progress} aria-hidden="true">
        {chapters.map((item, position) => (
          <span key={item.order} className={position <= index ? styles.stepDone : styles.step} />
        ))}
      </div>

      <div className={styles.controls}>
        <button type="button" className={ui.buttonGhost} onClick={() => goTo(index - 1)} disabled={isFirst}>
          <ArrowLeft aria-hidden="true" /> Précédent
        </button>
        {isLast ? (
          nextSectionId && (
            <a href={`#${nextSectionId}`} className={ui.button} onClick={() => speech.stop()}>
              Je relève le défi <ArrowRight aria-hidden="true" />
            </a>
          )
        ) : (
          <button type="button" className={ui.button} onClick={() => goTo(index + 1)}>
            Suivant <ArrowRight aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
