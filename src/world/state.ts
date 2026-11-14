import { create } from 'zustand';

export type WorldId = 'earth' | 'moon' | 'jezero' | 'gale';
export type Phase = 'drive' | 'liftoff' | 'space' | 'landing';

interface WorldState {
  world: WorldId;
  phase: Phase;
  /** Destination du voyage en cours. */
  target: WorldId | null;
  /** Relecture des trajets : temps courant en sols martiens. */
  sol: number;
  playing: boolean;
  /** Sols par seconde. */
  speed: number;
  /** Machine près du joueur (fiche affichée). */
  near: string | null;
  /** Le joueur est sur le pas de tir. */
  onPad: boolean;
  travelTo: (target: WorldId) => void;
  setPhase: (phase: Phase) => void;
  arrive: (world: WorldId) => void;
  setSol: (sol: number) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (s: number) => void;
  setNear: (id: string | null) => void;
  setOnPad: (v: boolean) => void;
}

export const useWorld = create<WorldState>()((set, get) => ({
  world: 'earth',
  phase: 'drive',
  target: null,
  sol: 0,
  playing: true,
  speed: 12,
  near: null,
  onPad: false,
  travelTo: (target) => {
    if (get().phase !== 'drive' || target === get().world) return;
    set({ target, phase: 'liftoff', near: null, onPad: false });
  },
  setPhase: (phase) => set({ phase }),
  arrive: (world) => set({ world, sol: 0, playing: true }),
  setSol: (sol) => set({ sol }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  setNear: (near) => (get().near === near ? undefined : set({ near })),
  setOnPad: (onPad) => (get().onPad === onPad ? undefined : set({ onPad })),
}));

/** Vaisseau de la cinématique (animé par GSAP) : altitude et intensité de la flamme. */
export const ship = { y: 0, flame: 0, travel: 0 };

/** Commandes de conduite partagées (clavier + boutons tactiles). */
export const drive = { forward: 0, back: 0, left: 0, right: 0, brake: 0 };
