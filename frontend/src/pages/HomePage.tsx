import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

import { fetchBodies } from '../api/heroes'
import { SankofaSays } from '../components/SankofaSays'
import { LoadError, Loading } from '../components/StatusMessage'
import { WorldIcon } from '../components/WorldIcon'
import { useApi } from '../hooks/useApi'
import { useI18n } from '../i18n/useI18n'
import ui from '../styles/ui.module.css'
import styles from './HomePage.module.css'

export function HomePage() {
  const { t } = useI18n()
  const bodies = useApi('bodies', fetchBodies)

  return (
    <>
      <section className={styles.hero}>
        <p className={ui.eyebrow}>{t.home.eyebrow}</p>
        <h1>{t.home.title}</h1>
        <p className={styles.lead}>{t.home.lead}</p>

        <SankofaSays avatarSize={110}>
          <p>{t.home.sankofaIntro}</p>
        </SankofaSays>

        <Link to="/atlas/moon" className={ui.button}>
          {t.home.start} <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section aria-labelledby="destinations">
        <h2 id="destinations">{t.home.destinations}</h2>
        {bodies.status === 'loading' && <Loading />}
        {bodies.status === 'error' && <LoadError error={bodies.error} />}
        {bodies.status === 'success' && (
          <ul className={ui.grid}>
            {bodies.data.map((body) => (
              // data-world : chaque carte de destination prend la couleur de son monde.
              <li key={body.slug} data-world={body.slug} className="reveal">
                <Link to={`/atlas/${body.slug}`} className={styles.destination}>
                  <WorldIcon world={body.slug} size={40} className={styles.destinationIcon} />
                  <span className={styles.destinationName}>{body.name}</span>
                  <span className={ui.muted}>{t.home.heroesToDiscover(body.equipment_count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
