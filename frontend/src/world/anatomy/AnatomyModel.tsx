import { Suspense, useEffect, useMemo, type ReactNode } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { smooth } from '../materials';
import { Callout, calloutFocus } from '../../components/3d/NasaModel';
import { Mesher, addShape, expandBox, toThree, type AnatomyData } from './geometry';

/*
 * Machines dessinées pièce par pièce (figures FORBITS Anatomy), en vrais maillages 3D.
 * 1 unité de la scène = 1 mètre ; les cotes viennent des fiches de chaque machine (model.mjs).
 */

export type AnatomyId = 'lunar-module' | 'lunar-rover' | 'surveyor';

/** Teintes des matériaux des figures (feuille d'or, laiton, acier, chrome, peinture). */
function materialOf(m: string | null, tone: string) {
  switch (m) {
    case 'gold':
      return smooth('#d9a640', { metal: 0.85, rough: 0.32 });
    case 'brass':
      return smooth('#b98d4f', { metal: 0.8, rough: 0.35 });
    case 'chrome':
      return smooth('#e3e7ec', { metal: 1, rough: 0.14 });
    case 'steel':
      return smooth(tone === 'hi' ? '#c3c8cd' : '#8d939a', { metal: 0.75, rough: 0.35 });
    case 'gunmetal':
      return smooth(tone === 'hi' ? '#5b616a' : '#3d424a', { metal: 0.6, rough: 0.42 });
    default:
      return smooth(tone === 'hi' ? '#ebe8e1' : tone === 'mid' ? '#aeaaa2' : '#64615c', { rough: 0.55, clearcoat: tone === 'hi' ? 0.4 : 0 });
  }
}

const pieceOf = (name: string) => name.split('.')[0];

interface Options {
  /** Pièces gardées (préfixe du nom, ex. « descent ») ; toutes si absent. */
  pieces?: string[];
  /** Pièces retirées. */
  exclude?: string[];
  /** Groupes animés retirés (ex. « asc » : l'étage de remontée reparti de la Lune). */
  excludeGroups?: string[];
}

export interface Built {
  root: THREE.Group;
  /** Nœuds articulés, par nom de groupe de la figure (ex. « sFL » direction, « wFL » roue). */
  joints: Record<string, { node: THREE.Group; axis: THREE.Vector3 }>;
  /** Centre haut de chaque pièce (« descent ») ou sous-pièce (« gear.pad0 »), pour les légendes. */
  anchors: Record<string, THREE.Vector3>;
  size: THREE.Vector3;
  /** Pièces présentes dans ce modèle, avec leurs noms (fr/en). */
  pieces: { id: string; fr: string; en: string }[];
}

