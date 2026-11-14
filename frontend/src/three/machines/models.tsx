/**
 * Modèles 3D low-poly des machines, construits en code à partir de formes simples.
 *
 * Pourquoi en code et pas des fichiers GLB : c'est léger sur mobile, sans aucun logo NASA, et chaque
 * pièce est nommée (<Part focus="…">), ce dont la visite guidée a besoin pour cadrer et éclairer.
 * Les proportions sont simplifiées : on cherche à reconnaître la machine, pas à la reproduire à l'identique.
 *
 * Convention : le sol est en y = 0, la machine est centrée sur l'origine et mesure environ 2 unités.
 */

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { DoubleSide, type Group } from 'three'

import type { EquipmentKind } from '../../types/api'
import { Mat, Part, Strut } from './MachineParts'

const TAU = Math.PI * 2

/** Choisit le modèle selon le type d'engin, et la variante selon la machine précise. */
export function MachineModel({ kind, slug }: { kind: EquipmentKind; slug: string }) {
  switch (kind) {
    case 'rover':
      return <Rover variant={roverVariant(slug)} />
    case 'lander':
      return <Lander variant={slug === 'insight' ? 'insight' : slug.startsWith('surveyor') ? 'surveyor' : 'viking'} />
    case 'descent_stage':
      return <DescentStage />
    case 'helicopter':
      return <Helicopter />
    case 'instrument':
      return <Reflector />
    case 'orbiter':
    case 'probe':
    case 'telescope':
      return <Probe variant={slug.startsWith('pioneer') ? 'pioneer' : 'near'} />
  }
}

// --- Rover (rover lunaire, Sojourner, Opportunity, Curiosity, Perseverance) ----

/**
 * - lunar : rover lunaire d'Apollo (4 roues, sièges, pas de bras)
 * - mer : Opportunity et Spirit (grand pont de panneaux solaires)
 * - msl : Curiosity et Perseverance (pas de panneaux, source nucléaire à l'arrière)
 * - sojourner : le tout petit premier rover (environ 60 cm de long)
 */
type RoverVariant = 'lunar' | 'mer' | 'msl' | 'sojourner'

function roverVariant(slug: string): RoverVariant {
  if (slug.includes('lrv')) return 'lunar'
  if (slug === 'curiosity' || slug === 'perseverance') return 'msl'
  if (slug === 'sojourner') return 'sojourner'
  return 'mer'
}

function Rover({ variant }: { variant: RoverVariant }) {
  // Sojourner est la même architecture en miniature : on réduit tout le modèle.
  const scale = variant === 'sojourner' ? 0.55 : 1
  return (
    <group scale={scale}>
      <RoverBody variant={variant} />
      {variant === 'msl' && (
        <Part focus="power">
          {/* Le générateur nucléaire (RTG), à l'arrière : il fournit l'énergie jour et nuit. */}
          <mesh position={[-0.62, 0.8, 0]} rotation={[0, 0, 0.9]}>
            <cylinderGeometry args={[0.12, 0.12, 0.38, 12]} />
            <Mat kind="dark" />
          </mesh>
        </Part>
      )}
    </group>
  )
}

