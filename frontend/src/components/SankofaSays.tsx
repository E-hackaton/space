import type { ReactNode } from 'react'

import { SankofaAvatar } from './SankofaAvatar'
import styles from './SankofaSays.module.css'

interface SankofaSaysProps {
  children: ReactNode
  avatarSize?: number
}

/** Sankofa prend la parole : avatar et bulle de dialogue. */
export function SankofaSays({ children, avatarSize = 88 }: SankofaSaysProps) {
  return (
    <div className={styles.wrapper}>
      <SankofaAvatar size={avatarSize} />
      <div className={styles.bubble}>
        {/* Le nom est lu par les lecteurs d'écran : on sait ainsi qui parle. */}
        <p className={styles.speaker}>Sankofa</p>
        {children}
      </div>
    </div>
  )
}
