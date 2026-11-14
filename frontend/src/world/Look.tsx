import { Environment, Lightformer } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

/**
 * L'ambiance visuelle commune : reflets doux sur les machines (environnement généré sur place,
 * aucun fichier à télécharger), léger halo lumineux et vignettage.
 * En qualité réduite, on garde seulement les reflets.
 */
export function Look({ tint = '#ffffff', ground = '#3a2a24', effects = true, bloom = 0.6 }: { tint?: string; ground?: string; effects?: boolean; bloom?: number }) {
  return (
    <>
      <Environment resolution={128} frames={1}>
        <color attach="background" args={[ground]} />
        <Lightformer form="rect" intensity={2.2} color={tint} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#9fc3ff" position={[-6, 2, -4]} rotation-y={Math.PI / 3} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={1.6} color="#ffd6a0" position={[6, 3, 4]} scale={3} />
      </Environment>
      {effects && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom intensity={bloom} luminanceThreshold={0.82} luminanceSmoothing={0.2} mipmapBlur />
          <Vignette offset={0.25} darkness={0.55} />
        </EffectComposer>
      )}
    </>
  );
}
