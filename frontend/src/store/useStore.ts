import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChapterId } from '../lib/chapters';

type Language = 'fr' | 'en';
export type Theme = 'system' | 'light' | 'dark';
export type Motion = 'system' | 'reduce' | 'full';
export type Quality = 'auto' | 'high' | 'low';
export type SubtitleSize = 'normal' | 'large';

/** Couleurs proposées pour le rover de parcours (carrosserie, toit). */
export const ROVER_COLORS = {
  lagon: { body: '#f4f6fa', accent: '#21b3a8' },
  soleil: { body: '#f4f6fa', accent: '#f2a03d' },
  corail: { body: '#f7f2ee', accent: '#e8574a' },
  nuit: { body: '#2d3446', accent: '#4be08a' },
  sable: { body: '#efe3cc', accent: '#9a6b3c' },
  lilas: { body: '#f2f0f8', accent: '#8b6ce6' },
} as const;
export type RoverColor = keyof typeof ROVER_COLORS;

interface AppState {
  language: Language;
  journeyStarted: boolean;
  visitedChapters: ChapterId[];
  /** Machines dont on a écouté l'histoire jusqu'au bout. */
  completedMachines: string[];
  /** Machines dont le quiz est réussi : leur badge est gagné (carnet d'explorateur). */
  badges: string[];
  voiceOn: boolean;
  /** Effets sonores (moteurs, fusée, détection). */
  sfxOn: boolean;
  setSfxOn: (on: boolean) => void;
  autoplay: boolean;
  setVoiceOn: (on: boolean) => void;
  setAutoplay: (on: boolean) => void;
  completeMachine: (id: string) => void;
  earnBadge: (id: string) => void;
  setLanguage: (language: Language) => void;
  startJourney: () => void;
  visitChapter: (id: ChapterId) => void;
  /** Réglages (onglet Paramètres). */
  theme: Theme;
  voiceName: string | null;
  voiceRate: number;
  sfxVolume: number;
  roverColor: RoverColor;
  subtitleSize: SubtitleSize;
  motion: Motion;
  quality: Quality;
  setPrefs: (p: Partial<Pick<AppState, 'theme' | 'voiceName' | 'voiceRate' | 'sfxVolume' | 'roverColor' | 'subtitleSize' | 'motion' | 'quality'>>) => void;
  resetProgress: () => void;
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
      sfxOn: true,
      setSfxOn: (sfxOn) => set({ sfxOn }),
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
      theme: 'system',
      voiceName: null,
      voiceRate: 0.97,
      sfxVolume: 1,
      roverColor: 'lagon',
      subtitleSize: 'normal',
      motion: 'system',
      quality: 'auto',
      setPrefs: (p) => set(p),
      resetProgress: () => set({ journeyStarted: false, visitedChapters: [], completedMachines: [], badges: [] }),
    }),
    {
      name: 'veilleurs-progress',
      version: 4,
      // v3 : badges ; v4 : réglages (thème, voix, couleur du rover…). Valeurs par défaut pour les anciennes sauvegardes.
      migrate: (state) =>
        ({
          badges: [],
          sfxOn: true,
          theme: 'system',
          voiceName: null,
          voiceRate: 0.97,
          sfxVolume: 1,
          roverColor: 'lagon',
          subtitleSize: 'normal',
          motion: 'system',
          quality: 'auto',
          ...(state as Partial<AppState>),
        }) as AppState,
    },
  ),
);
