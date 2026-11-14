import type { ReactNode } from 'react'

import { useI18n } from '../i18n/useI18n'
import { SankofaAvatar } from './SankofaAvatar'
import styles from './SankofaSays.module.css'

interface SankofaSaysProps {
  children: ReactNode
  avatarSize?: number
}

/** Sankofa prend la parole : avatar et bulle de dialogue. */
export function SankofaSays({ children, avatarSize = 88 }: SankofaSaysProps) {
  const { t } = useI18n()

  return (
    <div className={styles.wrapper}>
      <SankofaAvatar size={avatarSize} />
      <div className={styles.bubble}>
        {/* Le nom est lu par les lecteurs d'écran : on sait ainsi qui parle. */}
        <p className={styles.speaker}>{t.common.speaker}</p>
        {children}
      </div>
    </div>
  )
}
