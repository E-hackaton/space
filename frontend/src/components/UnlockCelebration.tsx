import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import ui from '../styles/ui.module.css'
import type { EquipmentSummary } from '../types/api'
import { CollectibleCard } from './CollectibleCard'
import styles from './UnlockCelebration.module.css'

interface UnlockCelebrationProps {
  equipment: EquipmentSummary
  onClose: () => void
}

/** Couleurs des confettis : la palette Space Apps. */
const CONFETTI_COLORS = ['#EAFE07', '#2E96F5', '#0960E1', '#FFFFFF', '#3DDC97']
const CONFETTI_COUNT = 28

/**
 * Fenêtre de célébration quand l'élève gagne une carte : la carte se retourne, des confettis tombent.
 *
 * Elle utilise l'élément natif <dialog> en mode modal : le focus y est piégé, la touche Échap
 * la ferme, et le reste de la page est rendu inerte. Le navigateur gère toute l'accessibilité.
 */
export function UnlockCelebration({ equipment, onClose }: UnlockCelebrationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Pas de fermeture dans un nettoyage : retirer le <dialog> du DOM suffit à le fermer.
  // Un close() ici le refermerait aussitôt en développement, où StrictMode joue chaque effet deux fois.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose} aria-labelledby="celebration-title">
      <div className={styles.confetti} aria-hidden="true">
        {Array.from({ length: CONFETTI_COUNT }, (_, index) => (
          <span
            key={index}
            style={{
              left: `${(index * 37) % 100}%`,
              background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
              animationDelay: `${(index % 7) * 0.12}s`,
            }}
          />
        ))}
      </div>

      <h2 id="celebration-title" className={styles.title}>
        Nouvelle carte débloquée !
      </h2>
      <div className={styles.card}>
        <CollectibleCard equipment={equipment} unlocked />
      </div>
      <p>
        {equipment.name} rejoint ta collection. Merci de ne pas l'avoir oublié !
      </p>

      <div className={styles.actions}>
        <Link to="/collection" className={ui.button}>
          Voir ma collection
        </Link>
        <button type="button" className={ui.buttonGhost} onClick={() => dialogRef.current?.close()}>
          Continuer
        </button>
      </div>
    </dialog>
  )
}
