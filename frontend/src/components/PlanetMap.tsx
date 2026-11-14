import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import { STATUS_LABELS } from '../content/labels'
import type { MapAsset } from '../content/maps'
import { stackIndexes, toMapPosition } from '../lib/geo'
import { phaseAt, type HeroPhase } from '../lib/timeline'
import type { EquipmentSummary } from '../types/api'
import styles from './PlanetMap.module.css'

interface PlanetMapProps {
  map: MapAsset
  /** Nom du lieu, pour le texte alternatif (« Carte de Mars »). */
  bodyName: string
  equipment: EquipmentSummary[]
  /** Année affichée par la machine à remonter le temps. */
  year: number
}

/** Engin placé sur la carte : sa position est connue (garantie par le filtre ci-dessous). */
type PlacedEquipment = EquipmentSummary & { latitude: number; longitude: number }

function isPlaced(item: EquipmentSummary): item is PlacedEquipment {
  return item.latitude !== null && item.longitude !== null
}

/** Ce qu'un lecteur d'écran annonce pour un marqueur, selon l'année affichée. */
function describe(item: EquipmentSummary, phase: HeroPhase): string {
  const state = phase === 'working' ? 'en mission' : STATUS_LABELS[item.status].toLowerCase()
  return `${item.name} (${item.mission}), ${state}`
}

/**
 * Carte équirectangulaire avec les « ghost rovers ». Chaque engin apparaît à sa vraie position
 * l'année de son arrivée, brille tant qu'il est en mission, puis devient un fantôme.
 *
 * Accessibilité : chaque marqueur est un vrai lien, atteignable au clavier, avec un nom explicite.
 * La page affiche aussi la liste des héros en texte, pour ceux qui ne voient pas la carte.
 */
export function PlanetMap({ map, bodyName, equipment, year }: PlanetMapProps) {
  const placed = equipment.filter(isPlaced)
  const positions = placed.map((item) => toMapPosition(item.latitude, item.longitude))
  const stacks = stackIndexes(positions)

  return (
    <figure className={styles.figure}>
      <div className={styles.map}>
        <img src={map.src} alt={`Carte de ${bodyName}`} className={styles.image} />

        {/* Méridiens et parallèles tous les 30° : un repère « scientifique », purement décoratif. */}
        <svg className={styles.graticule} viewBox="0 0 360 180" preserveAspectRatio="none" aria-hidden="true">
          {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((x) => (
            <line key={`m${x}`} x1={x} y1={0} x2={x} y2={180} />
          ))}
          {[30, 60, 90, 120, 150].map((y) => (
            <line key={`p${y}`} x1={0} y1={y} x2={360} y2={y} />
          ))}
        </svg>

        <ul className={styles.markers}>
          {placed.map((item, index) => {
            const phase = phaseAt(item, year)
            // Pas encore arrivé à cette date : il n'apparaît pas encore sur la carte.
            if (phase === 'future' || phase === 'traveling') return null

            const { left, top } = positions[index] ?? toMapPosition(item.latitude, item.longitude)
            // Variable CSS personnalisée : React exige un cast, car CSSProperties ne la connaît pas.
            const style = { left: `${left}%`, top: `${top}%`, '--stack': stacks[index] ?? 0 } as CSSProperties
            const look = phase === 'working' ? styles.working : styles[item.status]

            return (
              <li key={item.slug} className={styles.markerItem} style={style}>
                <Link
                  to={`/heros/${item.slug}`}
                  className={`${styles.marker} ${look}`}
                  aria-label={describe(item, phase)}
                >
                  <span className={styles.ghost} aria-hidden="true" />
                  <span className={styles.label} aria-hidden="true">
                    {item.name}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <figcaption className={styles.caption}>
        <ul className={styles.legend} aria-label="Légende">
          <li className={styles.legendWorking}>En mission</li>
          <li className={styles.legendSilent}>Fantôme : mission terminée</li>
        </ul>
        <a href={map.sourceUrl} target="_blank" rel="noreferrer" className={styles.credit}>
          {map.credit}
        </a>
      </figcaption>
    </figure>
  )
}
