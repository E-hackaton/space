import { Check, X } from '@phosphor-icons/react'
import { useState } from 'react'

import type { QuizQuestion } from '../types/api'
import styles from './Quiz.module.css'

interface QuizProps {
  questions: QuizQuestion[]
  /** Appelé une seule fois, quand toutes les questions ont trouvé leur bonne réponse. */
  onComplete: () => void
}

/** Pour chaque question (par id) : les mauvaises réponses déjà tentées et si elle est résolue. */
interface QuestionProgress {
  wrongChoices: number[]
  solved: boolean
}

const EMPTY_PROGRESS: QuestionProgress = { wrongChoices: [], solved: false }

/**
 * Quiz à choix multiples, pensé pour apprendre plutôt que pour sanctionner :
 * après une erreur, l'élève peut réessayer, et l'explication s'affiche dès la bonne réponse.
 */
export function Quiz({ questions, onComplete }: QuizProps) {
  const [progress, setProgress] = useState<Record<number, QuestionProgress>>({})

  const solvedCount = questions.filter((question) => progress[question.id]?.solved).length
  const allSolved = questions.length > 0 && solvedCount === questions.length

  function answer(question: QuizQuestion, choiceIndex: number) {
    const current = progress[question.id] ?? EMPTY_PROGRESS
    if (current.solved) return

    const isCorrect = choiceIndex === question.answer_index
    const nextQuestion: QuestionProgress = isCorrect
      ? { ...current, solved: true }
      : { ...current, wrongChoices: [...current.wrongChoices, choiceIndex] }
    const next = { ...progress, [question.id]: nextQuestion }
    setProgress(next)

    // Le calcul se fait sur le nouvel état, ici, dans le gestionnaire d'événement :
    // pas besoin d'un useEffect qui surveillerait la progression.
    if (isCorrect && questions.every((q) => next[q.id]?.solved)) onComplete()
  }

  return (
    <div className={styles.quiz}>
      {questions.map((question, questionNumber) => {
        const state = progress[question.id] ?? EMPTY_PROGRESS
        const lastWrong = state.wrongChoices.length > 0 && !state.solved

        return (
          <fieldset key={question.id} className={styles.question}>
            <legend className={styles.legend}>
              Question {questionNumber + 1} : {question.question}
            </legend>

            <div className={styles.choices}>
              {question.choices.map((choice, choiceIndex) => {
                const isWrong = state.wrongChoices.includes(choiceIndex)
                const isRight = state.solved && choiceIndex === question.answer_index
                const className = isRight ? styles.choiceRight : isWrong ? styles.choiceWrong : styles.choice

                return (
                  <button
                    key={choice}
                    type="button"
                    className={className}
                    onClick={() => answer(question, choiceIndex)}
                    disabled={state.solved || isWrong}
                  >
                    {isRight && <Check aria-hidden="true" weight="bold" />}
                    {isWrong && <X aria-hidden="true" weight="bold" />}
                    {choice}
                    {isRight && <span className="visually-hidden"> (bonne réponse)</span>}
                    {isWrong && <span className="visually-hidden"> (mauvaise réponse)</span>}
                  </button>
                )
              })}
            </div>

            <div role="status" aria-live="polite" className={styles.feedback}>
              {state.solved && (
                <p>
                  <strong>Bravo !</strong> {question.explanation}
                </p>
              )}
              {lastWrong && <p>Pas tout à fait… Relis l'histoire et essaie encore !</p>}
            </div>
          </fieldset>
        )
      })}

      <p className={styles.score} aria-live="polite">
        {allSolved
          ? 'Toutes les réponses sont trouvées : la carte de ce héros rejoint ta collection !'
          : `${solvedCount} / ${questions.length} réponses trouvées`}
      </p>
    </div>
  )
}
