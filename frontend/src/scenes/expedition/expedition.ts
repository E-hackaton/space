import { create } from 'zustand';
import type { Phase, StoryEffect } from '../../lib/machines';

/*
 * Expédition au sol d'un astre : on roule de machine en machine avec le véhicule de parcours.
 * - Pilote automatique : Sankofa conduit, raconte chaque machine, puis repart vers la suivante.
 * - Pilote manuel : le joueur conduit (flèches) et se sert de la minicarte pour trouver les objets.
 */

export type GuideMode = 'auto' | 'manual';

interface ExpeditionState {
  mode: GuideMode;
  /** Prochaine machine visée (pilote auto) ou balise posée sur la carte (manuel). */
  target: string | null;
  /** Machine tout près du véhicule (assez près pour écouter son histoire). */
  near: string | null;
  /** Machine dont l'histoire est racontée. */
  story: string | null;
  /** Étape du récit en cours, son effet spécial et son temps du récit. */
  step: number;
  effect?: StoryEffect;
  phase?: Phase;
  /** Machines retrouvées pendant cette expédition. */
  found: string[];
  setMode: (m: GuideMode) => void;
  setTarget: (id: string | null) => void;
  setNear: (id: string | null) => void;
  openStory: (id: string) => void;
  closeStory: () => void;
  setStep: (step: number, effect?: StoryEffect, phase?: Phase) => void;
  reset: () => void;
}

export const useExpedition = create<ExpeditionState>()((set, get) => ({
  mode: 'auto',
  target: null,
  near: null,
  story: null,
  step: 0,
  found: [],
  setMode: (mode) => set({ mode }),
  setTarget: (target) => set({ target }),
  setNear: (near) => (get().near === near ? undefined : set({ near })),
  openStory: (id) => set((s) => ({ story: id, step: 0, effect: undefined, phase: undefined, found: s.found.includes(id) ? s.found : [...s.found, id] })),
  closeStory: () => set({ story: null, effect: undefined, phase: undefined }),
  setStep: (step, effect, phase) => set({ step, effect, phase }),
  reset: () => set({ target: null, near: null, story: null, step: 0, found: [], effect: undefined, phase: undefined }),
}));

