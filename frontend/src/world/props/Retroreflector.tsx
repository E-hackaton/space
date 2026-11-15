import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { PartPins, ownMaterials, partHandlers, useHighlight, type PartDef } from '../../components/3d/InteractiveParts';
import { grainNormal } from '../anatomy/surfaces';

/*
 * Réflecteur laser (LRRR) : un panneau d'aluminium percé d'alvéoles ; dans chacune, un coin de cube
 * en silice fondue (trois faces en miroir à angle droit) renvoie la lumière exactement vers sa source.
 *
 * - Apollo 11 : 100 coins de cube, panneau d'environ 46 cm de côté (fiche Anatomy, d'après la NASA).
 * - Apollo 15 : 300 coins de cube sur un panneau plus grand. TODO: à vérifier (nombre, dimensions et
 *   disposition exacte) ; la disposition est ici une grille approchée et la bulle n'affiche pas de chiffre.
 *
 * Toutes les cotes en mètres ; avant du panneau vers −z, incliné vers le ciel (la Terre).
 */

/** Face de verre (silice fondue) : très lisse, irisée, laisse deviner le prisme dessous. */
const glassMat = new THREE.MeshPhysicalMaterial({
  color: '#ffffff',
  metalness: 0.55,
  roughness: 0.03,
  iridescence: 1,
  iridescenceIOR: 1.8,
  iridescenceThicknessRange: [220, 780],
  clearcoat: 1,
  clearcoatRoughness: 0.02,
  transparent: true,
  opacity: 0.82,
  envMapIntensity: 1.6,
});

export type ReflectorVariant = 'a11' | 'a15';

const SPEC: Record<ReflectorVariant, { cols: number; rows: number; w: number; h: number; tilt: number }> = {
  a11: { cols: 10, rows: 10, w: 0.46, h: 0.46, tilt: 0.45 },
  a15: { cols: 20, rows: 15, w: 1.05, h: 0.6, tilt: 0.45 }, // TODO: à vérifier
};

const metal = new THREE.MeshPhysicalMaterial({ color: '#b9bec6', metalness: 0.85, roughness: 0.32, normalMap: grainNormal(true), normalScale: new THREE.Vector2(0.35, 0.35) });
const frameMat = new THREE.MeshPhysicalMaterial({ color: '#7d838c', metalness: 0.8, roughness: 0.4 });
const palletMat = new THREE.MeshPhysicalMaterial({ color: '#d8d4cb', metalness: 0.1, roughness: 0.6, clearcoat: 0.3 });
const cupMat = new THREE.MeshPhysicalMaterial({ color: '#30353d', metalness: 0.9, roughness: 0.25 });
/** Prismes : verre sombre très réfléchissant, avec des reflets irisés (bleu, violet, or). */
const prismMat = new THREE.MeshPhysicalMaterial({
  color: '#16203a',
  metalness: 0.95,
  roughness: 0.04,
  iridescence: 1,
  iridescenceIOR: 1.6,
  iridescenceThicknessRange: [180, 620],
  clearcoat: 1,
  clearcoatRoughness: 0.02,
  flatShading: true,
});

