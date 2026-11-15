import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { PartPins, ownMaterials, partHandlers, useHighlight, type PartDef } from '../../components/3d/InteractiveParts';
import { Mesher, addShape, expandBox, toThree, type AnatomyData } from './geometry';
import { boxUVs, foilNormal, grainNormal } from './surfaces';

/*
 * Machines dessinées pièce par pièce (figures FORBITS Anatomy), en vrais maillages 3D.
 * 1 unité de la scène = 1 mètre ; les cotes viennent des fiches de chaque machine (model.mjs).
 */

export type AnatomyId = 'lunar-module' | 'lunar-rover' | 'surveyor';

const matCache = new Map<string, THREE.MeshPhysicalMaterial>();

/** Matières des figures, avec relief : feuille d'or froissée, laiton, acier brossé, chrome, peinture. */
function materialOf(m: string | null, tone: string) {
  const key = `${m}|${tone}`;
  const hit = matCache.get(key);
  if (hit) return hit;
  const mk = (color: string, metal: number, rough: number, normal: THREE.Texture, ns: number, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
    new THREE.MeshPhysicalMaterial({ color, metalness: metal, roughness: rough, normalMap: normal, normalScale: new THREE.Vector2(ns, ns), ...extra });
  let mat: THREE.MeshPhysicalMaterial;
  switch (m) {
    case 'gold': // couverture isolante (feuille d'or froissée) : reflets éclatés
      mat = mk('#d4a03a', 0.95, 0.28, foilNormal(), 0.9);
      break;
    case 'brass':
      mat = mk('#b98d4f', 0.85, 0.32, grainNormal(true), 0.3);
      break;
    case 'chrome':
      mat = mk('#e3e7ec', 1, 0.12, grainNormal(true), 0.15);
      break;
    case 'steel':
      mat = mk(tone === 'hi' ? '#c3c8cd' : '#8d939a', 0.8, 0.34, grainNormal(true), 0.35);
      break;
    case 'gunmetal':
      mat = mk(tone === 'hi' ? '#5b616a' : '#3d424a', 0.65, 0.42, grainNormal(true), 0.3);
      break;
    default: // peinture
      mat = mk(tone === 'hi' ? '#ebe8e1' : tone === 'mid' ? '#aeaaa2' : '#64615c', 0, 0.6, grainNormal(false), 0.12, { clearcoat: tone === 'hi' ? 0.35 : 0, clearcoatRoughness: 0.4 });
  }
  matCache.set(key, mat);
  return mat;
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
  /** Boîte de chaque pièce, dans le repère du modèle posé au sol. */
  boxes: Record<string, THREE.Box3>;
  /** Pièces présentes dans ce modèle, avec leurs noms (fr/en). */
  pieces: { id: string; fr: string; en: string; sayFr?: string; sayEn?: string }[];
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

  // Une géométrie par (groupe, matériau, pièce) : chaque pièce peut s'allumer seule au survol.
  const buckets = new Map<string, { m: Mesher; parent: THREE.Object3D; mat: THREE.Material; piece: string }>();
  const zero = new THREE.Vector3();
  for (const p of parts) {
    const key = `${p.g}|${p.m}|${p.t}|${pieceOf(p.n)}`;
    let b = buckets.get(key);
    if (!b) {
      b = { m: new Mesher(), parent: p.g >= 0 ? nodes[p.g] : inner, mat: materialOf(p.m, p.t), piece: pieceOf(p.n) };
      buckets.set(key, b);
    }
    const origin = p.g >= 0 ? origins[p.g] : zero;
    for (const s of p.s) addShape(b.m, s, origin);
  }
  for (const b of buckets.values()) {
    const geo = b.m.geometry();
    boxUVs(geo, 1 / 20); // une répétition de texture tous les 20 unités (50 cm)
    const mesh = new THREE.Mesh(geo, b.mat);
    mesh.userData.piece = b.piece;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    b.parent.add(mesh);
  }

  const joints: Built['joints'] = {};
  data.groups.forEach((g, i) => {
    joints[g.name] = { node: nodes[i], axis: g.kind === 'hinge' && g.axis ? toThree(g.axis).normalize() : new THREE.Vector3(0, 1, 0) };
  });
  const anchors: Built['anchors'] = {};
  const boxes: Built['boxes'] = {};
  for (const [piece, b] of Object.entries(pieceBoxes)) {
    const c = b.getCenter(new THREE.Vector3());
    anchors[piece] = new THREE.Vector3(c.x, b.max.y, c.z).add(shift).multiplyScalar(k);
    boxes[piece] = b.clone().translate(shift).applyMatrix4(new THREE.Matrix4().makeScale(k, k, k));
  }
  const present = new Set(parts.map((p) => pieceOf(p.n)));
  return { root, joints, anchors, boxes, size: box.getSize(new THREE.Vector3()).multiplyScalar(k), pieces: data.pieces.filter((p) => present.has(p.id)) };
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
  desc?: string;
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

function Inner({ id, annotated, labels: given = [], autoLabels: _auto, focusPart, onReady, fit, children, ...options }: Props) {
  const { i18n } = useTranslation();
  const built = useAnatomy(id, options);
  useEffect(() => {
    onReady?.(built);
  }, [built, onReady]);
  const k = fit ? fit / Math.max(built.size.x, built.size.y, built.size.z) : 1;
  const en = i18n.language === 'en';
  const group = useRef<THREE.Group>(null);
  // Pièces interactives : toutes les pièces présentes, avec leur nom et leur rôle (fiches Anatomy).
  const parts = useMemo<PartDef[]>(() => {
    if (!annotated) return [];
    ownMaterials(built.root);
    return built.pieces
      .filter((p) => built.boxes[p.id])
      .map((p) => {
        const b = built.boxes[p.id];
        const size = b.getSize(new THREE.Vector3());
        const meshes: THREE.Mesh[] = [];
        built.root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && o.userData.piece === p.id) meshes.push(o as THREE.Mesh);
        });
        return {
          key: p.id,
          name: en ? p.en : p.fr,
          desc: en ? p.sayEn : p.sayFr,
          anchors: [b.getCenter(new THREE.Vector3())],
          reach: Math.max(size.x, size.y, size.z) * 0.6,
          zoom: Math.max(1.2, size.length() * k * 1.8),
          meshes,
        };
      });
  }, [annotated, built, en, k]);
  // Pièce mise en avant depuis le panneau d'anatomie (étiquette « parts.… » → pièce).
  const extra = given.find((l) => l.label === focusPart)?.piece ?? null;
  useHighlight(parts, extra);
  const handlers = useMemo(() => (parts.length ? partHandlers(parts, group) : {}), [parts]);
  return (
    <group ref={group} scale={k}>
      <primitive object={built.root} {...handlers} />
      {annotated && <PartPins parts={parts} group={group} extra={extra} />}
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