function RoverBody({ variant }: { variant: RoverVariant }) {
  const lunar = variant === 'lunar'
  const hasSolarDeck = variant === 'mer' || variant === 'sojourner'
  // Les rovers martiens ont 6 roues ; le rover lunaire d'Apollo en a 4, plus grandes.
  const wheelX = lunar ? [-0.6, 0.6] : [-0.55, 0, 0.55]
  const wheelRadius = lunar ? 0.24 : variant === 'msl' ? 0.2 : 0.17

  return (
    <group>
      <Part focus="body">
        <mesh position={[0, lunar ? 0.45 : 0.62, 0]}>
          <boxGeometry args={lunar ? [1.5, 0.08, 0.8] : [1.0, 0.32, 0.7]} />
          <Mat kind={lunar ? 'dark' : 'hull'} />
        </mesh>
        {lunar && (
          // Deux sièges pour les astronautes.
          <>
            <mesh position={[-0.1, 0.58, 0.2]}>
              <boxGeometry args={[0.32, 0.2, 0.3]} />
              <Mat kind="hull" />
            </mesh>
            <mesh position={[-0.1, 0.58, -0.2]}>
              <boxGeometry args={[0.32, 0.2, 0.3]} />
              <Mat kind="hull" />
            </mesh>
          </>
        )}
      </Part>

      <Part focus="wheels">
        {wheelX.flatMap((x) =>
          [-1, 1].map((side) => (
            <mesh key={`${x}-${side}`} position={[x, wheelRadius, side * (lunar ? 0.52 : 0.47)]} rotation={[TAU / 4, 0, 0]}>
              <cylinderGeometry args={[wheelRadius, wheelRadius, lunar ? 0.16 : 0.12, 20]} />
              <Mat kind="tire" />
            </mesh>
          )),
        )}
      </Part>

      {hasSolarDeck && (
        <Part focus="panels">
          {/* Le grand pont de panneaux solaires, en forme d'aile. */}
          <mesh position={[0, 0.82, 0]}>
            <boxGeometry args={variant === 'sojourner' ? [1.1, 0.04, 0.8] : [1.8, 0.04, 1.25]} />
            <Mat kind="solar" />
          </mesh>
        </Part>
      )}

      <Part focus="mast">
        <mesh position={[lunar ? 0.7 : 0.35, lunar ? 0.75 : 1.15, lunar ? 0 : 0.3]}>
          <cylinderGeometry args={[0.03, 0.03, lunar ? 0.5 : 0.6, 8]} />
          <Mat kind="hull" />
        </mesh>
        <mesh position={[lunar ? 0.72 : 0.35, lunar ? 1.02 : 1.48, lunar ? 0 : 0.3]}>
          <boxGeometry args={[0.24, 0.1, 0.14]} />
          <Mat kind="dark" />
        </mesh>
      </Part>

      {!lunar && (
        <Part focus="arm">
          {/* Le bras robotique replié à l'avant, avec ses instruments au bout. */}
          <mesh position={[0.62, 0.48, 0]} rotation={[0, 0, -0.6]}>
            <boxGeometry args={[0.35, 0.05, 0.05]} />
            <Mat kind="hull" />
          </mesh>
          <mesh position={[0.78, 0.3, 0]}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <Mat kind="gold" />
          </mesh>
        </Part>
      )}

      <Part focus="antenna">
        <mesh position={[lunar ? -0.5 : -0.3, lunar ? 1.0 : 1.05, lunar ? 0 : -0.3]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[lunar ? 0.28 : 0.1, 0.02, 0.06, 16]} />
          <Mat kind="hull" />
        </mesh>
      </Part>
    </group>
  )
}

// --- Atterrisseur (Viking, InSight, Surveyor) ---------------------------------

