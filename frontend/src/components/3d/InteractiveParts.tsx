import { useEffect, type RefObject } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { create } from 'zustand';
import * as THREE from 'three';

/*
 * Pièces interactives d'une machine posée dans la scène, comme dans les figures de docs/mars1 :
 * - survol : la pièce s'allume (orange) et sa bulle montre son nom et son rôle ;
 * - clic : la bulle reste ouverte ; double-clic : la caméra vole vers la pièce.
 * Une pièce est trouvée par son maillage (`meshes`) ou, à défaut, par la proximité de ses repères.
 */

export interface PartDef {
  key: string;
  name: string;
  desc?: string;
  /** Ce que la pièce a permis de découvrir (fil rouge ingénierie → science). */
  finding?: string;
  /** Repères de la pièce, dans le repère local du groupe de la machine. */
  anchors: THREE.Vector3[];
  /** Rayon de détection autour des repères (même repère). */
  reach: number;
  /** Distance de la caméra après un double-clic (unités de scène). */
  zoom: number;
  meshes: THREE.Mesh[];
}

interface PartsState {
  hovered: string | null;
  pinned: string | null;
  /** Demande de vol de caméra vers une pièce (point monde et distance). */
  focus: { point: THREE.Vector3; dist: number } | null;
  setHovered: (k: string | null) => void;
  togglePinned: (k: string | null) => void;
  setFocus: (f: PartsState['focus']) => void;
}

export const useParts = create<PartsState>()((set, get) => ({
  hovered: null,
  pinned: null,
  focus: null,
  setHovered: (hovered) => (get().hovered === hovered ? undefined : set({ hovered })),
  togglePinned: (k) => set({ pinned: k && get().pinned !== k ? k : null }),
  setFocus: (focus) => set({ focus }),
}));

const local = new THREE.Vector3();

/** La pièce sous le pointeur : celle du maillage touché, sauf repère plus précis tout proche. */
export function pickPart(parts: PartDef[], object: THREE.Object3D, point: THREE.Vector3, group: THREE.Object3D): PartDef | null {
  const owner = parts.find((p) => p.meshes.some((m) => m === object)) ?? null;
  group.worldToLocal(local.copy(point));
  let best: PartDef | null = null;
  let bestD = Infinity;
  for (const p of parts) {
    if (owner && p !== owner && p.meshes.length) continue;
    for (const a of p.anchors) {
      const d = a.distanceTo(local) / p.reach;
      if (d < 1 && d < bestD) {
        best = p;
        bestD = d;
      }
    }
  }
  return best ?? owner;
}

/** Écouteurs de pointeur à poser sur le groupe de la machine. */
export function partHandlers(parts: PartDef[], group: RefObject<THREE.Group | null>) {
  const st = useParts.getState;
  const under = (e: ThreeEvent<PointerEvent | MouseEvent>) => (group.current ? pickPart(parts, e.object, e.point, group.current) : null);
  return {
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const p = under(e);
      st().setHovered(p?.key ?? null);
      document.body.style.cursor = p ? 'pointer' : '';
    },
    onPointerOut: () => {
      st().setHovered(null);
      document.body.style.cursor = '';
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (e.delta > 5) return; // c'était un glisser (rotation de la caméra)
      e.stopPropagation();
      st().togglePinned(under(e)?.key ?? null);
    },
    onDoubleClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const p = under(e);
      if (p && group.current) st().setFocus({ point: group.current.localToWorld(p.anchors[0].clone()), dist: p.zoom });
    },
  };
}

/** Allume en orange les maillages de la pièce survolée (ou épinglée), comme dans les figures. */
export function useHighlight(parts: PartDef[], extra: string | null = null) {
  const hovered = useParts((s) => s.hovered);
  const pinned = useParts((s) => s.pinned);
  useEffect(() => {
    const on = new Set([hovered, pinned, extra].filter(Boolean));
    for (const p of parts)
      for (const m of p.meshes) {
        const mats = (Array.isArray(m.material) ? m.material : [m.material]) as THREE.MeshStandardMaterial[];
        for (const mat of mats) {
          if (!mat.emissive) continue;
          mat.userData.e0 ??= [mat.emissive.getHex(), mat.emissiveIntensity];
          const lit = on.has(p.key);
          mat.emissive.setHex(lit ? 0xff5a00 : mat.userData.e0[0]);
          mat.emissiveIntensity = lit ? 0.55 : mat.userData.e0[1];
        }
      }
  }, [parts, hovered, pinned, extra]);
  useEffect(() => () => useParts.setState({ hovered: null, pinned: null }), []);
}

/** Donne à chaque maillage son propre matériau (sinon allumer une pièce allumerait toutes les autres). */
export function ownMaterials(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.ownMat) return;
    m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone();
    m.userData.ownMat = true;
  });
}

/** Les points orange des pièces ; la bulle s'ouvre au survol, au toucher, ou si la pièce est épinglée. */
export function PartPins({ parts, group, extra = null }: { parts: PartDef[]; group: RefObject<THREE.Group | null>; extra?: string | null }) {
  const hovered = useParts((s) => s.hovered);
  const pinned = useParts((s) => s.pinned);
  const setHovered = useParts((s) => s.setHovered);
  const togglePinned = useParts((s) => s.togglePinned);
  const setFocus = useParts((s) => s.setFocus);
  return (
    <>
      {parts.map((p) => {
        const open = hovered === p.key || pinned === p.key || extra === p.key;
        return (
          <Html key={p.key} position={p.anchors[0]} zIndexRange={[open ? 40 : 20, 0]} center>
            <div className={`pin ${p.anchors[0].x < 0 ? 'pin-left' : 'pin-right'} ${open ? 'pin-open' : ''}`}>
              <button
                type="button"
                className="pin-dot"
                aria-label={p.name}
                aria-expanded={open}
                onPointerEnter={() => setHovered(p.key)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(p.key)}
                onBlur={() => setHovered(null)}
                onClick={() => togglePinned(p.key)}
                onDoubleClick={() => group.current && setFocus({ point: group.current.localToWorld(p.anchors[0].clone()), dist: p.zoom })}
              />
              {open && (
                <span className="pin-card" role="tooltip">
                  <span className="pin-name">{p.name}</span>
                  {p.desc && <span className="pin-desc">{p.desc}</span>}
                  {p.finding && <span className="pin-finding">{p.finding}</span>}
                </span>
              )}
            </div>
          </Html>
        );
      })}
    </>
  );
}
