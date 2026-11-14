import type { BodyId } from './solarSystem';

export type Status = 'active' | 'dormant';
export type Fate = 'active' | 'dormant' | 'destroyed' | 'impact';
export type MachineKind = 'rover' | 'helicopter' | 'lander' | 'reflector' | 'orbiter' | 'probe';
export type Phase = 'launch' | 'cruise' | 'arrival' | 'work' | 'discovery' | 'decline' | 'end';
export type StoryEffect = 'laser' | 'dust-storm' | 'flight';

export interface StoryStep {
  textKey: string;
  phase: Phase;
  /** Date affichée (ISO, ou année, ou année-mois). */
  date?: string;
  effect?: StoryEffect;
  audio?: string;
  subtitles?: string;
  panelImage?: string;
}

export interface Machine {
  id: string;
  name: string;
  mission: string;
  body: BodyId;
  kind: MachineKind;
  lat?: number;
  lon?: number;
  latLonNote?: string;
  /** Astres survolés en chemin (ex. Voyager : Jupiter puis Saturne). */
  cruise?: BodyId[];
  launchDate: string;
  arrivalDate?: string;
  endDate?: string;
  status: Status;
  fate: Fate;
  vitals: { label: string; start: number; end: number; unit: string }[];
  story: StoryStep[];
  neighbours?: string;
  earthImpact: string;
  realPhoto?: { src: string; credit: string; source: string };
  model3d?: { src: string; credit: string; source: string };
  quiz: { question: string; options: string[]; answer: number; explanation: string }[];
  sources: { label: string; url: string }[];
  verified: boolean;
}

const modules = import.meta.glob<Machine>('../content/machines/*.json', { eager: true, import: 'default' });

export const machines: Machine[] = Object.values(modules).sort((a, b) => a.launchDate.localeCompare(b.launchDate));

export function getMachine(id: string | null | undefined): Machine | undefined {
  return machines.find((m) => m.id === id);
}

export function machinesOn(body: BodyId): Machine[] {
  return machines.filter((m) => m.body === body);
}

/** Les machines se posent-elles à la surface (et non en orbite ou en survol) ? */
export function landsOnSurface(m: Machine): boolean {
  return m.kind === 'rover' || m.kind === 'helicopter' || m.kind === 'lander' || m.kind === 'reflector';
}

/** Formate une date partielle (« 2004 », « 2004-01 », « 2004-01-25 ») selon la langue. */
export function formatDate(date: string, lang: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  if (!m) return String(y);
  const dt = new Date(Date.UTC(y, m - 1, d || 1));
  return dt.toLocaleDateString(locale, d ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
