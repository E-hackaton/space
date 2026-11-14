import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Atmosphere } from '../../components/3d/Atmosphere';
import { GLOBE_R, SURFACES, type AtlasPoint, type SurfaceBody } from '../../lib/atlas';

/** Direction du Soleil dans les scènes d'atlas (éclairage latéral). */
export const ATLAS_SUN = new THREE.Vector3(0.75, 0.35, 0.55).normalize();

const ACTIVE = '#4BE08A';
const DORMANT = '#E0A458';

/** Le globe texturé (relief de la Lune, halo de l'atmosphère martienne). */
export function Globe({ body, radius = GLOBE_R }: { body: SurfaceBody; radius?: number }) {
  const cfg = SURFACES[body];
  const map = useTexture(cfg.texture);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const bump = useTexture(cfg.bump ?? cfg.texture);
  return (
    <group>
      <mesh receiveShadow>
        <sphereGeometry args={[radius, 160, 120]} />
        <meshStandardMaterial map={map} bumpMap={cfg.bump ? bump : undefined} bumpScale={cfg.bump ? 0.05 : 0} roughness={1} metalness={0} />
      </mesh>
      {cfg.atmosphere ? (
        <Atmosphere radius={radius} color={cfg.atmosphere} sunDir={ATLAS_SUN} scale={1.045} power={3} intensity={0.8} />
      ) : (
        <Atmosphere radius={radius} color="#cdd6ff" sunDir={ATLAS_SUN} scale={1.02} power={4} intensity={0.35} />
      )}
    </group>
  );
}

/** Repère local d'un point de la surface : la machine s'y tient debout. */
export function surfaceQuaternion(dir: THREE.Vector3, yaw = 0) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw));
}

interface MarkerProps {
  point: AtlasPoint;
  radius?: number;
  selected?: boolean;
  discovered?: boolean;
  /** Étiquette HTML visible (elle se cache d'elle-même sur la face cachée du globe). */
  label?: boolean;
  scale?: number;
  onSelect?: (id: string) => void;
  animate: boolean;
}

/**
 * Balise d'un objet oublié : anneau au sol, colonne de lumière, étiquette.
 * Actif : vert qui pulse. Endormi : ambre fixe. Toujours accompagné d'un texte.
 */
export function Marker({ point, radius = GLOBE_R, selected, discovered, label = true, scale = 1, onSelect, animate }: MarkerProps) {
  const active = point.machine.status === 'active';
  const color = active ? ACTIVE : DORMANT;
  const ring = useRef<THREE.Mesh>(null!);
  const beam = useRef<THREE.Mesh>(null!);
  const tag = useRef<HTMLButtonElement>(null);
  const group = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const q = useMemo(() => surfaceQuaternion(point.shown), [point.shown]);
  const world = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const toCam = useMemo(() => new THREE.Vector3(), []);
  const phase = useMemo(() => Math.random() * 6, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    const pulse = active && animate ? 0.5 + 0.5 * Math.sin(t * 3) : 0.7;
    ring.current.scale.setScalar((selected ? 1.6 : 1) * (1 + (active && animate ? (t * 0.8) % 1 : 0) * 0.8));
    (ring.current.material as THREE.MeshBasicMaterial).opacity = active && animate ? 0.9 * (1 - ((t * 0.8) % 1)) : 0.8;
    (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + 0.25 * pulse + (selected ? 0.3 : 0);
    // Étiquette : visible seulement sur la face tournée vers la caméra.
    if (tag.current) {
      group.current.getWorldPosition(world);
      normal.copy(world).normalize();
      toCam.copy(camera.position).sub(world).normalize();
      const facing = normal.dot(toCam);
      tag.current.style.opacity = facing > 0.15 ? String(Math.min(1, (facing - 0.15) * 4)) : '0';
      tag.current.style.pointerEvents = facing > 0.3 ? 'auto' : 'none';
    }
  });

  return (
    <group ref={group} position={point.shown.clone().multiplyScalar(radius)} quaternion={q} scale={scale}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.1, 0.13, 40]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={beam} position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.012, 0.03, 0.7, 10, 1, true]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0.72, 0]} onClick={(e) => (e.stopPropagation(), onSelect?.(point.machine.id))}>
        <sphereGeometry args={[selected ? 0.07 : 0.05, 16, 12]} />
        <meshBasicMaterial color={selected ? '#ffffff' : color} toneMapped={false} />
      </mesh>
      {label && (
        <Html position={[0, 0.82, 0]} center zIndexRange={[30, 0]}>
          <button
            ref={tag}
            type="button"
            tabIndex={-1}
            onClick={() => onSelect?.(point.machine.id)}
            className={`atlas-tag ${active ? 'atlas-tag-active' : 'atlas-tag-dormant'} ${selected ? 'atlas-tag-selected' : ''}`}
          >
            <span aria-hidden="true">{active ? '●' : '◐'}</span> {point.machine.name}
            {discovered && <span aria-hidden="true"> ✓</span>}
          </button>
        </Html>
      )}
    </group>
  );
}

/** Ciel de l'atlas : étoiles et soleil latéral. */
export function AtlasLights({ body }: { body: SurfaceBody }) {
  return (
    <>
      <ambientLight intensity={0.12} color={SURFACES[body].sky} />
      <hemisphereLight args={[SURFACES[body].sky, '#000000', 0.15]} />
      <directionalLight position={ATLAS_SUN.clone().multiplyScalar(60)} intensity={2.6} color="#fff4e2" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-near={30} shadow-camera-far={90} shadow-bias={-0.0005} />
    </>
  );
}

export function Spin({ on, speed = 0.03, children }: { on: boolean; speed?: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (on) g.current.rotation.y += dt * speed;
  });
  return <group ref={g}>{children}</group>;
}