export function Retroreflector({ variant, size, annotated = false }: { variant: ReflectorVariant; size?: number; annotated?: boolean }) {
  const { t } = useTranslation();
  const s = SPEC[variant];
  const group = useRef<THREE.Group>(null);
  const cubes = useRef<THREE.InstancedMesh>(null);
  const cups = useRef<THREE.InstancedMesh>(null);
  const support = useRef<THREE.Group>(null);
  const n = s.cols * s.rows;
  const pitch = Math.min(s.w / s.cols, s.h / s.rows);
  const r = pitch * 0.42;
  const k = size ? size / Math.max(s.w, 0.6) : 1;
  // Les maillages n'existent qu'après le premier rendu : on recalcule alors les pièces.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  // Prisme : pyramide à 3 faces (le coin de cube vu de face), pointe vers l'intérieur du panneau.
  const prismGeo = useMemo(() => {
    const h = r * 0.8;
    const g = new THREE.ConeGeometry(r * 0.92, h, 3, 1);
    g.rotateX(-Math.PI / 2); // pointe vers −z : logé dans l'alvéole, la base juste sous la surface
    g.translate(0, 0, -h / 2 - 0.001);
    return g;
  }, [r]);
  const glassGeo = useMemo(() => new THREE.CircleGeometry(r * 0.96, 24), [r]);
  const rimGeo = useMemo(() => new THREE.TorusGeometry(r, r * 0.08, 6, 24), [r]);
  // Teinte de chaque face de verre : reflets bleus, violets, cyan et or pâle, comme sur les photos.
  const tints = useMemo(() => {
    const pal = ['#3b5bd6', '#5b46c4', '#2f8fb8', '#3c6fd1', '#b89a4a', '#4a3fa8'].map((c) => new THREE.Color(c));
    return Array.from({ length: n }, (_, i) => pal[(i * 7 + Math.floor(i / 3)) % pal.length]);
  }, [n]);
  // Alvéole : un tube ouvert entièrement enfoncé dans le panneau (rien ne dépasse de la face avant).
  const cupGeo = useMemo(() => new THREE.CylinderGeometry(r, r, pitch * 0.5, 20, 1, true).rotateX(Math.PI / 2).translate(0, 0, -pitch * 0.25 - 0.001), [r, pitch]);

  const matrices = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    for (let j = 0; j < s.rows; j++)
      for (let i = 0; i < s.cols; i++) {
        const x = (i - (s.cols - 1) / 2) * (s.w / s.cols);
        const y = (j - (s.rows - 1) / 2) * (s.h / s.rows);
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), ((i * 7 + j * 13) % 6) * (Math.PI / 3)); // orientations variées
        out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, 0.0185), q, new THREE.Vector3(1, 1, 1)));
      }
    return out;
  }, [s]);

  const lift = 0.16; // hauteur du bas du panneau
  const parts = useMemo<PartDef[]>(() => {
    if (!ready || !annotated || !cubes.current || !cups.current || !support.current || !group.current) return [];
    const supportMeshes: THREE.Mesh[] = [];
    support.current.traverse((o) => (o as THREE.Mesh).isMesh && supportMeshes.push(o as THREE.Mesh));
    ownMaterials(support.current);
    const panelCentre = new THREE.Vector3(0, lift + (s.h / 2) * Math.cos(s.tilt) + 0.02, 0);
    return [
      {
        key: 'cubes',
        name: t('reflector.cubes'),
        desc: variant === 'a11' ? t('reflector.cubesA11') : t('reflector.cubesA15'),
        anchors: [panelCentre],
        reach: Math.max(s.w, s.h) * 0.6,
        zoom: Math.max(s.w, s.h) * 2.2 * k,
        meshes: [cubes.current, cups.current],
      },
      {
        key: 'support',
        name: t('reflector.support'),
        desc: t('reflector.supportDesc'),
        anchors: [new THREE.Vector3(0, 0.05, s.h * 0.3)],
        reach: Math.max(s.w, s.h) * 0.4,
        zoom: Math.max(s.w, s.h) * 2 * k,
        meshes: supportMeshes,
      },
    ];
  }, [ready, annotated, s, variant, t, k]);
  useHighlight(parts);
  const handlers = useMemo(() => (parts.length ? partHandlers(parts, group) : {}), [parts]);

  return (
    <group ref={group} scale={k} {...handlers}>
      {/* Panneau incliné vers le ciel */}
      <group position={[0, lift + (s.h / 2) * Math.cos(s.tilt), (s.h / 2) * Math.sin(s.tilt)]} rotation={[-Math.PI / 2 + s.tilt, 0, 0]}>
        <RoundedBox args={[s.w + 0.04, s.h + 0.04, 0.035]} radius={0.006} smoothness={3} material={metal} castShadow receiveShadow />
        <RoundedBox args={[s.w + 0.06, s.h + 0.06, 0.02]} radius={0.004} position={[0, 0, -0.015]} material={frameMat} />
        <instancedMesh
          ref={cups}
          args={[cupGeo, cupMat, n]}
          onUpdate={(m) => {
            matrices.forEach((mm, i) => m.setMatrixAt(i, mm));
            m.instanceMatrix.needsUpdate = true;
          }}
        />
        <instancedMesh
          ref={cubes}
          args={[prismGeo, prismMat, n]}
          onUpdate={(m) => {
            matrices.forEach((mm, i) => m.setMatrixAt(i, mm));
            m.instanceMatrix.needsUpdate = true;
          }}
        />
        {/* Face de verre de chaque coin de cube, irisée */}
        <instancedMesh
          args={[glassGeo, glassMat, n]}
          onUpdate={(m) => {
            matrices.forEach((mm, i) => {
              m.setMatrixAt(i, mm);
              m.setColorAt(i, tints[i]);
            });
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
          }}
        />
        {/* Bord de chaque alvéole */}
        <instancedMesh
          args={[rimGeo, metal, n]}
          onUpdate={(m) => {
            matrices.forEach((mm, i) => m.setMatrixAt(i, mm));
            m.instanceMatrix.needsUpdate = true;
          }}
        />
      </group>
      {/* Socle (palette) et pieds réglables */}
      <group ref={support}>
        <RoundedBox args={[s.w * 1.05, 0.05, s.h * 0.75]} radius={0.01} position={[0, 0.025, s.h * 0.15]} material={palletMat} castShadow receiveShadow />
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * s.w * 0.42, lift / 2 + 0.03, s.h * 0.45]} material={metal} castShadow>
            <cylinderGeometry args={[0.008, 0.008, lift + 0.06, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 0.12, s.h * 0.62]} rotation={[0.6, 0, 0]} material={metal} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.28, 8]} />
        </mesh>
      </group>
      {annotated && parts.length > 0 && <PartPins parts={parts} group={group} />}
    </group>
  );
}
