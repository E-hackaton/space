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
  voiceOn: boolean;
  autoplay: boolean;
  setVoiceOn: (on: boolean) => void;
  setAutoplay: (on: boolean) => void;
  completeMachine: (id: string) => void;
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
      voiceOn: false,
      autoplay: false,
      setVoiceOn: (voiceOn) => set({ voiceOn }),
      setAutoplay: (autoplay) => set({ autoplay }),
      completeMachine: (id) =>
        set((s) => (s.completedMachines.includes(id) ? s : { completedMachines: [...s.completedMachines, id] })),
      setLanguage: (language) => set({ language }),
      startJourney: () => set({ journeyStarted: true }),
      visitChapter: (id) =>
        set((s) => (s.visitedChapters.includes(id) ? s : { visitedChapters: [...s.visitedChapters, id] })),
    }),
    { name: 'veilleurs-progress', version: 2, migrate: (state) => state as AppState },
  ),
);
