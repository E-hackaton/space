import { SceneCanvas } from './SceneCanvas';
import { SolarSystemBodies } from './SolarSystemBodies';
import { FreeCamera } from './FreeCamera';
import { MissionDirector } from './mission/MissionDirector';
import type { BodyId, TourStop } from '../lib/solarSystem';
import type { Machine } from '../lib/machines';
import { BODY_ORDER } from '../lib/solarSystem';
import type { MissionAnim } from './mission/missionAnim';

interface Props {
  focus: TourStop;
  onSelect: (id: BodyId) => void;
  machine?: Machine;
  /** Mission lancée (pas de tir, récit ou épilogue) : la caméra libre laisse la place à la cinématique. */
  inMission: boolean;
  step: number;
  anim: MissionAnim;
  animate: boolean;
}

export default function MissionScene({ focus, onSelect, machine, inMission, step, anim, animate }: Props) {
  const mission = inMission && machine;
  // Une fois arrivé, on ne montre que la destination (et la Terre pour la Lune) :
  // la scène n'étant pas à l'échelle, une planète lointaine pourrait sinon remplir le ciel.
  const phase = mission && step >= 0 ? machine.story[Math.min(step, machine.story.length - 1)].phase : undefined;
  const arrived = phase !== undefined && phase !== 'conception' && phase !== 'launch' && phase !== 'cruise';
  const keep = mission ? [machine.body, ...(machine.body === 'moon' ? (['earth'] as const) : [])] : [];
  const hidden = arrived ? BODY_ORDER.filter((id) => !keep.includes(id)) : [];
  return (
    <SceneCanvas animate={animate}>
      <SolarSystemBodies
        animate={animate}
        showLabels={!mission}
        selected={focus === 'overview' ? null : focus}
        onSelect={mission ? undefined : onSelect}
        frozen={mission ? ['earth', machine.body] : []}
        moonOrbiting={mission ? machine.body !== 'moon' : focus !== 'moon'}
        hidden={hidden}
      />
      {mission ? (
        <MissionDirector key={machine.id} machine={machine} anim={anim} step={step} animate={animate} />
      ) : (
        <FreeCamera focus={focus} animate={animate} framing={3.2} liftY={0.25} />
      )}
    </SceneCanvas>
  );
}
