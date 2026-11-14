import { Globe, MapTrifold } from '@phosphor-icons/react'
import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { MapAsset } from '../content/maps'
import type { Messages } from '../i18n/messages/fr'
import { useI18n } from '../i18n/useI18n'
import { stackIndexes, toMapPosition } from '../lib/geo'
import { phaseAt } from '../lib/timeline'
import { canUseWebGL } from '../lib/webgl'
import { WORLD_ACCENTS } from '../three/colors'
import type { GlobeMarker } from '../three/PlanetGlobe'
import type { BodySlug, EquipmentSummary } from '../types/api'
import styles from './AtlasView.module.css'
import { PlanetMap } from './PlanetMap'
import { Loading } from './StatusMessage'

// Le globe 3D (three.js) n'est téléchargé que si on l'affiche.
const PlanetGlobe = lazy(() => import('../three/PlanetGlobe'))

type View = '3d' | '2d'

interface AtlasViewProps {
  body: BodySlug
  bodyName: string
  map: MapAsset
  equipment: EquipmentSummary[]
  year: number
}

/** Machines visibles à l'année affichée, converties en marqueurs pour le globe 3D. */
function buildMarkers(equipment: EquipmentSummary[], year: number, t: Messages): GlobeMarker[] {
  const placed = equipment.filter(
    (item): item is EquipmentSummary & { latitude: number; longitude: number } =>
      item.latitude !== null && item.longitude !== null,
  )
  const stacks = stackIndexes(placed.map((item) => toMapPosition(item.latitude, item.longitude)))

  return placed.flatMap((item, index) => {
    const phase = phaseAt(item, year)
    if (phase === 'future' || phase === 'traveling') return [] // pas encore arrivé
    const look = phase === 'working' ? 'working' : item.status
    const state = phase === 'working' ? t.map.working : t.status.labels[item.status].toLowerCase()
    return [
      {
        slug: item.slug,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        look,
        description: `${item.name} (${item.mission}), ${state}`,
        stack: stacks[index] ?? 0,
      },
    ]
  })
}

/**
 * Vue d'un monde dans l'Atlas : globe 3D par défaut, carte 2D au choix (ou d'office si le navigateur
 * ne gère pas la 3D). Les deux suivent la machine à remonter le temps.
 */
export function AtlasView({ body, bodyName, map, equipment, year }: AtlasViewProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const webgl = canUseWebGL()
  const [view, setView] = useState<View>(webgl ? '3d' : '2d')

  return (
    <div>
      {webgl && (
        <div className={styles.switch} role="group" aria-label={t.atlas.viewLabel}>
          <button type="button" aria-pressed={view === '3d'} onClick={() => setView('3d')} className={styles.option}>
            <Globe aria-hidden="true" /> {t.atlas.view3d}
          </button>
          <button type="button" aria-pressed={view === '2d'} onClick={() => setView('2d')} className={styles.option}>
            <MapTrifold aria-hidden="true" /> {t.atlas.view2d}
          </button>
        </div>
      )}

      {view === '3d' ? (
        <Suspense fallback={<Loading />}>
          <PlanetGlobe
            textureUrl={map.src}
            accent={WORLD_ACCENTS[body]}
            markers={buildMarkers(equipment, year, t)}
            label={t.atlas.globeLabel(bodyName)}
            onSelect={(slug) => navigate(`/heros/${slug}`)}
          />
          <p className={styles.hint}>{t.atlas.globeHint}</p>
        </Suspense>
      ) : (
        <PlanetMap map={map} bodyName={bodyName} equipment={equipment} year={year} />
      )}
    </div>
  )
}
