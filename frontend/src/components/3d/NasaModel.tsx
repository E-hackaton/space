import { Suspense, useMemo, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import modelsData from '../../content/models.json';

export interface Annotation {
  key: string;
  /** Fractions de la boîte englobante : [x gauche→droite, y bas→haut, z arrière→avant]. */
  at: [number, number, number];
  /** Si vrai, `at` est dans le repère normalisé : centré, rayon de la sphère englobante = 1. */
  norm?: boolean;
}
export interface ModelInfo {
  file: string;
  /** Plus grande dimension visée (mètres, ordre de grandeur pour la mise en scène). */
  size: number;
  source: string;
  annotations: Annotation[];
  /** Masque les pièces au-dessus de cette fraction de hauteur (ex. l'étage de remontée d'Apollo, reparti de la Lune). */
  hideAbove?: number;
  /** Nom (motif) des pièces qui tournent, ex. les rotors d'Ingenuity. */
  spin?: string;
}

export type ModelId = Exclude<keyof typeof modelsData, '_note'>;
export const MODELS = modelsData as unknown as Record<ModelId, ModelInfo>;

/** Charge un modèle NASA, le centre, le pose au sol et le met à l'échelle demandée. */
function useNormalized(id: ModelId, scale: number) {
  const info = MODELS[id];
  const { scene } = useGLTF(info.file);
  return useMemo(() => {
    const root = scene.clone(true);
    root.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(root);
    if (info.hideAbove !== undefined) {
      const cut = box.min.y + (box.max.y - box.min.y) * info.hideAbove;
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const b = new THREE.Box3().setFromObject(m);
        if ((b.min.y + b.max.y) / 2 > cut) m.visible = false;
      });
      box = new THREE.Box3();
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && m.visible) box.expandByObject(m);
      });
    }
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const k = (info.size * scale) / Math.max(size.x, size.y, size.z);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        const s = mat as THREE.MeshStandardMaterial;
        // Matériaux NASA parfois très sombres ou très métalliques : on les adoucit pour l'éclairage de la scène.
        if (s.isMeshStandardMaterial) {
          s.metalness = Math.min(s.metalness, 0.6);
          s.roughness = Math.max(s.roughness, 0.35);
          s.envMapIntensity = 1;
        }
      }
    });
    const scaledBox = { min: box.min.clone().sub(center).multiplyScalar(k), max: box.max.clone().sub(center).multiplyScalar(k) };
    const lift = -scaledBox.min.y;
    const spinners: THREE.Object3D[] = [];
    if (info.spin) {
      const re = new RegExp(info.spin, 'i');
      root.traverse((o) => {
        if (re.test(o.name) && !(o.parent && re.test(o.parent.name))) spinners.push(o);
      });
    }
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
    return { root, k, center, lift, scaledBox, spinners, radius };
  }, [scene, info, scale]);
}

/** Position 3D (repère du modèle normalisé) d'une ancre d'annotation. */
function anchorPosition(box: { min: THREE.Vector3; max: THREE.Vector3 }, lift: number, at: [number, number, number]) {
  return new THREE.Vector3(
    THREE.MathUtils.lerp(box.min.x, box.max.x, at[0]),
    THREE.MathUtils.lerp(box.min.y, box.max.y, at[1]) + lift,
    THREE.MathUtils.lerp(box.min.z, box.max.z, at[2]),
  );
}

/** Mise en avant d'une légende : la pièce expliquée ressort (`active`), les autres s'effacent (`dim`). */
export type CalloutFocus = 'normal' | 'active' | 'dim';

export function calloutFocus(label: string, focusPart: string | null | undefined): CalloutFocus {
  if (!focusPart) return 'normal';
  return label === focusPart ? 'active' : 'dim';
}

/**
 * Légende d'une pièce, comme dans les figures de docs/mars1 : un point orange sur la pièce ;
 * au survol (ou au toucher), son nom et son rôle apparaissent. Un clic garde la bulle ouverte.
 */
export function Callout({ position, label, desc, side, focus = 'normal' }: { position: THREE.Vector3; label: string; desc?: string; side: 'left' | 'right'; focus?: CalloutFocus }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hover || pinned || focus === 'active';
  return (
    <Html position={position} zIndexRange={[open ? 40 : 20, 0]} center>
      <div className={`pin pin-${side} ${open ? 'pin-open' : ''} ${focus === 'dim' ? 'pin-dim' : ''}`}>
        <button
          type="button"
          className="pin-dot"
          aria-label={label}
          aria-expanded={open}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          onClick={() => setPinned((p) => !p)}
        />
        {open && (
          <span className="pin-card" role="tooltip">
            <span className="pin-name">{label}</span>
            {desc && <span className="pin-desc">{desc}</span>}
          </span>
        )}
      </div>
    </Html>
  );
}

interface Props {
  id: ModelId;
  /** Multiplicateur appliqué à la taille du catalogue. */
  scale?: number;
  annotated?: boolean;
  /** Étiquette de la pièce expliquée (ex. « parts.arm ») : elle ressort, les autres s'effacent. */
  focusPart?: string | null;
  /** Fait tourner les pièces « spin » (ex. rotors) tant que vrai. */
  spinning?: { current: boolean };
  children?: ReactNode;
}

function Inner({ id, scale = 1, annotated = false, focusPart, spinning, children }: Props) {
  const { t } = useTranslation();
  const { root, k, center, lift, scaledBox, spinners, radius } = useNormalized(id, scale);
  const anchor = (a: Annotation) => (a.norm ? new THREE.Vector3(...a.at).multiplyScalar(radius * k).add(new THREE.Vector3(0, lift, 0)) : anchorPosition(scaledBox, lift, a.at));
  useFrame((_, dt) => {
    if (!spinning?.current) return;
    // Rotors contrarotatifs : un sur deux tourne dans l'autre sens.
    spinners.forEach((o, i) => (o.rotation.y += dt * 38 * (i % 2 ? -1 : 1)));
  });
  const info = MODELS[id];
  return (
    <group>
      <group position={[-center.x * k, -center.y * k + lift, -center.z * k]} scale={k}>
        <primitive object={root} />
      </group>
      {annotated &&
        info.annotations.map((a) => (
          <Callout
            key={a.key}
            position={anchor(a)}
            label={t(a.key)}
            side={a.at[0] < (a.norm ? 0 : 0.5) ? 'left' : 'right'}
            focus={calloutFocus(a.key, focusPart)}
          />
        ))}
      {children}
    </group>
  );
}

/** Modèle 3D NASA, avec légendes optionnelles. */
export function NasaModel(props: Props) {
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  );
}

export function preloadModel(id: ModelId) {
  useGLTF.preload(MODELS[id].file);
}
