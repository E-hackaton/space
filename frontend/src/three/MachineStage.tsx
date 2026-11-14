import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Box3, Mesh, Vector3, type Group, type MeshStandardMaterial, type Object3D } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import type { BodySlug, EquipmentKind, MachineFocus } from '../types/api'
import { WORLD_ACCENTS } from './colors'
import { PartsContext, type PartsRegistry } from './machines/partsContext'
import { MachineModel } from './machines/models'
import styles from './Scene.module.css'

interface MachineStageProps {
  kind: EquipmentKind
  slug: string
  world: BodySlug
  /** Pièce à montrer : la caméra s'y déplace et la pièce s'illumine. */
  focus: MachineFocus
  label: string
}

/** Couleur du sol selon le monde (aucun sol dans l'espace profond : la sonde flotte). */
const GROUND_COLORS: Partial<Record<BodySlug, string>> = { moon: '#7d828c', mars: '#9a5a3a' }

/** Direction d'où la caméra regarde une pièce : un peu de côté et au-dessus, pour bien la lire. */
const VIEW_DIRECTION = new Vector3(1, 0.65, 1.5).normalize()

/** Vitesse du glissement de caméra entre deux étapes (plus grand = plus rapide). */
const CAMERA_EASING = 3

/**
 * Scène 3D d'une machine pendant la visite guidée de sa mission.
 * On peut aussi la tourner librement au doigt ou à la souris.
 */
export default function MachineStage({ kind, slug, world, focus, label }: MachineStageProps) {
  return (
    <div className={styles.machineStage} role="img" aria-label={label}>
      <Canvas camera={{ position: [3, 2.2, 4], fov: 40 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 3]} intensity={2.2} />
        {/* Contre-jour de la couleur du monde : il détache la silhouette du fond. */}
        <directionalLight position={[-4, 2, -4]} intensity={1.2} color={WORLD_ACCENTS[world]} />
        <Machine kind={kind} slug={slug} world={world} focus={focus} />
      </Canvas>
    </div>
  )
}

function Machine({ kind, slug, world, focus }: Omit<MachineStageProps, 'label'>) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const rootRef = useRef<Group>(null)
  const parts = useRef(new Map<MachineFocus, Object3D>())
  const reducedMotion = usePrefersReducedMotion()
  const materialize = useRef(0)
  // Destination de la caméra pour l'étape en cours ; null quand elle y est arrivée
  // (l'utilisateur peut alors tourner librement autour de la machine).
  const cameraGoal = useRef<{ eye: Vector3; target: Vector3 } | null>(null)

  const registry = useMemo<PartsRegistry>(
    () => ({
      register: (key, object) => {
        parts.current.set(key, object)
        return () => {
          if (parts.current.get(key) === object) parts.current.delete(key)
        }
      },
      activeFocus: focus,
      highlight: WORLD_ACCENTS[world],
    }),
    [focus, world],
  )

  // À chaque étape, on calcule où placer la caméra pour bien voir la pièce concernée.
  useEffect(() => {
    const target = (focus !== 'overview' && parts.current.get(focus)) || rootRef.current
    if (!target) return
    const box = new Box3().setFromObject(target)
    const center = box.getCenter(new Vector3())
    const distance = Math.max(box.getSize(new Vector3()).length() * 1.6, 1.4)
    cameraGoal.current = { eye: center.clone().addScaledVector(VIEW_DIRECTION, distance), target: center }  }, [focus, kind, slug])

  useFrame(({ camera }, delta) => {
    // 1. La caméra glisse vers sa destination (instantanément si les animations sont réduites).
    const goal = cameraGoal.current
    const controls = controlsRef.current
    if (goal && controls) {
      const t = reducedMotion ? 1 : Math.min(1, delta * CAMERA_EASING)
      camera.position.lerp(goal.eye, t)
      controls.target.lerp(goal.target, t)
      controls.update()
      if (camera.position.distanceTo(goal.eye) < 0.01) cameraGoal.current = null
    }

    // 2. « Redonner vie » : la machine apparaît en fantôme puis se matérialise.
    const root = rootRef.current
    if (!root || materialize.current >= 1) return
    materialize.current = reducedMotion ? 1 : Math.min(1, materialize.current + delta * 0.7)
    const done = materialize.current >= 1
    root.traverse((object) => {
      if (object instanceof Mesh) {
        const material = object.material as MeshStandardMaterial
        if (material.transparent === done) {
          material.transparent = !done
          material.needsUpdate = true // changer la transparence impose de recompiler le matériau
        }
        material.opacity = 0.15 + 0.85 * materialize.current
      }
    })
  })

  const ground = GROUND_COLORS[world]

  return (
    <>
      <PartsContext.Provider value={registry}>
        <group ref={rootRef}>
          <MachineModel kind={kind} slug={slug} />
        </group>
      </PartsContext.Provider>

      {ground && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
          <circleGeometry args={[3, 48]} />
          <meshStandardMaterial color={ground} roughness={1} transparent opacity={0.85} />
        </mesh>
      )}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={0.8}
        maxDistance={8}
        // Si l'utilisateur prend la main, on arrête de déplacer la caméra pour lui.
        onStart={() => (cameraGoal.current = null)}
      />
    </>
  )
}
