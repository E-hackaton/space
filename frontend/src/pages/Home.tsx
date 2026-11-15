import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { LanguageSwitch } from '../components/ui/LanguageSwitch';
import { SankofaAvatar } from '../components/guide/SankofaAvatar';
import { SpeechText } from '../components/guide/SpeechText';
import { unlockAudio } from '../audio/unlock';
import { playLiftoff, setSfxEnabled, startSpaceAmbience, stopSpaceAmbience, unlockSfx } from '../audio/sfx';
import { Icon } from '../components/ui/Glyphs';
import { webglAvailable } from '../lib/device';
import { usePrefersReducedMotion } from '../lib/hooks';
import { warp } from '../scenes/warp';

// La 3D est chargée après le premier affichage pour que le titre apparaisse vite.
const HomeHero = lazy(() => import('../scenes/HomeHero'));

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const journeyStarted = useStore((s) => s.journeyStarted);
  const startJourney = useStore((s) => s.startJourney);
  const visitChapter = useStore((s) => s.visitChapter);
  const [leaving, setLeaving] = useState(false);
  const [hello, setHello] = useState(false);
  // Ambiance de l'espace : elle démarre au premier geste (règle des navigateurs).
  const sfxOn = useStore((s) => s.sfxOn);
  const setSfxOn = useStore((s) => s.setSfxOn);
  useEffect(() => {
    setSfxEnabled(sfxOn);
    if (!sfxOn) return;
    const go = () => {
      unlockSfx();
      startSpaceAmbience();
    };
    go(); // si le son est déjà débloqué (on revient sur l'accueil)
    window.addEventListener('pointerdown', go, { once: true });
    window.addEventListener('keydown', go, { once: true });
    return () => {
      window.removeEventListener('pointerdown', go);
      window.removeEventListener('keydown', go);
      stopSpaceAmbience();
    };
  }, [sfxOn]);
  useEffect(() => {
    warp.value = 0;
    const id = window.setTimeout(() => setHello(true), 1600);
    return () => window.clearTimeout(id);
  }, []);

  const onStart = () => {
    unlockAudio();
    unlockSfx();
    startJourney();
    visitChapter('earth');
    setLeaving(true);
    if (reduced) {
      navigate('/mission');
      return;
    }
    // Saut : les étoiles s'étirent, la caméra fonce, puis on entre dans le jeu.
    playLiftoff('space');
    gsap.to(warp, { value: 1, duration: 1.6, ease: 'power3.in', onComplete: () => navigate('/mission') });
  };

  const title = t('app.title');
  return (
    <div className="relative h-full min-h-screen overflow-hidden bg-space text-white">
      <div className="absolute inset-0">
        <Suspense fallback={null}>{webglAvailable && <HomeHero animate={!reduced} />}</Suspense>
      </div>
      {/* voile central pour la lisibilité du texte */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_50%,rgba(6,11,26,.78),rgba(6,11,26,.25)_70%,transparent)]" aria-hidden="true" />

      <div className="absolute right-4 top-4 z-10 flex items-center gap-3">
        <button type="button" onClick={() => setSfxOn(!sfxOn)} aria-pressed={sfxOn} className="p-1.5 text-slate-300 hover:text-white" title={t('app.sfx')}>
          <Icon name={sfxOn ? 'sound' : 'mute'} size={20} />
          <span className="sr-only">{t('app.sfx')}</span>
        </button>
        <LanguageSwitch />
      </div>

      <motion.div animate={leaving ? { opacity: 0, scale: 0.96 } : { opacity: 1 }} transition={{ duration: 0.6 }} className="relative z-10 mx-auto flex h-full min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
        {/* Le titre s'ouvre depuis le centre pendant que ses lettres se resserrent. */}
        <motion.h1
          className="hero-title"
          initial={reduced ? false : { opacity: 0, letterSpacing: '0.55em', clipPath: 'inset(0 50% 0 50%)' }}
          animate={{ opacity: 1, letterSpacing: '0.02em', clipPath: 'inset(0 0% 0 0%)' }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {title}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }} className="max-w-xl text-lg leading-relaxed text-slate-200 sm:text-xl">
          {t('app.tagline')}
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="flex items-center gap-3 text-left">
          <SankofaAvatar size={72} talking={hello} />
          {hello && <SpeechText text={t('home.hello')} className="max-w-sm text-base text-slate-100" />}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }} className="flex flex-col items-center gap-4">
          <button type="button" onClick={onStart} className="hero-cta">
            <span>{journeyStarted ? t('app.continue') : t('app.start')}</span>
          </button>
          <p className="text-xs text-slate-400">{t('app.notToScale')}</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
