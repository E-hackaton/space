import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '../components/ui/LanguageSwitch';
import { webglAvailable } from '../lib/device';
import { useEffect } from 'react';
import { Icon } from '../components/ui/Glyphs';
import { setSfxEnabled, unlockSfx } from '../audio/sfx';
import { useStore } from '../store/useStore';

export function Layout() {
  const { t } = useTranslation();
  const sfxOn = useStore((s) => s.sfxOn);
  const setSfxOn = useStore((s) => s.setSfxOn);
  // Le son se débloque au premier geste (règle des navigateurs).
  useEffect(() => {
    const unlock = () => unlockSfx();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  useEffect(() => setSfxEnabled(sfxOn), [sfxOn]);
  const location = useLocation();
  const outlet = useOutlet();
  const linkClass = ({ isActive }: { isActive: boolean }) => `relative rounded px-2 py-1 transition-colors hover:text-white ${isActive ? 'text-white' : 'text-slate-300'}`;
  // Soulignement qui glisse d'un onglet à l'autre.
  const link = (to: string, label: string) => (
    <NavLink to={to} className={linkClass}>
      {({ isActive }) => (
        <>
          {label}
          {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-active" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
        </>
      )}
    </NavLink>
  );
  return (
    <div className="flex min-h-full flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2 focus:text-space">
        {t('app.skip')}
      </a>
      <header className="flex flex-wrap items-center justify-between gap-3 bg-space px-4 py-3 text-white">
        <Link to="/" className="font-display text-xl font-extrabold uppercase tracking-wider">
          {t('app.title')}
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {link('/explorer', t('nav.explorer'))}
          {link('/mission', t('nav.mission'))}
          {link('/carte', t('nav.map'))}
          {link('/visite', t('nav.tour'))}
          {link('/carnet', t('nav.logbook'))}
          {link('/sources', t('nav.sources'))}
          <button type="button" onClick={() => setSfxOn(!sfxOn)} aria-pressed={sfxOn} className="rounded-full p-1.5 text-slate-300 hover:text-white" title={t('app.sfx')}>
            <Icon name={sfxOn ? 'sound' : 'mute'} />
            <span className="sr-only">{t('app.sfx')}</span>
          </button>
          <LanguageSwitch />
        </nav>
      </header>
      {!webglAvailable && (
        <p className="bg-dormant/20 px-4 py-2 text-sm text-slate-900 dark:text-slate-100">{t('lite.notice')}</p>
      )}
      <main id="contenu" className="flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-1 flex-col"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
