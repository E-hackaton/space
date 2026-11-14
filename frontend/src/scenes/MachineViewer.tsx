import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MODELS, NasaModel, type ModelId } from '../components/3d/NasaModel';
import { MachineModel } from '../components/3d/Craft';
import type { MachineKind } from '../lib/machines';
import { Look } from '../world/Look';

interface Props {
  model?: ModelId;
  kind: MachineKind;
  active: boolean;
  /** Étiquette de la pièce expliquée : elle ressort, les autres s'effacent. */
  focusPart: string | null;
  animate: boolean;
  label: string;
}

/** Taille de présentation (mètres de scène) : toutes les machines occupent le même cadre. */
const SHOWCASE_SIZE = 3;

/**
 * Vue d'inspection d'une machine : on la fait tourner du doigt, ses pièces sont étiquetées
 * (modèle NASA) et la pièce expliquée est mise en avant.
 */
export default function MachineViewer({ model, kind, active, focusPart, animate, label }: Props) {
  return (
    <div className="h-full w-full" role="img" aria-label={label}>
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [4.5, 3, 5.5], fov: 40 }}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 8, 4]} intensity={2.4} castShadow />
        <Look ground="#101830" effects={false} />
        {model ? (
          <NasaModel id={model} scale={SHOWCASE_SIZE / MODELS[model].size} annotated focusPart={focusPart} />
        ) : (
          // Pas de modèle NASA : forme simplifiée (≈ 1 unité), agrandie pour la vitrine.
          <group scale={SHOWCASE_SIZE * 0.8}>
            <MachineModel kind={kind} active={active} />
          </group>
        )}
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[4, 48]} />
          <meshStandardMaterial color="#1b2445" />
        </mesh>
        <OrbitControls target={[0, 1.1, 0]} enablePan={false} minDistance={3.5} maxDistance={11} autoRotate={animate && !focusPart} autoRotateSpeed={0.8} />
      </Canvas>
    </div>
  );
}
