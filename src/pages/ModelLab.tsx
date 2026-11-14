import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSearchParams } from 'react-router-dom';
import { MODELS, NasaModel, type ModelId } from '../components/3d/NasaModel';
import { Look } from '../world/Look';

/** Outil de développement : voir chaque modèle NASA et régler ses légendes. Route /labo (dev seulement). */
export default function ModelLab() {
  const [params] = useSearchParams();
  const ids = (params.get('m')?.split(',') as ModelId[] | undefined) ?? (Object.keys(MODELS).filter((k) => k !== '_note') as ModelId[]);
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
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#5a4038" />
        </mesh>
        <OrbitControls target={[0, 1.2, 0]} />
      </Canvas>
    </div>
  );
}
