import { Html, OrbitControls, useTexture } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { BackSide, SRGBColorSpace, type Mesh, type Object3D, type Texture } from 'three'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { latLonToVector3, meanLongitude, rotationToFaceLongitude } from '../lib/geo3d'
import { MARKER_COLORS, type MarkerLook } from './colors'
import styles from './Scene.module.css'

export interface GlobeMarker {
  slug: string
  name: string
  latitude: number
  longitude: number
  look: MarkerLook
  /** Texte annoncé par les lecteurs d'écran, ex. « Opportunity (MER), silencieux ». */
  description: string
  /** Rang de l'étiquette quand plusieurs machines sont au même endroit (voir lib/geo stackIndexes). */
  stack: number
}

interface PlanetGlobeProps {
  textureUrl: string
  accent: string
  markers: GlobeMarker[]
  onSelect: (slug: string) => void
  /** Nom accessible de la scène, ex. « Globe de Mars ». */
  label: string
}

const DEG = Math.PI / 180

/**
 * Globe 3D d'un monde (texture NASA) avec ses machines à leur vraie position.
 * On le fait tourner au doigt ou à la souris. Il tourne aussi tout seul, sauf si l'utilisateur
 * a demandé à réduire les animations.
 */
export default function PlanetGlobe({ textureUrl, accent, markers, onSelect, label }: PlanetGlobeProps) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className={styles.globeStage} role="group" aria-label={label}>
      <Canvas camera={{ position: [0, 0, 3.4], fov: 38 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        {/* Un « soleil » de côté donne du relief aux cratères. */}
        <directionalLight position={[4, 2, 5]} intensity={2.4} />
        <Suspense fallback={null}>
          <Globe textureUrl={textureUrl} accent={accent} markers={markers} onSelect={onSelect} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={5}
          rotateSpeed={0.5}
          autoRotate={!reducedMotion}
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  )
}

function Globe({ textureUrl, accent, markers, onSelect }: Omit<PlanetGlobeProps, 'label'>) {
  // useTexture suspend le rendu jusqu'au chargement de l'image (d'où le <Suspense> au-dessus).
  const texture = useTexture(textureUrl, (loaded: Texture) => {
    loaded.colorSpace = SRGBColorSpace // couleurs fidèles à l'image d'origine
  })
  const globeRef = useRef<Mesh>(null)

  // Orientation initiale calculée une seule fois : le globe s'ouvre face aux machines.
  const [initialRotation] = useState(() => {
    const latitudes = markers.map((marker) => marker.latitude)
    const meanLatitude = latitudes.length ? latitudes.reduce((a, b) => a + b, 0) / latitudes.length : 0
    return { x: meanLatitude * DEG * 0.6, y: rotationToFaceLongitude(meanLongitude(markers.map((m) => m.longitude))) }
  })

  return (
    <group rotation={[initialRotation.x, initialRotation.y, 0]}>
      <mesh ref={globeRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial map={texture} roughness={1} metalness={0} />
      </mesh>
      {/* Halo discret de la couleur du monde. */}
      <mesh scale={1.04}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color={accent} transparent opacity={0.08} side={BackSide} />
      </mesh>
      {markers.map((marker) => (
        <Marker key={marker.slug} marker={marker} globeRef={globeRef} onSelect={onSelect} />
      ))}
    </group>
  )
}

interface MarkerProps {
  marker: GlobeMarker
  globeRef: RefObject<Mesh | null>
  onSelect: (slug: string) => void
}

function Marker({ marker, globeRef, onSelect }: MarkerProps) {
  const dotRef = useRef<Mesh>(null)
  const working = marker.look === 'working'

  // Les machines en mission « respirent » ; les fantômes restent immobiles.
  useFrame(({ clock }) => {
    if (!working || !dotRef.current) return
    dotRef.current.scale.setScalar(1 + 0.35 * Math.abs(Math.sin(clock.elapsedTime * 2.5)))
  })

  const select = () => onSelect(marker.slug)
  // Variable CSS personnalisée : React exige un cast, car CSSProperties ne la connaît pas.
  const labelStyle = { '--stack': marker.stack } as CSSProperties

  return (
    <>
      <mesh
        ref={dotRef}
        position={latLonToVector3(marker.latitude, marker.longitude, 1.01)}
        onClick={select}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshBasicMaterial color={MARKER_COLORS[marker.look]} transparent opacity={working ? 1 : 0.7} />
      </mesh>
      {/* Étiquette HTML : un vrai bouton, atteignable au clavier. Cachée quand la machine passe derrière le globe. */}
      <Html
        position={latLonToVector3(marker.latitude, marker.longitude, 1.09)}
        center
        occlude={[globeRef as RefObject<Object3D>]}
        zIndexRange={[20, 0]}
      >
        <button
          type="button"
          className={working ? `${styles.markerLabel} ${styles.markerLabelWorking}` : styles.markerLabel}
          style={labelStyle}
          onClick={select}
          aria-label={marker.description}
        >
          {marker.name}
        </button>
      </Html>
    </>
  )
}