function build(data: AnatomyData, { pieces, exclude, excludeGroups }: Options): Built {
  const k = 1 / data.unitsPerMetre;
  const banned = new Set(data.groups.map((g, i) => (excludeGroups?.includes(g.name) ? i : -1)).filter((i) => i >= 0));
  // un groupe exclu exclut aussi ses descendants
  data.groups.forEach((g, i) => {
    if (banned.has(g.parent)) banned.add(i);
  });
  const parts = data.parts.filter((p) => {
    const piece = pieceOf(p.n);
    if (pieces && !pieces.includes(piece)) return false;
    if (exclude?.includes(piece)) return false;
    return !banned.has(p.g);
  });

  // Boîte englobante de ce qui est gardé : on centre en plan et on pose au sol.
  const box = new THREE.Box3();
  const pieceBoxes: Record<string, THREE.Box3> = {};
  for (const p of parts)
    for (const s of p.s) {
      expandBox(box, s);
      expandBox((pieceBoxes[pieceOf(p.n)] ??= new THREE.Box3()), s);
      expandBox((pieceBoxes[p.n] ??= new THREE.Box3()), s);
    }
  const centre = box.getCenter(new THREE.Vector3());
  const shift = new THREE.Vector3(-centre.x, -box.min.y, -centre.z);

  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.scale.setScalar(k);
  inner.position.copy(shift).multiplyScalar(k);
  root.add(inner);

  // Groupes articulés : chaque nœud est placé à son pivot.
  const origins = data.groups.map((g) => toThree(g.origin));
  const nodes = data.groups.map((g, i) => {
    const node = new THREE.Group();
    node.name = g.name;
    node.position.copy(origins[i]);
    if (g.parent >= 0) node.position.sub(origins[g.parent]);
    return node;
  });
  data.groups.forEach((g, i) => (g.parent >= 0 ? nodes[g.parent] : inner).add(nodes[i]));

  // Une géométrie fusionnée par (groupe, matériau) : peu d'appels de dessin.
  const buckets = new Map<string, { m: Mesher; parent: THREE.Object3D; mat: THREE.Material }>();
  const zero = new THREE.Vector3();
  for (const p of parts) {
    const key = `${p.g}|${p.m}|${p.t}`;
    let b = buckets.get(key);
    if (!b) {
      b = { m: new Mesher(), parent: p.g >= 0 ? nodes[p.g] : inner, mat: materialOf(p.m, p.t) };
      buckets.set(key, b);
    }
    const origin = p.g >= 0 ? origins[p.g] : zero;
    for (const s of p.s) addShape(b.m, s, origin);
  }
  for (const b of buckets.values()) {
    const mesh = new THREE.Mesh(b.m.geometry(), b.mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    b.parent.add(mesh);
  }

  const joints: Built['joints'] = {};
  data.groups.forEach((g, i) => {
    joints[g.name] = { node: nodes[i], axis: g.kind === 'hinge' && g.axis ? toThree(g.axis).normalize() : new THREE.Vector3(0, 1, 0) };
  });
  const anchors: Built['anchors'] = {};
  for (const [piece, b] of Object.entries(pieceBoxes)) {
    const c = b.getCenter(new THREE.Vector3());
    anchors[piece] = new THREE.Vector3(c.x, b.max.y, c.z).add(shift).multiplyScalar(k);
  }
  const present = new Set(parts.map((p) => pieceOf(p.n)));
  return { root, joints, anchors, size: box.getSize(new THREE.Vector3()).multiplyScalar(k), pieces: data.pieces.filter((p) => present.has(p.id)) };
}

export function useAnatomy(id: AnatomyId, options: Options = {}) {
  const raw = useLoader(THREE.FileLoader, `/models/anatomy/${id}.json`) as string;
  const key = JSON.stringify(options);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const built = useMemo(() => build(JSON.parse(raw) as AnatomyData, options), [raw, key]);
  useEffect(
    () => () =>
      built.root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      }),
    [built],
  );
  return built;
}

export interface Label {
  piece: string;
  label: string;
}

interface Props extends Options {
  id: AnatomyId;
  annotated?: boolean;
  labels?: Label[];
  focusPart?: string | null;
  /** Légende automatiquement chaque pièce présente (nom de la fiche Anatomy, dans la langue du site). */
  autoLabels?: boolean;
  /** Met le modèle à cette taille (plus grande dimension, en unités de scène) au lieu des vraies cotes. */
  fit?: number;
  /** Reçoit les articulations une fois le modèle construit (ex. roues du rover). */
  onReady?: (b: Built) => void;
  children?: ReactNode;
}

function Inner({ id, annotated, labels: given = [], autoLabels, focusPart, onReady, fit, children, ...options }: Props) {
  const { t, i18n } = useTranslation();
  const built = useAnatomy(id, options);
  useEffect(() => {
    onReady?.(built);
  }, [built, onReady]);
  const k = fit ? fit / Math.max(built.size.x, built.size.y, built.size.z) : 1;
  const labels = autoLabels ? built.pieces.map((p) => ({ piece: p.id, label: i18n.language === 'en' ? p.en : p.fr })) : given;
  return (
    <group scale={k}>
      <primitive object={built.root} />
      {annotated &&
        labels.map((l) =>
          built.anchors[l.piece] ? (
            <Callout key={l.label} position={built.anchors[l.piece]} label={l.label.startsWith('parts.') ? t(l.label) : l.label} side={built.anchors[l.piece].x < 0 ? 'left' : 'right'} focus={calloutFocus(l.label, focusPart)} />
          ) : null,
        )}
      {children}
    </group>
  );
}

/** Une machine Anatomy dans la scène, posée au sol, avec légendes optionnelles. */
export function AnatomyModel(props: Props) {
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  );
}

export function preloadAnatomy(id: AnatomyId) {
  useLoader.preload(THREE.FileLoader, `/models/anatomy/${id}.json`);
}
