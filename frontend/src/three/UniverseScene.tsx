import { Html, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useMemo, useRef, useState } from 'react'
import { IcosahedronGeometry, SRGBColorSpace, type Group, type Texture } from 'three'

import { MAPS } from '../content/maps'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import type { BodySlug } from '../types/api'
import { WORLD_ACCENTS } from './colors'
import styles from './Scene.module.css'

export interface WorldOption {
  slug: BodySlug
  name: string
  subtitle: string
}

interface UniverseSceneProps {
  worlds: WorldOption[]
  onSelect: (slug: BodySlug) => void
  label: string
}

/**
 * Écran « Choisis ton univers » : la Lune, Mars et l'espace profond flottent en 3D.
 * On survole un monde pour le mettre en avant, et un clic (ou la touche Entrée sur son nom) pour y aller.
 */
export default function UniverseScene({ worlds, onSelect, label }: UniverseSceneProps) {
  return (
    <div className={styles.universeStage} role="group" aria-label={label}>
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }} dpr={[1, 2]}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 2, 5]} intensity={2.2} />
        <Suspense fallback={null}>
          <Worlds worlds={worlds} onSelect={onSelect} />
        </Suspense>
      </Canvas>
    </div>
  )
}

function Worlds({ worlds, onSelect }: Omit<UniverseSceneProps, 'label'>) {
  const { viewport } = useThree()
  // Sur un écran étroit (téléphone), les mondes s'empilent verticalement.
  const narrow = viewport.width < 6
  const spacing = narrow ? 2.1 : Math.min(2.7, viewport.width / 3.2)
  const radius = narrow ? 0.62 : 0.8

  return (
    <>
      {worlds.map((world, index) => {
        const offset = index - (worlds.length - 1) / 2
        const position: [number, number, number] = narrow ? [0, -offset * spacing, 0] : [offset * spacing, 0.15, 0]
        return <WorldBody key={world.slug} world={world} position={position} radius={radius} onSelect={onSelect} />
      })}
    </>
  )
}

interface WorldBodyProps {
  world: WorldOption
  position: [number, number, number]
  radius: number
  onSelect: (slug: BodySlug) => void
}

function WorldBody({ world, position, radius, onSelect }: WorldBodyProps) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    if (!reducedMotion) group.rotation.y += delta * 0.15
    // Zoom doux au survol : on interpole vers la taille visée plutôt que de sauter.
    const target = hovered ? 1.15 : 1
    group.scale.setScalar(group.scale.x + (target - group.scale.x) * Math.min(1, delta * 8))
  })

  const select = () => onSelect(world.slug)

  return (
    <group position={position}>
      <group
        ref={groupRef}
        onClick={select}
        onPointerOver={() => {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = ''
        }}
      >
        {world.slug === 'elsewhere' ? <DeepSpace radius={radius} /> : <TexturedWorld slug={world.slug} radius={radius} />}
      </group>

      <Html position={[0, -radius - 0.35, 0]} center>
        <button
          type="button"
          data-world={world.slug}
          className={hovered ? `${styles.worldLabel} ${styles.worldLabelActive}` : styles.worldLabel}
          onClick={select}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          <span className={styles.worldName}>{world.name}</span>
          <span className={styles.worldSubtitle}>{world.subtitle}</span>
        </button>
      </Html>
    </group>
  )
}

function TexturedWorld({ slug, radius }: { slug: 'moon' | 'mars'; radius: number }) {
  const texture = useTexture(MAPS[slug]?.src ?? '', (loaded: Texture) => {
    loaded.colorSpace = SRGBColorSpace
  })
  return (
    <>
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial map={texture} roughness={1} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color={WORLD_ACCENTS[slug]} transparent opacity={0.08} />
      </mesh>
    </>
  )
}

/**
 * L'espace profond : un astéroïde (comme Éros, où repose NEAR Shoemaker) et une petite sonde en orbite.
 * La forme est générée en code : aucune donnée à télécharger.
 */
function DeepSpace({ radius }: { radius: number }) {
  const probeRef = useRef<Group>(null)

  const geometry = useMemo(() => {
    const shape = new IcosahedronGeometry(radius * 0.75, 2)
    const positions = shape.attributes.position
    if (positions) {
      for (let i = 0; i < positions.count; i += 1) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)
        // Le relief dépend de la position, pas de l'index : deux sommets confondus bougent
        // ensemble, ce qui évite les fissures dans la surface.
        const bump = 1 + 0.12 * Math.sin(x * 5.1 + y * 2.3) + 0.08 * Math.sin(y * 6.7 + z * 3.1) + 0.06 * Math.sin(z * 8.3 + x * 1.9)
        positions.setXYZ(i, x * bump * 1.45, y * bump * 0.85, z * bump * 0.9) // forme allongée « cacahuète »
      }
    }
    shape.computeVertexNormals()
    return shape
  }, [radius])

  useFrame(({ clock }) => {
    if (probeRef.current) probeRef.current.rotation.z = clock.elapsedTime * 0.6
  })

  return (
    <>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#8d8579" roughness={1} flatShading />
      </mesh>
      <group ref={probeRef} rotation={[0.4, 0, 0]}>
        <group position={[radius * 1.35, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshStandardMaterial color="#d9c27a" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.02, 0.42, 0.1]} />
            <meshStandardMaterial color={WORLD_ACCENTS.elsewhere} emissive={WORLD_ACCENTS.elsewhere} emissiveIntensity={0.4} />
          </mesh>
        </group>
      </group>
    </>
  )
}
