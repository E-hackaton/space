import { STATUS_DESCRIPTIONS, STATUS_LABELS } from '../content/labels'
import type { EquipmentStatus } from '../types/api'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: EquipmentStatus
}

/** Badge d'état actuel. La couleur n'est jamais seule : le libellé est toujours écrit. */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`} title={STATUS_DESCRIPTIONS[status]}>
      <span className={styles.dot} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}
