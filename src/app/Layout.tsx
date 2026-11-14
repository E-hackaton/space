import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '../components/ui/LanguageSwitch';
import { webglAvailable } from '../lib/device';

export function Layout() {
  const { t } = useTranslation();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded px-2 py-1 hover:text-white ${isActive ? 'text-white underline underline-offset-4' : 'text-slate-300'}`;
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
          <NavLink to="/mission" className={linkClass}>{t('nav.mission')}</NavLink>
          <NavLink to="/carte" className={linkClass}>{t('nav.map')}</NavLink>
          <NavLink to="/visite" className={linkClass}>{t('nav.tour')}</NavLink>
          <NavLink to="/sources" className={linkClass}>{t('nav.sources')}</NavLink>
          <LanguageSwitch />
        </nav>
      </header>
      {!webglAvailable && (
        <p className="bg-dormant/20 px-4 py-2 text-sm text-slate-900 dark:text-slate-100">{t('lite.notice')}</p>
      )}
      <main id="contenu" className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
