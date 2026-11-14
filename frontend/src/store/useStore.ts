import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChapterId } from '../lib/chapters';

type Language = 'fr' | 'en';

interface AppState {
  language: Language;
  journeyStarted: boolean;
  visitedChapters: ChapterId[];
  /** Machines dont on a écouté l'histoire jusqu'au bout. */
  completedMachines: string[];
  /** Machines dont le quiz est réussi : leur badge est gagné (carnet d'explorateur). */
  badges: string[];
  voiceOn: boolean;
  autoplay: boolean;
  setVoiceOn: (on: boolean) => void;
  setAutoplay: (on: boolean) => void;
  completeMachine: (id: string) => void;
  earnBadge: (id: string) => void;
  setLanguage: (language: Language) => void;
  startJourney: () => void;
  visitChapter: (id: ChapterId) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'fr',
      journeyStarted: false,
      visitedChapters: [],
      completedMachines: [],
      badges: [],
      // Voix activée par défaut : les narrations ElevenLabs sont au cœur de l'expérience.
      voiceOn: true,
      autoplay: false,
      setVoiceOn: (voiceOn) => set({ voiceOn }),
      setAutoplay: (autoplay) => set({ autoplay }),
      completeMachine: (id) =>
        set((s) => (s.completedMachines.includes(id) ? s : { completedMachines: [...s.completedMachines, id] })),
      earnBadge: (id) => set((s) => (s.badges.includes(id) ? s : { badges: [...s.badges, id] })),
      setLanguage: (language) => set({ language }),
      startJourney: () => set({ journeyStarted: true }),
      visitChapter: (id) =>
        set((s) => (s.visitedChapters.includes(id) ? s : { visitedChapters: [...s.visitedChapters, id] })),
    }),
    {
      name: 'veilleurs-progress',
      version: 3,
      // v3 : ajout des badges ; les anciennes sauvegardes repartent avec une liste vide.
      migrate: (state) => ({ badges: [], ...(state as Partial<AppState>) }) as AppState,
    },
  ),
);
