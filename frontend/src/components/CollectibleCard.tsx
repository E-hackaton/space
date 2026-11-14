import { Lock } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

import { useI18n } from '../i18n/useI18n'
import { yearOf } from '../lib/format'
import type { EquipmentSummary } from '../types/api'
import styles from './CollectibleCard.module.css'
import { KindIcon } from './KindIcon'
import { StatusBadge } from './StatusBadge'

interface CollectibleCardProps {
  equipment: EquipmentSummary
  unlocked: boolean
}

/**
 * Carte à collectionner, au look de fiche de mission. C'est un design original,
 * sans écusson ni logo NASA.
 * Verrouillée, elle reste visible en « fantôme » pour donner envie de la débloquer.
 */
export function CollectibleCard({ equipment, unlocked }: CollectibleCardProps) {
  const { t } = useI18n()
  const year = yearOf(equipment.arrival_date ?? equipment.launch_date)

  return (
    <article className={unlocked ? styles.card : styles.cardLocked}>
      <div className={styles.art}>
        {unlocked ? (
          <KindIcon kind={equipment.kind} size={64} weight="duotone" />
        ) : (
          <Lock size={48} aria-hidden="true" />
        )}
      </div>

      <h3 className={styles.name}>
        <Link to={`/heros/${equipment.slug}`} className={styles.link}>
          {equipment.name}
        </Link>
      </h3>

      {unlocked ? (
        <>
          <p className={styles.meta}>
            {t.kinds[equipment.kind]} · {equipment.mission}
            {year && ` · ${year}`}
          </p>
          <StatusBadge status={equipment.status} />
        </>
      ) : (
        <p className={styles.meta}>{t.collection.locked}</p>
      )}
    </article>
  )
}
