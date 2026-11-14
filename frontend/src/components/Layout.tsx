import { Question } from '@phosphor-icons/react'
import { useEffect } from 'react'
import { NavLink, Outlet, ScrollRestoration, useLocation, useMatch } from 'react-router-dom'

import { useCollection } from '../hooks/useCollection'
import { useI18n } from '../i18n/useI18n'
import { hasSeenGuide, openGuide } from '../lib/guideStore'
import { GuideTour } from './GuideTour'
import { LanguageSwitch } from './LanguageSwitch'
import styles from './Layout.module.css'
import { SankofaAvatar } from './SankofaAvatar'
import { Starfield } from './Starfield'

const activeClassName = (isActive: boolean) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)

/** Structure commune à toutes les pages : en-tête, contenu, pied de page. */
export function Layout() {
  const { t } = useI18n()
  const { collected } = useCollection()
  // Le lien « Atlas » mène à la Lune, mais il doit rester actif sur tous les lieux de l'Atlas.
  const inAtlas = useMatch('/atlas/:bodySlug') !== null
  const { pathname } = useLocation()

  // Première visite sur l'accueil : Sankofa se présente. Ensuite, le bouton « ? » permet de le revoir.
  // Volontairement exécuté une seule fois, au chargement de l'application.
  useEffect(() => {
    if (pathname === '/' && !hasSeenGuide()) openGuide()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Starfield />

      {/* Lien d'évitement : les utilisateurs au clavier sautent directement au contenu. */}
      <a href="#contenu" className={styles.skipLink}>
        {t.common.skipToContent}
      </a>

      <header className={styles.header}>
        <div className={styles.inner}>
          <NavLink to="/" className={styles.brand}>
            <SankofaAvatar size={40} />
            <span>
              Sankofa
              <span className={styles.brandTagline}>{t.common.appTagline}</span>
            </span>
          </NavLink>

          <div className={styles.headerActions}>
            <nav aria-label={t.nav.label}>
              <ul className={styles.nav}>
                <li>
                  <NavLink
                    to="/atlas/moon"
                    className={() => activeClassName(inAtlas)}
                    aria-current={inAtlas ? 'page' : undefined}
                  >
                    {t.nav.atlas}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/collection" className={({ isActive }) => activeClassName(isActive)}>
                    {t.nav.collection}
                    <span className={styles.counter}>
                      {collected.length}
                      <span className="visually-hidden">{t.nav.cardsWon}</span>
                    </span>
                  </NavLink>
                </li>
              </ul>
            </nav>
            <LanguageSwitch />
            <button type="button" className={styles.helpButton} onClick={openGuide} title={t.guide.replay}>
              <Question aria-hidden="true" weight="bold" />
              <span className="visually-hidden">{t.guide.replay}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="contenu" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.inner}>
          <p>{t.footer.team}</p>
          <p>{t.footer.data}</p>
        </div>
      </footer>

      <GuideTour />
      <ScrollRestoration />
    </>
  )
}
