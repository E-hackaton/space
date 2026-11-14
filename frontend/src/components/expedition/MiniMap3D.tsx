import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { TerrainMesh } from '../../world/TerrainMesh';
import { PALETTES } from '../../world/toon';
import { player } from '../../world/Player';
import { expeditionField, EXPEDITION_HALF, type Site } from '../../world/expeditionLayout';
import type { SurfaceBody } from '../../lib/atlas';
import { Icon } from '../ui/Glyphs';

/** Caméra de la minicarte : plongée qui suit le véhicule et tourne avec lui (comme dans un jeu de course). */
function MapCamera({ big }: { big: boolean }) {
  const look = useRef(new THREE.Vector3());
  useFrame(({ camera }, dt) => {
    const want = new THREE.Vector3();
    const target = new THREE.Vector3();
    if (big) {
      want.set(0, EXPEDITION_HALF * 1.45, EXPEDITION_HALF * 0.95);
      target.set(0, 0, -EXPEDITION_HALF * 0.05);
    } else {
      const fx = -Math.sin(player.heading);
      const fz = -Math.cos(player.heading);
      want.set(player.x - fx * 70, 150, player.z - fz * 70);
      target.set(player.x + fx * 40, 0, player.z + fz * 40);
    }
    const k = 1 - Math.exp(-dt * 4);
    camera.position.lerp(want, k);
    look.current.lerp(target, k);
    camera.lookAt(look.current);
  });
  return null;
}

/** Flèche du joueur et ligne vers la cible. */
function PlayerMarker({ field, target }: { field: ReturnType<typeof expeditionField>; target?: Site }) {
  const arrow = useRef<THREE.Group>(null!);
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    return new THREE.Line(g, new THREE.LineDashedMaterial({ color: '#4BE08A', dashSize: 6, gapSize: 4, depthTest: false, transparent: true }));
  }, []);
  useFrame(({ clock }) => {
    const y = field.heightAt(player.x, player.z) + 6;
    arrow.current.position.set(player.x, y, player.z);
    arrow.current.rotation.y = player.heading;
    arrow.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 5) * 0.08);
    line.visible = !!target;
    if (target) {
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, player.x, y, player.z);
      pos.setXYZ(1, target.x, field.heightAt(target.x, target.z) + 6, target.z);
      pos.needsUpdate = true;
      line.computeLineDistances();
    }
  });
  return (
    <>
      <primitive object={line} />
      <group ref={arrow}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={10}>
          <coneGeometry args={[7, 16, 3]} />
          <meshBasicMaterial color="#5fd2ff" depthTest={false} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}

interface Props {
  body: SurfaceBody;
  sites: Site[];
  target: string | null;
  found: string[];
  onPick: (id: string) => void;
}

/** Minicarte 3D de l'expédition, ronde ; agrandie, elle montre tout le terrain. */
export function MiniMap3D({ body, sites, target, found, onPick }: Props) {
  const { t } = useTranslation();
  const [big, setBig] = useState(false);
  const field = useMemo(() => expeditionField(body, sites), [body, sites]);
  const pal = PALETTES[body];
  const tgt = sites.find((s) => s.machine.id === target);
  return (
    <div className={big ? 'minimap minimap-big' : 'minimap'}>
      <Canvas dpr={1} camera={{ fov: 38, near: 1, far: 2000, position: [0, 300, 200] }} gl={{ antialias: true }} aria-hidden="true">
        <color attach="background" args={[body === 'moon' ? '#0b0d14' : '#3a1a10']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[200, 300, 120]} intensity={2} />
        <TerrainMesh field={field} colors={pal.ground} segments={90} />
        {sites.map((s) => {
          const y = field.heightAt(s.x, s.z);
          const active = s.machine.status === 'active';
          const sel = s.machine.id === target;
          const color = sel ? '#ffffff' : active ? '#4BE08A' : '#E0A458';
          return (
            <group
              key={s.machine.id}
              position={[s.x, y, s.z]}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                onPick(s.machine.id);
              }}
            >
              <mesh position={[0, 14, 0]}>
                <cylinderGeometry args={[sel ? 2.4 : 1.6, sel ? 2.4 : 1.6, 28, 12]} />
                <meshBasicMaterial color={color} toneMapped={false} transparent opacity={found.includes(s.machine.id) ? 0.45 : 1} />
              </mesh>
              <mesh position={[0, 30, 0]}>
                <sphereGeometry args={[sel ? 6 : 4.5, 16, 12]} />
                <meshBasicMaterial color={color} toneMapped={false} />
              </mesh>
            </group>
          );
        })}
        <PlayerMarker field={field} target={tgt} />
        <MapCamera big={big} />
      </Canvas>
      <button type="button" className="minimap-toggle" onClick={() => setBig(!big)} aria-pressed={big}>
        <Icon name="map" size={16} />
        <span className="sr-only">{t('expedition.mapSize')}</span>
      </button>
      {/* Version accessible : la liste des objets, au clavier */}
      <ul className="sr-only">
        {sites.map((s) => (
          <li key={s.machine.id}>
            <button type="button" onClick={() => onPick(s.machine.id)}>
              {s.machine.name}
              {found.includes(s.machine.id) ? ` · ${t('expedition.found')}` : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
