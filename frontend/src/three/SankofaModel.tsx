import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

interface SankofaModelProps {
  /** Vrai pendant que Sankofa parle (ou vole) : ses yeux s'animent. */
  speaking: boolean
}

/**
 * Le modèle 3D de Sankofa, le robot guide (personnage original, aucun élément NASA).
 * Réutilisé à l'accueil (SankofaBot) et sur les globes, où il vole jusqu'aux machines.
 * Les pieds sont en y = 0 et le robot mesure environ 1,8 unité.
 */
const BLUE = '#2E96F5'
const DEEP_BLUE = '#07173F'
const NEON_BLUE = '#0960E1'
const YELLOW = '#EAFE07'

export function SankofaModel({ speaking }: SankofaModelProps) {
  const bodyRef = useRef<Group>(null)
  const leftEye = useRef<Mesh>(null)
  const rightEye = useRef<Mesh>(null)
  const reducedMotion = usePrefersReducedMotion()

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    if (bodyRef.current && !reducedMotion) {
      bodyRef.current.position.y = Math.sin(time * 1.6) * 0.06 // il flotte
      bodyRef.current.rotation.y = Math.sin(time * 0.6) * 0.35 // il regarde autour de lui
    }
    // Les yeux « parlent » quand la voix joue, et clignent de temps en temps sinon.
    const blink = time % 4 < 0.12 ? 0.15 : 1
    const talk = speaking && !reducedMotion ? 0.55 + 0.45 * Math.abs(Math.sin(time * 11)) : blink
    leftEye.current?.scale.set(1, talk, 1)
    rightEye.current?.scale.set(1, talk, 1)
  })

  return (
    <group ref={bodyRef}>
      {/* Antenne */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} />
        <meshStandardMaterial color={YELLOW} />
      </mesh>
      <mesh position={[0, 1.74, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.6} />
      </mesh>

      {/* Tête et visière */}
      <mesh position={[0, 1.0, 0]} scale={[1, 0.72, 0.8]}>
        <sphereGeometry args={[0.6, 32, 24]} />
        <meshStandardMaterial color={BLUE} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.0, 0.3]} scale={[0.78, 0.42, 0.42]}>
        <sphereGeometry args={[0.6, 32, 24]} />
        <meshStandardMaterial color={DEEP_BLUE} roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Yeux */}
      <mesh ref={leftEye} position={[-0.17, 1.02, 0.55]}>
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={rightEye} position={[0.17, 1.02, 0.55]}>
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.8} />
      </mesh>

      {/* Corps */}
      <mesh position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.34, 0.28, 8, 24]} />
        <meshStandardMaterial color={NEON_BLUE} roughness={0.5} />
      </mesh>
      {/* Emblème : un anneau doré, clin d'œil aux spirales du symbole Sankofa. */}
      <mesh position={[0, 0.34, 0.33]}>
        <torusGeometry args={[0.1, 0.03, 12, 24]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}
