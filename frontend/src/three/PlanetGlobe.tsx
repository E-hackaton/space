import { Html, OrbitControls, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { BackSide, SRGBColorSpace, Vector3, type Group, type Mesh, type Object3D, type Texture } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { latLonToVector3, meanLongitude, rotationToFaceLongitude } from '../lib/geo3d'
import { MARKER_COLORS, type MarkerLook } from './colors'
import { SankofaModel } from './SankofaModel'
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

export interface GlobeTexts {
  /** Nom accessible de la scène, ex. « Globe de Mars ». */
  label: string
  /** Pendant l'arrivée cinématique, ex. « Approche de Mars… ». */
  approaching: string
  skip: string
  /** Bulle de Sankofa pendant son vol, ex. « Je t'emmène voir Opportunity ! ». */
  flyingTo: (name: string) => string
}

interface PlanetGlobeProps {
  textureUrl: string
  accent: string
  markers: GlobeMarker[]
  /** Appelé quand Sankofa est arrivé devant la machine choisie. */
  onArrive: (slug: string) => void
  texts: GlobeTexts
}

const DEG = Math.PI / 180
const CAMERA_DISTANCE = 3.4
/** Durée de l'arrivée cinématique et du vol de Sankofa, en secondes. */
const ARRIVAL_DURATION = 3
const FLIGHT_DURATION = 1.8
/** Altitude de vol de Sankofa au-dessus de la surface (le globe a un rayon de 1). */
const GUIDE_ALTITUDE = 1.32
/** Position de repos de Sankofa : en vol stationnaire, en haut à gauche du globe. */
const IDLE_POSITION = new Vector3(-0.75, 0.75, 0.95).normalize().multiplyScalar(GUIDE_ALTITUDE)
const UP = new Vector3(0, 1, 0)

/** Accélère puis ralentit en douceur (courbe « ease in-out »). */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Globe 3D d'un monde (texture NASA) avec ses machines à leur vraie position.
 * - À l'arrivée, la caméra plonge vers la planète (séquence cinématique, passable).
 * - Quand on choisit une machine, Sankofa vole jusqu'à elle, la caméra le suit, puis la présentation commence.
 */
export default function PlanetGlobe({ textureUrl, accent, markers, onArrive, texts }: PlanetGlobeProps) {
  const reducedMotion = usePrefersReducedMotion()
  // Sans animation, on saute directement à la fin de l'arrivée.
  const [arriving, setArriving] = useState(!reducedMotion)

  return (
    <div className={styles.globeStage} role="group" aria-label={texts.label}>
      <Canvas camera={{ position: [0, 0, arriving ? 12 : CAMERA_DISTANCE], fov: 38 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        {/* Un « soleil » de côté donne du relief aux cratères. */}
        <directionalLight position={[4, 2, 5]} intensity={2.4} />
        <Suspense fallback={null}>
          <Scene
            textureUrl={textureUrl}
            accent={accent}
            markers={markers}
            onArrive={onArrive}
            texts={texts}
            arriving={arriving}
            onArrivalDone={() => setArriving(false)}
          />
        </Suspense>
      </Canvas>

      {arriving && (
        <div className={styles.arrivalOverlay}>
          <p aria-live="polite">{texts.approaching}</p>
          <button type="button" onClick={() => setArriving(false)}>
            {texts.skip}
          </button>
        </div>
      )}
    </div>
  )
}

interface SceneProps extends PlanetGlobeProps {
  arriving: boolean
  onArrivalDone: () => void
}

interface Flight {
  slug: string
  name: string
  start: Vector3
  end: Vector3
  cameraStart: Vector3
  cameraEnd: Vector3
  elapsed: number
}

function Scene({ textureUrl, accent, markers, onArrive, texts, arriving, onArrivalDone }: SceneProps) {
  // useTexture suspend le rendu jusqu'au chargement de l'image (d'où le <Suspense> au-dessus).
  const texture = useTexture(textureUrl, (loaded: Texture) => {
    loaded.colorSpace = SRGBColorSpace // couleurs fidèles à l'image d'origine
  })
  const { camera } = useThree()
  const globeRef = useRef<Mesh>(null)
  const groupRef = useRef<Group>(null)
  const guideRef = useRef<Group>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const arrivalTime = useRef(0)
  const flight = useRef<Flight | null>(null)
  const [flyingTo, setFlyingTo] = useState<string | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  // Orientation initiale calculée une seule fois : le globe s'ouvre face aux machines.
  const [initialRotation] = useState(() => {
    const latitudes = markers.map((marker) => marker.latitude)
    const meanLatitude = latitudes.length ? latitudes.reduce((a, b) => a + b, 0) / latitudes.length : 0
    return { x: meanLatitude * DEG * 0.6, y: rotationToFaceLongitude(meanLongitude(markers.map((m) => m.longitude))) }
  })

  function startFlight(marker: GlobeMarker) {
    const group = groupRef.current
    const guide = guideRef.current
    if (!group || !guide || flight.current) return
    if (reducedMotion) {
      onArrive(marker.slug)
      return
    }
    // Position de la machine dans la scène (le globe a été tourné : on passe en coordonnées monde).
    const target = group.localToWorld(new Vector3(...latLonToVector3(marker.latitude, marker.longitude, 1)))
    flight.current = {
      slug: marker.slug,
      name: marker.name,
      start: guide.position.clone(),
      end: target.clone().normalize().multiplyScalar(1.12), // Sankofa s'arrête juste au-dessus de la machine
      cameraStart: camera.position.clone(),
      cameraEnd: target.clone().normalize().multiplyScalar(2.4), // la caméra se place face à la machine
      elapsed: 0,
    }
    setFlyingTo(marker.name)
  }

  useFrame(({ clock }, delta) => {
    const guide = guideRef.current

    // 1. Arrivée cinématique : la caméra plonge vers la planète pendant que le globe tourne.
    if (arriving) {
      arrivalTime.current += delta
      const t = ease(Math.min(1, arrivalTime.current / ARRIVAL_DURATION))
      const distance = 12 + (CAMERA_DISTANCE - 12) * t
      camera.position.set(Math.sin((1 - t) * 0.8) * distance, (1 - t) * 1.5, Math.cos((1 - t) * 0.8) * distance)
      camera.lookAt(0, 0, 0)
      if (t >= 1) onArrivalDone()
    }

    // 2. Vol de Sankofa vers la machine choisie, en arc au-dessus de la surface.
    const current = flight.current
    if (current && guide) {
      current.elapsed += delta
      const t = Math.min(1, current.elapsed / FLIGHT_DURATION)
      const k = ease(t)
      // Interpolation de la direction puis remise à la bonne altitude : le trajet suit la courbure du globe.
      const direction = current.start.clone().normalize().lerp(current.end.clone().normalize(), k).normalize()
      const altitude = current.start.length() + (current.end.length() - current.start.length()) * k + Math.sin(Math.PI * k) * 0.25
      guide.position.copy(direction.multiplyScalar(altitude))
      // La caméra suit, en tournant autour du globe.
      const cameraDirection = current.cameraStart.clone().normalize().lerp(current.cameraEnd.clone().normalize(), k).normalize()
      const cameraDistance = current.cameraStart.length() + (current.cameraEnd.length() - current.cameraStart.length()) * k
      camera.position.copy(cameraDirection.multiplyScalar(cameraDistance))
      camera.lookAt(0, 0, 0)
      if (t >= 1) {
        flight.current = null
        onArrive(current.slug)
      }
    } else if (guide && !arriving) {
      // Au repos, Sankofa flotte doucement près de la planète.
      guide.position.copy(IDLE_POSITION).addScaledVector(UP, Math.sin(clock.elapsedTime * 1.6) * 0.03)
    }

    // Sankofa regarde toujours vers la caméra.
    guide?.lookAt(camera.position)
  })

  const busy = arriving || flyingTo !== null

  return (
    <>
      <group ref={groupRef} rotation={[initialRotation.x, initialRotation.y, 0]}>
        <mesh ref={globeRef}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial map={texture} roughness={1} metalness={0} />
        </mesh>
        {/* Halo discret de la couleur du monde. */}
        <mesh scale={1.04}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshBasicMaterial color={accent} transparent opacity={0.08} side={BackSide} />
        </mesh>
        {!arriving &&
          markers.map((marker) => (
            <Marker key={marker.slug} marker={marker} globeRef={globeRef} onSelect={() => startFlight(marker)} disabled={busy} />
          ))}
      </group>

      <group ref={guideRef} position={IDLE_POSITION} scale={0.14}>
        <SankofaModel speaking={flyingTo !== null} />
        {flyingTo && (
          <Html center position={[0, 2.4, 0]} zIndexRange={[30, 20]}>
            <p className={styles.guideBubble} aria-live="polite">
              {texts.flyingTo(flyingTo)}
            </p>
          </Html>
        )}
      </group>

      <OrbitControls
        ref={controlsRef}
        enabled={!busy}
        enablePan={false}
        minDistance={2}
        maxDistance={5}
        rotateSpeed={0.5}
        autoRotate={!reducedMotion && !busy}
        autoRotateSpeed={0.3}
      />
    </>
  )
}

interface MarkerProps {
  marker: GlobeMarker
  globeRef: RefObject<Mesh | null>
  onSelect: () => void
  disabled: boolean
}

function Marker({ marker, globeRef, onSelect, disabled }: MarkerProps) {
  const dotRef = useRef<Mesh>(null)
  const working = marker.look === 'working'

  // Les machines en mission « respirent » ; les fantômes restent immobiles.
  useFrame(({ clock }) => {
    if (!working || !dotRef.current) return
    dotRef.current.scale.setScalar(1 + 0.35 * Math.abs(Math.sin(clock.elapsedTime * 2.5)))
  })

  // Variable CSS personnalisée : React exige un cast, car CSSProperties ne la connaît pas.
  const labelStyle = { '--stack': marker.stack } as CSSProperties

  return (
    <>
      <mesh
        ref={dotRef}
        position={latLonToVector3(marker.latitude, marker.longitude, 1.01)}
        onClick={disabled ? undefined : onSelect}
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
          onClick={onSelect}
          disabled={disabled}
          aria-label={marker.description}
        >
          {marker.name}
        </button>
      </Html>
    </>
  )
}
