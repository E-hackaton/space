import { Link } from 'react-router-dom'

import { useI18n } from '../i18n/useI18n'
import { yearOf } from '../lib/format'
import type { EquipmentSummary } from '../types/api'
import styles from './HeroTile.module.css'
import { KindIcon } from './KindIcon'
import { StatusBadge } from './StatusBadge'

interface HeroTileProps {
  equipment: EquipmentSummary
  /** Note de contexte venue de la machine à remonter le temps, ex. « En route en 1975 ». */
  timeNote?: string
  /** Vrai si le héros n'existe pas encore à l'année affichée : la vignette est estompée. */
  dimmed?: boolean
}

/** Vignette d'un héros dans une liste. Toute la carte est cliquable. */
export function HeroTile({ equipment, timeNote, dimmed = false }: HeroTileProps) {
  const { t } = useI18n()
  const year = yearOf(equipment.arrival_date ?? equipment.launch_date)

  return (
    <article className={dimmed ? `${styles.tile} ${styles.dimmed}` : styles.tile}>
      {timeNote && <p className={styles.timeNote}>{timeNote}</p>}
      <div className={styles.header}>
        <KindIcon kind={equipment.kind} size={28} weight="duotone" className={styles.icon} />
        <StatusBadge status={equipment.status} />
      </div>
      <h3 className={styles.title}>
        {/* Le lien couvre toute la vignette grâce au pseudo-élément ::after (voir le CSS). */}
        <Link to={`/heros/${equipment.slug}`} className={styles.link}>
          {equipment.name}
        </Link>
      </h3>
      <p className={styles.meta}>
        {t.kinds[equipment.kind]} · {equipment.mission}
        {year && ` · ${year}`}
      </p>
      <p className={styles.tagline}>{t.common.quote(equipment.tagline)}</p>
    </article>
  )
}
