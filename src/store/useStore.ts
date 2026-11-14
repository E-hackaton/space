import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChapterId } from '../lib/chapters';

type Language = 'fr' | 'en';

interface AppState {
  language: Language;
  journeyStarted: boolean;
  visitedChapters: ChapterId[];
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
      setLanguage: (language) => set({ language }),
      startJourney: () => set({ journeyStarted: true }),
      visitChapter: (id) =>
        set((s) => (s.visitedChapters.includes(id) ? s : { visitedChapters: [...s.visitedChapters, id] })),
    }),
    { name: 'veilleurs-progress', version: 1 },
  ),
);
