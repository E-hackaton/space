import { ArrowLeft, ArrowSquareOut, Lightbulb } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { fetchEquipment } from '../api/heroes'
import { KindIcon } from '../components/KindIcon'
import { Quiz } from '../components/Quiz'
import { StatusBadge } from '../components/StatusBadge'
import { LoadError, Loading } from '../components/StatusMessage'
import { StoryReader } from '../components/StoryReader'
import { UnlockCelebration } from '../components/UnlockCelebration'
import { KIND_LABELS, STATUS_DESCRIPTIONS } from '../content/labels'
import { EXPERIENCES } from '../experiences'
import { useApi } from '../hooks/useApi'
import { useCollection } from '../hooks/useCollection'
import { useWorldTheme } from '../hooks/useWorldTheme'
import { formatDate } from '../lib/format'
import { formatCoordinate } from '../lib/geo'
import ui from '../styles/ui.module.css'
import type { EquipmentDetail } from '../types/api'
import styles from './HeroPage.module.css'

export function HeroPage() {
  const { slug = '' } = useParams()
  const hero = useApi(`equipment-detail:${slug}`, (signal) => fetchEquipment(slug, signal))

  if (hero.status === 'loading') return <Loading label="J'ouvre les archives…" />
  if (hero.status === 'error') return <LoadError error={hero.error} />
  // key : on remonte toute la fiche quand on change de héros (histoire et quiz repartent de zéro).
  return <HeroSheet key={hero.data.slug} hero={hero.data} />
}

function HeroSheet({ hero }: { hero: EquipmentDetail }) {
  const collection = useCollection()
  const collected = collection.has(hero.slug)
  const [celebrating, setCelebrating] = useState(false)
  const experience = EXPERIENCES[hero.slug]
  useWorldTheme(hero.body) // la fiche prend la couleur du monde où repose le héros

  function handleQuizComplete() {
    // On ne fête que la première victoire : refaire le quiz ne redonne pas la carte.
    if (!collection.has(hero.slug)) setCelebrating(true)
    collection.add(hero.slug)
  }

  return (
    <article className={styles.sheet}>
      <Link to={`/atlas/${hero.body}`} className={styles.back}>
        <ArrowLeft aria-hidden="true" /> Retour à l'Atlas
      </Link>

      <header className={styles.header}>
        <div className={styles.portrait}>
          {hero.image ? (
            <img src={hero.image} alt={`Photo de ${hero.name}`} />
          ) : (
            <KindIcon kind={hero.kind} size={96} weight="duotone" />
          )}
        </div>
        <div>
          <p className={ui.eyebrow}>
            {KIND_LABELS[hero.kind]} · {hero.mission}
          </p>
          <h1>{hero.name}</h1>
          <p className={styles.tagline}>« {hero.tagline} »</p>
          <StatusBadge status={hero.status} />
          {collected && <p className={styles.collected}>★ Carte dans ta collection</p>}
        </div>
      </header>

      {hero.image_credit && <p className={styles.credit}>Image : {hero.image_credit}</p>}

      <MissionFacts hero={hero} />

      <section className={ui.panel} aria-labelledby="histoire">
        <h2 id="histoire">Mon histoire</h2>
        <StoryReader chapters={hero.chapters} nextSectionId={hero.quiz.length > 0 ? 'quiz' : undefined} />
      </section>

      <section className={styles.discovery} aria-labelledby="science">
        <h2 id="science">
          <Lightbulb aria-hidden="true" weight="fill" /> La science que j'ai rendue possible
        </h2>
        <p>{hero.discovery}</p>
      </section>

      {experience && (
        <section className={`${ui.panel} ${styles.experience}`} aria-labelledby="experience">
          <p className={ui.eyebrow}>À toi de jouer</p>
          <h2 id="experience">{experience.title}</h2>
          <p>{experience.intro}</p>
          <experience.Component />
        </section>
      )}

      {hero.status_note && (
        <section aria-labelledby="aujourdhui">
          <h2 id="aujourdhui">Ce que je deviens</h2>
          <p>{hero.status_note}</p>
          <p className={ui.muted}>{STATUS_DESCRIPTIONS[hero.status]}</p>
        </section>
      )}

      {hero.quiz.length > 0 && (
        <section id="quiz" className={ui.panel} aria-labelledby="quiz-titre">
          <h2 id="quiz-titre">Le défi de {hero.name}</h2>
          <p>Réponds à toutes les questions pour gagner ma carte !</p>
          <Quiz questions={hero.quiz} onComplete={handleQuizComplete} />
        </section>
      )}

      <Sources hero={hero} />

      {celebrating && <UnlockCelebration equipment={hero} onClose={() => setCelebrating(false)} />}
    </article>
  )
}

/** Fiche d'identité : dates clés et lieu de repos. */
function MissionFacts({ hero }: { hero: EquipmentDetail }) {
  const facts: Array<{ label: string; value: string | null; wide?: boolean }> = [
    { label: 'Lancement', value: formatDate(hero.launch_date) },
    { label: 'Arrivée', value: formatDate(hero.arrival_date) },
    { label: 'Dernier contact', value: formatDate(hero.last_contact_date) },
    { label: 'Fin de mission', value: formatDate(hero.mission_end_date) },
    { label: 'Où je repose', value: hero.location || null, wide: true },
    {
      label: 'Coordonnées',
      value:
        hero.latitude !== null && hero.longitude !== null
          ? `${formatCoordinate(hero.latitude, 'lat')}, ${formatCoordinate(hero.longitude, 'lon')}`
          : null,
    },
  ]

  return (
    <dl className={styles.facts}>
      {facts
        .filter((fact) => fact.value)
        .map((fact) => (
          <div key={fact.label} className={fact.wide ? `${styles.fact} ${styles.factWide}` : styles.fact}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
    </dl>
  )
}

/** Les sources : la validité scientifique est un critère du jury, et une bonne habitude à transmettre. */
function Sources({ hero }: { hero: EquipmentDetail }) {
  if (hero.sources.length === 0) return null

  return (
    <section aria-labelledby="sources" className={styles.sources}>
      <h2 id="sources">Mes sources</h2>
      <ul>
        {hero.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.label} <ArrowSquareOut aria-hidden="true" />
              <span className="visually-hidden"> (nouvel onglet)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
