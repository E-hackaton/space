import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSearchParams } from 'react-router-dom';
import { MODELS, NasaModel, type ModelId } from '../components/3d/NasaModel';
import { Look } from '../world/Look';
import { AnatomyModel, type AnatomyId } from '../world/anatomy/AnatomyModel';
import { Grass, Trees } from '../world/props/Nature';
import { ToonRocket } from '../world/props/Vehicles';
import { Retroreflector } from '../world/props/Retroreflector';
import { AdoBridge } from '../world/props/AdoBridge';

const NO_FLAME = { current: 0 };
import { earthField } from '../world/terrain';

const LAB_FIELD = earthField();
const LAB_TREES = [
  { x: -5, z: 0, s: 1.3, phase: 0 },
  { x: 4, z: -3, s: 1, phase: 1 },
  { x: 1, z: 6, s: 0.8, phase: 2 },
];

/** Outil de développement : voir chaque modèle NASA et régler ses légendes. Route /labo (dev seulement). */
export default function ModelLab() {
  const [params] = useSearchParams();
  const anat = params.get('anat')?.split(',').filter(Boolean) as AnatomyId[] | undefined;
  const ids = anat ? [] : (params.get('m')?.split(',') as ModelId[] | undefined) ?? (Object.keys(MODELS).filter((k) => k !== '_note') as ModelId[]);
  const cols = Math.ceil(Math.sqrt(ids.length));
  const d = Number(params.get('d') ?? 16);
  const az = Number(params.get('az') ?? 0);
  return (
    <div className="h-[calc(100vh-3.5rem)] bg-[#2a2030]">
      <Canvas shadows camera={{ position: [Math.sin(az) * d, d * 0.45, Math.cos(az) * d], fov: 40 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 4]} intensity={2.4} castShadow />
        <Look ground="#2a2030" />
        {ids.map((id, i) => {
          const x = ((i % cols) - (cols - 1) / 2) * 6;
          const z = (Math.floor(i / cols) - (Math.ceil(ids.length / cols) - 1) / 2) * 6;
          const s = 3 / MODELS[id].size;
          return (
            <group key={id} position={[x, 0, z]}>
              <NasaModel id={id} scale={s} annotated={params.has('a')} />
            </group>
          );
        })}
        {params.has('rocket') && <ToonRocket flame={NO_FLAME} />}
        {params.has('bridge') && (
          <group scale={0.05} rotation={[0, 0.35, 0]}>
            <AdoBridge />
          </group>
        )}
        {params.has('refl') && (
          <group scale={2.6}>
            <group position={[-0.8, 0, 0]}>
              <Retroreflector variant="a11" annotated />
            </group>
            <group position={[0.7, 0, 0]}>
              <Retroreflector variant="a15" />
            </group>
          </group>
        )}
        {params.has('nature') && (
          <group position={[0, -LAB_FIELD.heightAt(0, 0), 0]}>
            <Trees field={LAB_FIELD} trees={LAB_TREES} animate />
            <Grass field={LAB_FIELD} radius={14} clumps={900} animate />
          </group>
        )}
        {anat?.map((id, i) => (
          <group key={id} position={[(i - (anat.length - 1) / 2) * 7, 0, 0]}>
            <AnatomyModel id={id} />
          </group>
        ))}
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#5a4038" />
        </mesh>
        <OrbitControls target={[0, 1.2, 0]} />
      </Canvas>
    </div>
  );
}
