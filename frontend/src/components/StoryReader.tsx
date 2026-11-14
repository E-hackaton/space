import { ArrowLeft, ArrowRight, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { useState } from 'react'

import { useNarration } from '../hooks/useNarration'
import { useI18n } from '../i18n/useI18n'
import { formatDate } from '../lib/format'
import ui from '../styles/ui.module.css'
import type { StoryChapter } from '../types/api'
import styles from './StoryReader.module.css'

interface StoryReaderProps {
  chapters: StoryChapter[]
  /** Ancre de la section suivante (le quiz), proposée à la fin du récit. */
  nextSectionId?: string
}

/**
 * Lecture de l'histoire étape par étape, comme les pages d'un livre, avec narration
 * (voix ElevenLabs si disponible, sinon voix du navigateur).
 *
 * Pour repartir de la première étape quand on change de héros, le parent passe une `key` différente.
 */
export function StoryReader({ chapters, nextSectionId }: StoryReaderProps) {
  const { t, language } = useI18n()
  const [index, setIndex] = useState(0)
  const narration = useNarration()
  const chapter = chapters[index]

  if (!chapter) return null

  const isFirst = index === 0
  const isLast = index === chapters.length - 1
  const date = formatDate(chapter.date, t.locale, chapter.date_precision)

  function goTo(nextIndex: number) {
    narration.stop() // la voix ne doit pas continuer à lire l'étape précédente
    setIndex(nextIndex)
  }

  function toggleNarration() {
    if (!chapter) return
    if (narration.speaking) narration.stop()
    else narration.speak({ text: `${chapter.title}. ${chapter.body}`, audio: chapter.audio, language })
  }

  return (
    <div className={styles.reader}>
      <div className={styles.pageHeader}>
        <p className={ui.eyebrow}>
          {t.story.chapterOf(index + 1, chapters.length)}
          {date && ` · ${date}`}
        </p>
        <button type="button" className={styles.listen} onClick={toggleNarration} aria-pressed={narration.speaking}>
          {narration.speaking ? <SpeakerSlash aria-hidden="true" /> : <SpeakerHigh aria-hidden="true" />}
          {narration.speaking ? t.story.stop : t.story.listen}
        </button>
      </div>

      {/* La région live reste en place ; seul son contenu change (sinon le lecteur d'écran n'annonce rien). */}
      <div aria-live="polite">
        {/* La clé relance l'animation d'entrée à chaque changement d'étape. */}
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
          <ArrowLeft aria-hidden="true" /> {t.story.previous}
        </button>
        {isLast ? (
          nextSectionId && (
            <a href={`#${nextSectionId}`} className={ui.button} onClick={() => narration.stop()}>
              {t.story.challenge} <ArrowRight aria-hidden="true" />
            </a>
          )
        ) : (
          <button type="button" className={ui.button} onClick={() => goTo(index + 1)}>
            {t.story.next} <ArrowRight aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
