import { lazy, Suspense, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getChapter, isUnlocked } from '../lib/chapters';
import { useStore } from '../store/useStore';
import { Loading } from '../components/ui/Loading';
import NotFound from './NotFound';

const PlanetView = lazy(() => import('../components/3d/PlanetView'));

export default function ChapterPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const chapter = getChapter(id);
  const visited = useStore((s) => s.visitedChapters);
  const visitChapter = useStore((s) => s.visitChapter);
  const unlocked = chapter ? isUnlocked(chapter.id, visited) : false;

  useEffect(() => {
    if (chapter && unlocked) visitChapter(chapter.id);
  }, [chapter, unlocked, visitChapter]);

  if (!chapter) return <NotFound />;

  if (!unlocked) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg">
          <span aria-hidden="true">🔒 </span>
          {t('map.lockedHint')}
        </p>
        <Link to="/carte" className="mt-6 inline-block underline">{t('nav.back')}</Link>
      </section>
    );
  }

  return (
    <section className="relative flex flex-1 flex-col bg-space text-white">
      <div className="relative h-[60vh] min-h-80 w-full">
        <Suspense fallback={<Loading />}>
          <PlanetView color={chapter.color} />
        </Suspense>
        <p className="absolute bottom-2 right-3 text-xs text-slate-400">{t('app.notToScale')}</p>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-wide">{t(chapter.titleKey)}</h1>
        <p className="mt-3 text-lg text-slate-300">{t(chapter.teaserKey)}</p>
        <p className="mt-6 rounded-lg border border-dormant/40 bg-dormant/10 p-4 text-sm">{t('chapter.soon')}</p>
        <Link to="/carte" className="mt-6 inline-block underline underline-offset-4">← {t('nav.back')}</Link>
      </div>
    </section>
  );
}
