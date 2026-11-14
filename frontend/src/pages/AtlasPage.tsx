import { useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'

import { fetchBodies, fetchEquipmentList } from '../api/heroes'
import { AtlasView } from '../components/AtlasView'
import { HeroTile } from '../components/HeroTile'
import { SankofaSays } from '../components/SankofaSays'
import { LoadError, Loading } from '../components/StatusMessage'
import { TimeMachine } from '../components/TimeMachine'
import { Typewriter } from '../components/Typewriter'
import { WorldIcon } from '../components/WorldIcon'
import { BODY_ORDER } from '../content/labels'
import { MAPS } from '../content/maps'
import { useApi } from '../hooks/useApi'
import { useWorldTheme } from '../hooks/useWorldTheme'
import type { Messages } from '../i18n/messages/fr'
import { useI18n } from '../i18n/useI18n'
import { phaseAt, TIMELINE_END_YEAR, type HeroPhase } from '../lib/timeline'
import ui from '../styles/ui.module.css'
import type { BodySlug } from '../types/api'
import styles from './AtlasPage.module.css'
import { NotFoundPage } from './NotFoundPage'

function isBodySlug(value: string | undefined): value is BodySlug {
  return BODY_ORDER.some((slug) => slug === value)
}

/** Note affichée sur une vignette quand on remonte le temps. Rien à dire si le héros est déjà là. */
function timeNote(phase: HeroPhase, year: number, t: Messages): string | undefined {
  if (phase === 'future') return t.atlas.notLaunched(year)
  if (phase === 'traveling') return t.atlas.traveling(year)
  return undefined
}

/** Point d'entrée de la route /atlas/:bodySlug : refuse les lieux inconnus avant tout appel réseau. */
export function AtlasPage() {
  const { bodySlug } = useParams()
  if (!isBodySlug(bodySlug)) return <NotFoundPage />
  // key : changer de lieu remet la machine à remonter le temps à aujourd'hui.
  return <Atlas key={bodySlug} bodySlug={bodySlug} />
}

function Atlas({ bodySlug }: { bodySlug: BodySlug }) {
  const { t } = useI18n()
  const bodies = useApi('bodies', fetchBodies)
  const equipment = useApi(`equipment:${bodySlug}`, (signal) => fetchEquipmentList(bodySlug, signal))
  const [year, setYear] = useState(TIMELINE_END_YEAR)
  useWorldTheme(bodySlug)

  const body = bodies.status === 'success' ? bodies.data.find((item) => item.slug === bodySlug) : undefined
  const map = MAPS[bodySlug]

  return (
    <>
      <h1>{t.atlas.title}</h1>

      {bodies.status === 'success' && (
        <nav aria-label={t.atlas.placesLabel}>
          <ul className={styles.tabs}>
            {bodies.data.map((item) => (
              // data-world : chaque onglet porte déjà la couleur de son monde, même inactif.
              <li key={item.slug} data-world={item.slug}>
                {/* NavLink ajoute aria-current="page" sur l'onglet actif. */}
                <NavLink to={`/atlas/${item.slug}`} className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
                  <WorldIcon world={item.slug} size={22} className={styles.tabIcon} />
                  {item.name} <span className={styles.tabCount}>{item.equipment_count}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {body?.intro && (
        <SankofaSays>
          <p>
            <Typewriter text={body.intro} />
          </p>
        </SankofaSays>
      )}

      {equipment.status === 'loading' && <Loading label={t.atlas.searching} />}
      {equipment.status === 'error' && <LoadError error={equipment.error} />}
      {equipment.status === 'success' && (
        <>
          <TimeMachine heroes={equipment.data} year={year} onYearChange={setYear} />

          {map && <AtlasView body={bodySlug} bodyName={body?.name ?? ''} map={map} equipment={equipment.data} year={year} />}

          <section aria-labelledby="liste-heros">
            <h2 id="liste-heros">{t.atlas.listTitle}</h2>
            <ul className={ui.grid}>
              {equipment.data.map((item) => {
                const phase = phaseAt(item, year)
                return (
                  <li key={item.slug} className="reveal">
                    <HeroTile equipment={item} timeNote={timeNote(phase, year, t)} dimmed={phase === 'future'} />
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </>
  )
}
