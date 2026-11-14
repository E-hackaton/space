import gsap from 'gsap';
import type { Machine, Phase } from '../../lib/machines';

/**
 * Valeurs animées par GSAP (0 → 1) qui pilotent toute la cinématique d'une mission.
 * La scène 3D les lit à chaque image ; l'interface aussi (compteur de dates).
 */
export interface MissionAnim {
  launch: number;
  travel: number;
  arrive: number;
  decline: number;
  end: number;
}

export function createMissionAnim(): MissionAnim {
  return { launch: 0, travel: 0, arrive: 0, decline: 0, end: 0 };
}

// `conception` (−1) : la machine est encore sur Terre, la fusée attend sur le pas de tir.
const RANK: Record<Phase, number> = { conception: -1, launch: 0, cruise: 1, arrival: 2, work: 3, discovery: 4, decline: 5, end: 6 };

/** Valeurs cibles pour une étape du récit (−1 = sur le pas de tir). */
export function targetsFor(machine: Machine, step: number): MissionAnim {
  if (step < 0) return createMissionAnim();
  const phase = machine.story[step].phase;
  const r = RANK[phase];
  let travel = r > RANK.cruise ? 1 : 0;
  if (r === RANK.cruise) {
    // Plusieurs étapes de croisière (survols) : on avance d'un tronçon à chaque fois.
    const cruiseSteps = machine.story.map((s, i) => (s.phase === 'cruise' ? i : -1)).filter((i) => i >= 0);
    const k = cruiseSteps.indexOf(step);
    const segments = (machine.cruise?.length ?? 0) + 1;
    travel = machine.cruise?.length ? (k + 1) / segments : 1;
  }
  return {
    launch: r >= RANK.launch ? 1 : 0,
    travel,
    arrive: r >= RANK.arrival ? 1 : 0,
    decline: r >= RANK.decline ? 1 : 0,
    end: r >= RANK.end ? 1 : 0,
  };
}

const DURATIONS: Record<keyof MissionAnim, { d: number; ease: string }> = {
  launch: { d: 4, ease: 'power2.in' },
  travel: { d: 5.5, ease: 'power1.inOut' },
  arrive: { d: 3.2, ease: 'power2.out' },
  decline: { d: 2.5, ease: 'sine.inOut' },
  end: { d: 4.5, ease: 'power1.in' },
};

/**
 * Anime vers les valeurs cibles. Chaque grandeur a sa propre durée ;
 * si plusieurs changent (saut d'étapes), elles s'enchaînent dans l'ordre logique.
 */
export function animateTo(anim: MissionAnim, target: MissionAnim, instant: boolean): gsap.core.Timeline {
  gsap.killTweensOf(anim);
  const tl = gsap.timeline();
  const order: (keyof MissionAnim)[] = ['launch', 'travel', 'arrive', 'decline', 'end'];
  const forward = order.some((k) => target[k] > anim[k]);
  for (const key of forward ? order : [...order].reverse()) {
    if (anim[key] === target[key]) continue;
    const { d, ease } = DURATIONS[key];
    tl.to(anim, { [key]: target[key], duration: instant ? 0 : forward ? d : 0.8, ease: forward ? ease : 'power1.out' }, '>');
  }
  return tl;
}
