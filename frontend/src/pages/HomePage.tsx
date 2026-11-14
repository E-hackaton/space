import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

import { fetchBodies } from '../api/heroes'
import { SankofaSays } from '../components/SankofaSays'
import { LoadError, Loading } from '../components/StatusMessage'
import { WorldIcon } from '../components/WorldIcon'
import { useApi } from '../hooks/useApi'
import ui from '../styles/ui.module.css'
import styles from './HomePage.module.css'

export function HomePage() {
  const bodies = useApi('bodies', fetchBodies)

  return (
    <>
      <section className={styles.hero}>
        <p className={ui.eyebrow}>Depuis 1966, ils dorment loin de la Terre</p>
        <h1>Les héros oubliés de l'espace</h1>
        <p className={styles.lead}>
          Des robots, des rovers et des sondes que la NASA a laissés sur la Lune, sur Mars et ailleurs. Leur mission
          est finie, mais leur histoire ne l'est pas.
        </p>

        <SankofaSays avatarSize={110}>
          <p>
            Salut, je suis <strong>Sankofa</strong> ! Mon nom vient d'un symbole akan qui veut dire : « il n'est pas
            interdit de retourner chercher ce qu'on a oublié ». Tu savais que des robots dorment sur Mars ? Viens,
            je te les présente.
          </p>
        </SankofaSays>

        <Link to="/atlas/moon" className={ui.button}>
          Commencer l'exploration <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section aria-labelledby="destinations">
        <h2 id="destinations">Choisis ta destination</h2>
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
                  <span className={ui.muted}>
                    {body.equipment_count} héros à découvrir
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
