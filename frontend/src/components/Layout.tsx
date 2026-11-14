import { NavLink, Outlet, ScrollRestoration, useMatch } from 'react-router-dom'

import { useCollection } from '../hooks/useCollection'
import styles from './Layout.module.css'
import { SankofaAvatar } from './SankofaAvatar'
import { Starfield } from './Starfield'

const activeClassName = (isActive: boolean) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)

/** Structure commune à toutes les pages : en-tête, contenu, pied de page. */
export function Layout() {
  const { collected } = useCollection()
  // Le lien « Atlas » mène à la Lune, mais il doit rester actif sur tous les lieux de l'Atlas.
  const inAtlas = useMatch('/atlas/:bodySlug') !== null

  return (
    <>
      <Starfield />

      {/* Lien d'évitement : les utilisateurs au clavier sautent directement au contenu. */}
      <a href="#contenu" className={styles.skipLink}>
        Aller au contenu
      </a>

      <header className={styles.header}>
        <div className={styles.inner}>
          <NavLink to="/" className={styles.brand}>
            <SankofaAvatar size={40} />
            <span>
              Sankofa
              <span className={styles.brandTagline}>Les héros oubliés de l'espace</span>
            </span>
          </NavLink>

          <nav aria-label="Navigation principale">
            <ul className={styles.nav}>
              <li>
                <NavLink
                  to="/atlas/moon"
                  className={() => activeClassName(inAtlas)}
                  aria-current={inAtlas ? 'page' : undefined}
                >
                  Atlas
                </NavLink>
              </li>
              <li>
                <NavLink to="/collection" className={({ isActive }) => activeClassName(isActive)}>
                  Ma collection
                  <span className={styles.counter}>
                    {collected.length}
                    <span className="visually-hidden"> cartes gagnées</span>
                  </span>
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenu" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.inner}>
          <p>
            Projet réalisé par l'équipe G. Bugs (Abidjan) pour le NASA Space Apps Challenge 2026. Ce site n'est
            ni approuvé ni soutenu par la NASA.
          </p>
          <p>
            Données et images : NASA (NSSDCA, NASA Science, Scientific Visualization Studio) et USGS. Les sources
            de chaque héros sont citées sur sa fiche.
          </p>
        </div>
      </footer>

      <ScrollRestoration />
    </>
  )
}