function Lander({ variant }: { variant: 'viking' | 'insight' | 'surveyor' }) {
  const legAngles = [0, 1, 2].map((i) => (i * TAU) / 3)

  return (
    <group>
      <Part focus="body">
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.28, 6]} />
          <Mat kind={variant === 'surveyor' ? 'hull' : 'gold'} />
        </mesh>
      </Part>

      <Part focus="legs">
        {legAngles.map((angle) => (
          <group key={angle} rotation={[0, angle, 0]}>
            <mesh position={[0.62, 0.32, 0]} rotation={[0, 0, 0.55]}>
              <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
              <Mat kind="hull" />
            </mesh>
            <mesh position={[0.8, 0.03, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
              <Mat kind="dark" />
            </mesh>
          </group>
        ))}
      </Part>

      {variant === 'insight' && (
        <Part focus="panels">
          {/* Les deux grands panneaux solaires ronds d'InSight. */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 1.05, 0.72, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.03, 10]} />
              <Mat kind="solar" />
            </mesh>
          ))}
        </Part>
      )}

      <Part focus="mast">
        <mesh position={[0, variant === 'surveyor' ? 1.2 : 1.05, 0.2]}>
          <cylinderGeometry args={[0.03, 0.03, variant === 'surveyor' ? 1.0 : 0.55, 8]} />
          <Mat kind="hull" />
        </mesh>
        <mesh position={[0, variant === 'surveyor' ? 1.72 : 1.36, 0.2]}>
          <boxGeometry args={[0.18, 0.14, 0.14]} />
          <Mat kind="dark" />
        </mesh>
        {variant === 'surveyor' && (
          // Le panneau solaire de Surveyor, au sommet de son mât.
          <mesh position={[0, 1.6, -0.15]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.7, 0.03, 0.5]} />
            <Mat kind="solar" />
          </mesh>
        )}
      </Part>

      <Part focus="arm">
        <mesh position={[0.55, 0.85, 0.35]} rotation={[0, -0.5, -0.4]}>
          <boxGeometry args={[0.6, 0.05, 0.05]} />
          <Mat kind="hull" />
        </mesh>
        <mesh position={[0.85, 0.7, 0.55]}>
          <boxGeometry args={[0.12, 0.08, 0.12]} />
          <Mat kind="gold" />
        </mesh>
      </Part>

      <Part focus="antenna">
        <mesh position={[-0.35, 1.0, -0.25]} rotation={[0.5, 0, 0.3]}>
          <cylinderGeometry args={[0.24, 0.02, 0.06, 16]} />
          <Mat kind="hull" />
        </mesh>
      </Part>
    </group>
  )
}

// --- Étage de descente d'Apollo (Eagle) ---------------------------------------

function DescentStage() {
  const legAngles = [0, 1, 2, 3].map((i) => (i * TAU) / 4 + TAU / 8)

  return (
    <group>
      <Part focus="body">
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.65, 0.65, 0.55, 8]} />
          <Mat kind="gold" />
        </mesh>
        {/* L'échelle, sur un des pieds : celle qu'a descendue Neil Armstrong. */}
        <mesh position={[0.82, 0.45, 0]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.04, 0.8, 0.22]} />
          <Mat kind="hull" />
        </mesh>
      </Part>

      <Part focus="legs">
        {legAngles.map((angle) => (
          <group key={angle} rotation={[0, angle, 0]}>
            <mesh position={[0.75, 0.42, 0]} rotation={[0, 0, 0.6]}>
              <cylinderGeometry args={[0.035, 0.035, 0.85, 8]} />
              <Mat kind="hull" />
            </mesh>
            <mesh position={[1.0, 0.03, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.05, 16]} />
              <Mat kind="hull" />
            </mesh>
          </group>
        ))}
      </Part>

      <Part focus="engine">
        <mesh position={[0, 0.42, 0]}>
          <coneGeometry args={[0.24, 0.35, 16, 1, true]} />
          <Mat kind="dark" />
        </mesh>
      </Part>
    </group>
  )
}

// --- Hélicoptère (Ingenuity) --------------------------------------------------

function Helicopter() {
  const upperRef = useRef<Group>(null)
  const lowerRef = useRef<Group>(null)

  // Les deux rotors tournent en sens inverse, comme sur le vrai Ingenuity.
  useFrame((_, delta) => {
    if (upperRef.current) upperRef.current.rotation.y += delta * 6
    if (lowerRef.current) lowerRef.current.rotation.y -= delta * 6
  })

  return (
    <group>
      <Part focus="body">
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.32, 0.26, 0.32]} />
          <Mat kind="gold" />
        </mesh>
      </Part>

      <Part focus="legs">
        {/* Quatre pieds fins, des coins du corps jusqu'au sol, écartés vers l'extérieur. */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * TAU) / 4 + TAU / 8
          const corner: [number, number, number] = [Math.cos(angle) * 0.14, 0.4, Math.sin(angle) * 0.14]
          const foot: [number, number, number] = [Math.cos(angle) * 0.42, 0.01, Math.sin(angle) * 0.42]
          return <Strut key={i} from={corner} to={foot} radius={0.012} />
        })}
      </Part>

      <Part focus="rotor">
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
          <Mat kind="hull" />
        </mesh>
        <group ref={lowerRef} position={[0, 0.82, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.015, 0.09]} />
            <Mat kind="dark" />
          </mesh>
        </group>
        <group ref={upperRef} position={[0, 0.98, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.015, 0.09]} />
            <Mat kind="dark" />
          </mesh>
        </group>
      </Part>

      <Part focus="panels">
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[0.36, 0.02, 0.24]} />
          <Mat kind="solar" />
        </mesh>
      </Part>
    </group>
  )
}

