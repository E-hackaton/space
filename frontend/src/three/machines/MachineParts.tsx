/**
 * Briques communes aux modèles 3D des machines.
 *
 * Chaque pièce nommée (roues, bras, panneaux…) est enveloppée dans un <Part>. La scène s'en sert
 * pour cadrer la caméra sur la pièce dont parle l'étape, et pour l'éclairer.
 */

import { useFrame } from '@react-three/fiber'
import { useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { Color, Mesh, Quaternion, Vector3, type Group, type MeshStandardMaterial } from 'three'

import type { MachineFocus } from '../../types/api'
import { MATERIALS, PartsContext } from './partsContext'

interface PartProps {
  focus: MachineFocus
  children: ReactNode
  position?: [number, number, number]
  rotation?: [number, number, number]
}

const BLACK = new Color('#000000')

/** Groupe de meshes qui forment une pièce nommée de la machine. */
export function Part({ focus, children, position, rotation }: PartProps) {
  const registry = useContext(PartsContext)
  const groupRef = useRef<Group>(null)
  const highlight = useRef(new Color())

  useLayoutEffect(() => {
    if (!registry || !groupRef.current) return
    return registry.register(focus, groupRef.current)
  }, [registry, focus])

  // La pièce active « pulse » doucement dans la couleur du monde ; les autres restent neutres.
  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group || !registry) return
    const active = registry.activeFocus === focus && focus !== 'overview'
    highlight.current.set(registry.highlight)
    const intensity = active ? 0.35 + 0.25 * Math.sin(clock.elapsedTime * 3) : 0
    group.traverse((object) => {
      if (object instanceof Mesh) {
        const material = object.material as MeshStandardMaterial
        if (!material.emissive) return
        material.emissive.copy(active ? highlight.current : BLACK)
        material.emissiveIntensity = intensity
      }
    })
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {children}
    </group>
  )
}

const UP = new Vector3(0, 1, 0)

interface StrutProps {
  from: [number, number, number]
  to: [number, number, number]
  radius?: number
  kind?: keyof typeof MATERIALS
}

/**
 * Barre tendue entre deux points (pied, bras, mât…).
 * Plus simple et plus juste que de calculer des rotations à la main pour chaque pièce.
 */
export function Strut({ from, to, radius = 0.015, kind = 'hull' }: StrutProps) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new Vector3(...from)
    const direction = new Vector3(...to).sub(start)
    return {
      length: direction.length(),
      position: start.clone().addScaledVector(direction, 0.5),
      // Un cylindre three.js est vertical (axe Y) : on le fait pivoter vers la direction voulue.
      quaternion: new Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
    }
  }, [from, to])

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <Mat kind={kind} />
    </mesh>
  )
}

/** Raccourci : un matériau standard à partir de la palette. */
export function Mat({ kind }: { kind: keyof typeof MATERIALS }) {
  return <meshStandardMaterial {...MATERIALS[kind]} />
}
