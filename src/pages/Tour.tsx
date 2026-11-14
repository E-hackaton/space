import { lazy, Suspense, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loading } from '../components/ui/Loading';
import { TOUR_STOPS, type TourStop } from '../lib/solarSystem';
import { machinesOn } from '../lib/machines';
import { webglAvailable } from '../lib/device';
import { usePrefersReducedMotion } from '../lib/hooks';

const SolarTour = lazy(() => import('../scenes/SolarTour'));

const FLAT_IMAGES: Partial<Record<TourStop, string>> = {
  mercury: '/textures/mercury_color.jpg',
  venus: '/textures/venus_clouds.jpg',
  earth: '/textures/earth_color.jpg',
  moon: '/textures/moon_color.jpg',
  mars: '/textures/mars_color.jpg',
  jupiter: '/textures/jupiter_color.jpg',
  saturn: '/textures/saturn_color.jpg',
};

export default function Tour() {
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const [params, setParams] = useSearchParams();
  const raw = params.get('cible');
  const focus: TourStop = TOUR_STOPS.includes(raw as TourStop) ? (raw as TourStop) : 'overview';
  const index = TOUR_STOPS.indexOf(focus);

  const go = (stop: TourStop) => setParams(stop === 'overview' ? {} : { cible: stop }, { replace: true });

  // Flèches gauche / droite : étape précédente / suivante.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight') go(TOUR_STOPS[Math.min(index + 1, TOUR_STOPS.length - 1)]);
      if (e.key === 'ArrowLeft') go(TOUR_STOPS[Math.max(index - 1, 0)]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section className="relative flex flex-1 flex-col bg-space text-white">
      <h1 className="sr-only">{t('tour.title')}</h1>

      <div className="relative h-[calc(100vh-4rem)] min-h-96 w-full">
        {webglAvailable ? (
          <Suspense fallback={<Loading />}>
            <SolarTour focus={focus} animate={!reduced} onSelect={go} liftY={0.28} />
          </Suspense>
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            {FLAT_IMAGES[focus] ? (
              <img src={FLAT_IMAGES[focus]} alt="" className="max-h-full max-w-full rounded-lg" />
            ) : (
              <p className="max-w-md text-center text-slate-300">{t('tour.intro')}</p>
            )}
          </div>
        )}

        {/* Panneau de navigation : la version accessible au clavier de tout ce qui est cliquable en 3D. */}
        <nav
          aria-label={t('tour.navLabel')}
          className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-space via-space/85 to-transparent px-4 pb-5 pt-16"
        >
          <div className="mx-auto max-w-3xl">
            <div aria-live="polite" className="mb-4 min-h-20">
              <p className="font-display text-4xl font-extrabold uppercase tracking-wide">
                {focus === 'overview' ? t('tour.overview') : t(`bodies.${focus}.name`)}
              </p>
              <p className="mt-1 text-slate-300">
                {focus === 'overview' ? t('tour.intro') : t(`bodies.${focus}.teaser`)}
              </p>
              {focus !== 'overview' && machinesOn(focus).length > 0 && (
                <Link to={`/mission?astre=${focus}`} className="mt-2 inline-block text-active underline underline-offset-4">
                  {t('tour.openChapter')} →
                </Link>
              )}
            </div>

            <ul className="flex flex-wrap gap-2">
              {TOUR_STOPS.map((stop) => (
                <li key={stop}>
                  <button
                    type="button"
                    onClick={() => go(stop)}
                    aria-current={focus === stop ? 'true' : undefined}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                      focus === stop ? 'bg-white text-space ring-white' : 'ring-white/30 hover:bg-white/10'
                    }`}
                  >
                    {stop === 'overview' ? t('tour.overview') : t(`bodies.${stop}.name`)}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400">
              {t('tour.hint')} · {t('app.notToScale')}
            </p>
          </div>
        </nav>
      </div>
    </section>
  );
}
