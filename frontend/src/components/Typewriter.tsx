import { useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import styles from './Typewriter.module.css'

interface TypewriterProps {
  text: string
  /** Délai entre deux caractères, en millisecondes. */
  speed?: number
}

/**
 * Affiche un texte lettre par lettre, comme si Sankofa l'écrivait en direct.
 *
 * Accessibilité : le texte complet est toujours présent pour les lecteurs d'écran ;
 * seule sa version animée leur est cachée.
 */
export function Typewriter({ text, speed = 18 }: TypewriterProps) {
  const reducedMotion = usePrefersReducedMotion()
  // On garde le texte avec la progression : si le texte change, on repart de zéro sans effet.
  const [progress, setProgress] = useState({ text, count: 0 })
  const count = progress.text === text ? progress.count : 0
  const done = reducedMotion || count >= text.length

  useEffect(() => {
    if (done) return
    const timer = window.setTimeout(() => setProgress({ text, count: count + 1 }), speed)
    return () => window.clearTimeout(timer)
  }, [done, text, count, speed])

  return (
    <span>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {done ? text : text.slice(0, count)}
        {!done && <span className={styles.cursor} />}
      </span>
    </span>
  )
}
