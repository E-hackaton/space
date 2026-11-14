import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { LanguageSwitch } from '../components/ui/LanguageSwitch';
import { unlockAudio } from '../audio/unlock';
import { webglAvailable } from '../lib/device';
import { usePrefersReducedMotion } from '../lib/hooks';

// La 3D est chargée après le premier affichage pour que le titre apparaisse vite.
const SolarTour = lazy(() => import('../scenes/SolarTour'));

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const journeyStarted = useStore((s) => s.journeyStarted);
  const startJourney = useStore((s) => s.startJourney);
  const visitChapter = useStore((s) => s.visitChapter);

  const onStart = () => {
    unlockAudio();
    startJourney();
    visitChapter('earth');
    navigate('/mission');
  };

  return (
    <div className="relative h-full min-h-screen overflow-hidden bg-space text-white">
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          {webglAvailable && <SolarTour focus="earth" interactive={false} showLabels={false} animate={!reduced} framing={3.8} liftY={0.38} />}
        </Suspense>
      </div>

      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitch />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none relative z-10 flex h-full min-h-screen flex-col items-center justify-end gap-6 px-6 pb-16 text-center"
      >
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-wide drop-shadow-lg sm:text-7xl">
          {t('app.title')}
        </h1>
        <p className="max-w-xl text-lg text-slate-200">{t('app.tagline')}</p>
        <button
          type="button"
          onClick={onStart}
          className="pointer-events-auto rounded-full bg-active px-8 py-3 font-semibold text-space shadow-lg shadow-active/30 transition hover:scale-105"
        >
          {journeyStarted ? t('app.continue') : t('app.start')}
        </button>
        <p className="text-xs text-slate-400">{t('app.notToScale')}</p>
      </motion.div>
    </div>
  );
}