// --- Réflecteur laser (Apollo 15) ---------------------------------------------

function Reflector() {
  // Une grille de « coins de cube » (300 sur le vrai, 60 ici pour rester lisible).
  const cubes = Array.from({ length: 60 }, (_, i) => [((i % 10) - 4.5) * 0.11, (Math.floor(i / 10) - 2.5) * 0.11] as const)

  return (
    <group>
      <Part focus="body">
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.45, 0.22, 0]} rotation={[0, 0, side * -0.2]}>
            <boxGeometry args={[0.05, 0.45, 0.05]} />
            <Mat kind="hull" />
          </mesh>
        ))}
      </Part>
      <Part focus="mirror" position={[0, 0.55, 0]} rotation={[-0.45, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.72, 0.06]} />
          <Mat kind="hull" />
        </mesh>
        {cubes.map(([x, y]) => (
          <mesh key={`${x}-${y}`} position={[x, y, 0.04]}>
            <boxGeometry args={[0.09, 0.09, 0.03]} />
            <Mat kind="glass" />
          </mesh>
        ))}
      </Part>
    </group>
  )
}

// --- Sonde (NEAR Shoemaker, Pioneer 10) ----------------------------------------

function Probe({ variant }: { variant: 'near' | 'pioneer' }) {
  const pioneer = variant === 'pioneer'

  return (
    <group position={[0, 0.9, 0]}>
      <Part focus="body">
        <mesh>
          <cylinderGeometry args={[0.35, 0.35, 0.4, pioneer ? 6 : 8]} />
          <Mat kind={pioneer ? 'hull' : 'gold'} />
        </mesh>
      </Part>

      <Part focus="antenna">
        {/* La grande parabole qui parle avec la Terre. */}
        <mesh position={[0, pioneer ? 0.32 : 0.3, 0]}>
          <cylinderGeometry args={[pioneer ? 0.95 : 0.5, 0.08, 0.18, 24, 1, true]} />
          <meshStandardMaterial color="#e6e8ee" roughness={0.5} metalness={0.3} side={DoubleSide} />
        </mesh>
      </Part>

      <Part focus={pioneer ? 'power' : 'panels'}>
        {pioneer
          ? // Pioneer n'a pas de panneaux : ses générateurs nucléaires (RTG) sont au bout de longs bras.
            [0, 1].map((i) => (
              <group key={i} rotation={[0, (i * TAU) / 2 + 0.6, 0]}>
                <mesh position={[0.7, -0.05, 0]} rotation={[0, 0, TAU / 4]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
                  <Mat kind="hull" />
                </mesh>
                <mesh position={[1.12, -0.05, 0]} rotation={[0, 0, TAU / 4]}>
                  <cylinderGeometry args={[0.07, 0.07, 0.25, 12]} />
                  <Mat kind="dark" />
                </mesh>
              </group>
            ))
          : // NEAR Shoemaker : quatre panneaux solaires en croix.
            [0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[Math.cos((i * TAU) / 4) * 0.8, -0.1, Math.sin((i * TAU) / 4) * 0.8]} rotation={[0, -(i * TAU) / 4, 0]}>
                <boxGeometry args={[0.8, 0.03, 0.4]} />
                <Mat kind="solar" />
              </mesh>
            ))}
      </Part>
    </group>
  )
}
