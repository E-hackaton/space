import { useI18n } from '../i18n/useI18n'
import type { EquipmentStatus } from '../types/api'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: EquipmentStatus
}

/** Badge d'état actuel. La couleur n'est jamais seule : le libellé est toujours écrit. */
export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useI18n()

  return (
    <span className={`${styles.badge} ${styles[status]}`} title={t.status.descriptions[status]}>
      <span className={styles.dot} aria-hidden="true" />
      {t.status.labels[status]}
    </span>
  )
}
