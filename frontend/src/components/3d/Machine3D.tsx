import { MODELS, NasaModel } from './NasaModel';
import { MachineModel } from './Craft';
import { AnatomyModel } from '../../world/anatomy/AnatomyModel';
import { lookOf } from '../../lib/atlas';
import type { MachineKind } from '../../lib/machines';

/**
 * Une machine en 3D, quelle que soit sa source : modèle officiel NASA, figure Anatomy
 * (pièce par pièce) ou forme simplifiée. `size` : plus grande dimension visée (unités de scène).
 */
export function Machine3D({ id, kind, active, size = 1, flying = false }: { id: string; kind: MachineKind; active: boolean; size?: number; flying?: boolean }) {
  const look = lookOf(id);
  if (look.kind === 'nasa') return <NasaModel id={look.id} scale={size / MODELS[look.id].size} spinning={flying ? { current: true } : undefined} />;
  if (look.kind === 'anatomy')
    return <AnatomyModel id={look.id} fit={size} pieces={look.pieces} exclude={look.exclude} excludeGroups={look.excludeGroups} />;
  return (
    <group scale={size}>
      <MachineModel kind={kind} active={active} flying={flying} />
    </group>
  );
}
