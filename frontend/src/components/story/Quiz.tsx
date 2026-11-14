import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApiQuizQuestion } from '../../api/types';

interface Props {
  questions: ApiQuizQuestion[];
  /** Appelé une seule fois, quand toutes les questions ont trouvé leur bonne réponse. */
  onComplete: () => void;
}

/** Pour chaque question : les mauvaises réponses déjà tentées, et si elle est résolue. */
interface Progress {
  wrong: number[];
  solved: boolean;
}

const EMPTY: Progress = { wrong: [], solved: false };

/**
 * Quiz à choix multiples, pensé pour apprendre plutôt que pour sanctionner :
 * après une erreur on réessaie, et l'explication s'affiche dès la bonne réponse.
 */
export function Quiz({ questions, onComplete }: Props) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<Record<number, Progress>>({});
  const solvedCount = questions.filter((q) => progress[q.id]?.solved).length;
  const allSolved = questions.length > 0 && solvedCount === questions.length;

  function answer(question: ApiQuizQuestion, choice: number) {
    const current = progress[question.id] ?? EMPTY;
    if (current.solved) return;
    const correct = choice === question.answer_index;
    const next = { ...progress, [question.id]: correct ? { ...current, solved: true } : { ...current, wrong: [...current.wrong, choice] } };
    setProgress(next);
    // Calculé ici, dans le gestionnaire d'événement : pas besoin d'un effet qui surveille la progression.
    if (correct && questions.every((q) => next[q.id]?.solved)) onComplete();
  }

  return (
    <div className="space-y-4">
      {questions.map((question, n) => {
        const state = progress[question.id] ?? EMPTY;
        return (
          <fieldset key={question.id} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <legend className="px-1 text-sm font-semibold">{t('quiz.question', { n: n + 1, text: question.question })}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {question.choices.map((choice, i) => {
                const wrong = state.wrong.includes(i);
                const right = state.solved && i === question.answer_index;
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => answer(question, i)}
                    disabled={state.solved || wrong}
                    className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                      right ? 'bg-active text-space ring-active' : wrong ? 'text-red-300 line-through ring-red-400/50' : 'ring-white/30 hover:bg-white/10'
                    }`}
                  >
                    {right && <span aria-hidden="true">✓ </span>}
                    {choice}
                    {right && <span className="sr-only"> {t('quiz.right')}</span>}
                    {wrong && <span className="sr-only"> {t('quiz.wrong')}</span>}
                  </button>
                );
              })}
            </div>
            <div role="status" aria-live="polite" className="mt-2 text-sm text-slate-300">
              {state.solved && (
                <p>
                  <strong className="text-active">{t('quiz.bravo')}</strong> {question.explanation}
                </p>
              )}
              {!state.solved && state.wrong.length > 0 && <p>{t('quiz.tryAgain')}</p>}
            </div>
          </fieldset>
        );
      })}
      <p className="text-sm font-semibold" aria-live="polite">
        {allSolved ? t('quiz.allFound') : t('quiz.progress', { solved: solvedCount, total: questions.length })}
      </p>
    </div>
  );
}
