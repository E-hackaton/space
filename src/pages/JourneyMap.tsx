import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chapters, isUnlocked } from '../lib/chapters';
import { useStore } from '../store/useStore';

export default function JourneyMap() {
  const { t } = useTranslation();
  const visited = useStore((s) => s.visitedChapters);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">{t('map.title')}</h1>
      <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{t('map.intro')}</p>

      <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {chapters.map((chapter) => {
          const unlocked = isUnlocked(chapter.id, visited);
          const done = visited.includes(chapter.id);
          const label = chapter.order === 0 ? t('map.prologue') : t('map.chapter', { n: chapter.order });
          const to = chapter.id === 'earth' ? '/' : `/chapitre/${chapter.id}`;

          const body = (
            <>
              <span
                className="mx-auto block h-20 w-20 rounded-full shadow-inner"
                style={{ background: `radial-gradient(circle at 70% 35%, ${chapter.color}, #060B1A 85%)` }}
                aria-hidden="true"
              />
              <span className="mt-4 block text-xs uppercase tracking-widest text-slate-400">{label}</span>
              <span className="block font-display text-2xl font-extrabold uppercase">{t(chapter.titleKey)}</span>
              <span className="mt-2 block text-sm text-slate-300">{t(chapter.teaserKey)}</span>
              <span className="mt-4 block text-sm font-semibold">
                {!unlocked ? (
                  <span className="text-slate-400">
                    <span aria-hidden="true">🔒 </span>
                    {t('map.locked')} · {t('map.lockedHint')}
                  </span>
                ) : done ? (
                  <span className="text-active">
                    <span aria-hidden="true">✓ </span>
                    {t('map.visited')}
                  </span>
                ) : (
                  <span className="text-white">{t('map.open')} →</span>
                )}
              </span>
            </>
          );

          const cardClass = 'block h-full rounded-2xl bg-space p-5 text-center text-white ring-1 ring-white/10';
          return (
            <li key={chapter.id}>
              {unlocked ? (
                <Link to={to} className={`${cardClass} transition hover:-translate-y-1 hover:ring-white/40`}>
                  {body}
                </Link>
              ) : (
                <div className={`${cardClass} opacity-60`} aria-disabled="true">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
