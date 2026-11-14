import { Canvas } from '@react-three/fiber'

import { SankofaModel } from './SankofaModel'
import styles from './Scene.module.css'

interface SankofaBotProps {
  /** Vrai pendant que Sankofa parle : ses yeux s'animent au rythme de la voix. */
  speaking: boolean
}

/**
 * Sankofa en 3D : un petit robot low-poly construit en code (personnage original, aucun élément NASA).
 * Purement décoratif : ce qu'il dit est toujours écrit dans la bulle à côté.
 */
export default function SankofaBot({ speaking }: SankofaBotProps) {
  return (
    <div className={styles.botStage} aria-hidden="true">
      {/* Caméra à mi-hauteur du robot (0,9) et assez reculée pour le voir en entier, antenne comprise. */}
      <Canvas camera={{ position: [0, 0.9, 4.2], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 4]} intensity={2} />
        <SankofaModel speaking={speaking} />
      </Canvas>
    </div>
  )
}
