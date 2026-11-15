import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '../components/ui/LanguageSwitch';
import { webglAvailable } from '../lib/device';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/ui/Glyphs';
import { setSfxEnabled, unlockSfx } from '../audio/sfx';
import { useStore } from '../store/useStore';

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const outlet = useOutlet();
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
  const linkClass = ({ isActive }: { isActive: boolean }) => `relative rounded px-2 py-1 transition-colors hover:text-white ${isActive ? 'text-white' : 'text-slate-300'}`;
  const tabs: [string, string][] = [
    ['/explorer', t('nav.explorer')],
    ['/mission', t('nav.mission')],
    ['/carte', t('nav.map')],
    ['/galerie', t('nav.gallery')],
    ['/carnet', t('nav.logbook')],
    ['/sources', t('nav.sources')],
    ['/parametres', t('nav.settings')],
  ];
  // Menu des téléphones : ouvert / fermé ; il se referme en changeant de page, au clic dehors ou avec Échap.
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMenu(false), [location.pathname]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    const onDown = (e: PointerEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [menu]);
  // Soulignement qui glisse d'un onglet à l'autre.
  const link = (to: string, label: string) => (
    <NavLink key={to} to={to} className={linkClass}>
      {({ isActive }) => (
        <>
          {label}
          {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-active" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
        </>
      )}
    </NavLink>
  );
  const soundButton = (
    <button type="button" onClick={() => setSfxOn(!sfxOn)} aria-pressed={sfxOn} className="rounded-full p-1.5 text-slate-300 hover:text-white" title={t('app.sfx')}>
      <Icon name={sfxOn ? 'sound' : 'mute'} />
      <span className="sr-only">{t('app.sfx')}</span>
    </button>
  );
  return (
    <div className="flex min-h-full flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2 focus:text-space">
        {t('app.skip')}
      </a>
      <header className="relative z-50 flex items-center justify-between gap-3 bg-space px-4 py-3 text-white">
        <Link to="/" className="font-display text-xl font-extrabold uppercase tracking-wider">
          {t('app.title')}
        </Link>
        {/* Ordinateur : onglets en ligne */}
        <nav aria-label={t('nav.main')} className="hidden items-center gap-3 text-sm lg:flex">
          {tabs.map(([to, label]) => link(to, label))}
          {soundButton}
          <LanguageSwitch />
        </nav>
        {/* Téléphone et tablette : bouton menu qui déplie les onglets verticalement */}
        <div ref={menuRef} className="lg:hidden">
          <button type="button" className="menu-button" aria-expanded={menu} aria-controls="menu-mobile" aria-label={menu ? t('nav.close') : t('nav.open')} onClick={() => setMenu((m) => !m)}>
            <span className={`menu-bar ${menu ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`menu-bar ${menu ? 'scale-x-0 opacity-0' : ''}`} />
            <span className={`menu-bar ${menu ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
          <AnimatePresence>
            {menu && (
              <motion.nav
                id="menu-mobile"
                aria-label={t('nav.main')}
                initial={{ opacity: 0, scaleY: 0.6, y: -8 }}
                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                exit={{ opacity: 0, scaleY: 0.7, y: -6 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                style={{ transformOrigin: 'top right' }}
                className="menu-panel"
              >
                <ul className="flex flex-col gap-1">
                  {tabs.map(([to, label], i) => (
                    <motion.li key={to} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }}>
                      <NavLink to={to} className={({ isActive }) => `menu-item ${isActive ? 'menu-item-active' : ''}`}>
                        {label}
                      </NavLink>
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  {soundButton}
                  <LanguageSwitch />
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
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
