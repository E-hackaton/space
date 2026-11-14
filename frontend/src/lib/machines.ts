import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { fetchEquipment, fetchEquipmentList } from '../api/client';
import type { ApiBody, ApiEquipmentDetail, ApiEquipmentSummary, ApiKind, ApiPhase, ApiQuizQuestion, ApiSource, DatePrecision } from '../api/types';
import { DEFAULT_STAGING, STAGING } from '../content/staging';
import { partsForKind, partsFromLabels, type AnatomyPart } from '../content/anatomy';
import modelsData from '../content/models.json';
import type { ModelId } from '../components/3d/NasaModel';
import { useStore } from '../store/useStore';
import type { BodyId } from './solarSystem';

/*
 * Les machines du jeu.
 *
 * Le contenu vient de l'API Django (récits, quiz, sources, voix ElevenLabs) ; la mise en scène
 * (jauges, effets, modèles 3D) vient de content/staging.ts. Ce module assemble les deux dans la
 * forme qu'attendent la cinématique (MissionDirector) et l'interface.
 */

export type Status = 'active' | 'dormant';
export type Fate = 'active' | 'dormant' | 'destroyed' | 'impact';
export type MachineKind = 'rover' | 'helicopter' | 'lander' | 'reflector' | 'orbiter' | 'probe';
/** Temps du récit vus par la cinématique. `conception` : la machine est encore sur Terre. */
export type Phase = 'conception' | 'launch' | 'cruise' | 'arrival' | 'work' | 'discovery' | 'decline' | 'end';
export type StoryEffect = 'laser' | 'dust-storm' | 'flight';

export interface Vital {
  label: string;
  start: number;
  end: number;
  unit: string;
}

export interface StoryStep {
  phase: Phase;
  title: string;
  text: string;
  /** Date partielle : « 2004 », « 2004-01 » ou « 2004-01-25 ». */
  date?: string;
  effect?: StoryEffect;
  /** Narration ElevenLabs ; sans elle, le navigateur lit le texte. */
  audio: string | null;
}

/** Ce qu'il faut pour lister une machine et la placer sur un astre. */
export interface MachineSummary {
  id: string;
  name: string;
  mission: string;
  body: BodyId;
  kind: MachineKind;
  lat?: number;
  lon?: number;
  location: string;
  tagline: string;
  launchDate?: string;
  arrivalDate?: string;
  endDate?: string;
  status: Status;
  fate: Fate;
  model?: ModelId;
}

/** Une machine complète, prête pour sa mission. */
export interface Machine extends MachineSummary {
  cruise?: BodyId[];
  vitals: Vital[];
  story: StoryStep[];
  discovery: string;
  statusNote: string;
  nssdcaUrl: string;
  quiz: ApiQuizQuestion[];
  sources: ApiSource[];
  /** Pièces à expliquer : les étiquettes du modèle NASA s'il en a, sinon celles de la mise en scène. */
  anatomy: AnatomyPart[];
}

/** Étiquettes 3D de chaque modèle NASA (lues dans le JSON pour ne pas charger three.js ici). */
const MODEL_LABELS = Object.fromEntries(
  Object.entries(modelsData)
    .filter(([id]) => id !== '_note')
    .map(([id, info]) => [id, (info as { annotations: { key: string }[] }).annotations.map((a) => a.key)]),
) as Record<string, string[]>;

// --- Conversion API → jeu ---------------------------------------------------

const BODY: Record<ApiBody, BodyId> = { moon: 'moon', mars: 'mars', elsewhere: 'deep-space' };

const KIND: Record<ApiKind, MachineKind> = {
  lander: 'lander',
  descent_stage: 'lander',
  rover: 'rover',
  helicopter: 'helicopter',
  instrument: 'lander',
  orbiter: 'orbiter',
  probe: 'probe',
  telescope: 'orbiter',
};

const PHASE: Record<ApiPhase, Phase> = {
  conception: 'conception',
  launch: 'launch',
  arrival: 'arrival',
  exploration: 'work',
  discovery: 'discovery',
  legacy: 'end',
};

function partialDate(date: string | null, precision: DatePrecision = 'day'): string | undefined {
  if (!date) return undefined;
  return precision === 'year' ? date.slice(0, 4) : precision === 'month' ? date.slice(0, 7) : date;
}

function toSummary(api: ApiEquipmentSummary): MachineSummary {
  const staging = STAGING[api.slug] ?? DEFAULT_STAGING;
  // « Encore utile » (le réflecteur laser) compte comme actif : il sert toujours.
  const active = api.status === 'active' || api.status === 'useful';
  return {
    id: api.slug,
    name: api.name,
    mission: api.mission,
    body: BODY[api.body],
    kind: staging.kind ?? KIND[api.kind],
    lat: api.latitude ?? undefined,
    lon: api.longitude ?? undefined,
    location: api.location,
    tagline: api.tagline,
    launchDate: api.launch_date ?? undefined,
    arrivalDate: api.arrival_date ?? undefined,
    endDate: api.mission_end_date ?? api.last_contact_date ?? undefined,
    status: active ? 'active' : 'dormant',
    fate: active ? 'active' : 'dormant',
    model: staging.model,
  };
}

function toMachine(api: ApiEquipmentDetail): Machine {
  const staging = STAGING[api.slug] ?? DEFAULT_STAGING;
  // Première étape : la machine se présente (« Bonjour, je suis… »), avec sa voix.
  const presentation: StoryStep = {
    phase: 'conception',
    title: api.presentation.title,
    text: `${api.presentation.title} ${api.presentation.body}`,
    audio: api.presentation.audio,
  };
  const chapters = api.chapters.map<StoryStep>((chapter) => ({
    phase: PHASE[chapter.phase],
    title: chapter.title,
    text: chapter.body,
    date: partialDate(chapter.date, chapter.date_precision),
    effect: staging.effects?.[chapter.phase],
    audio: chapter.audio,
  }));
  const summary = toSummary(api);
  const labels = summary.model ? (MODEL_LABELS[summary.model] ?? []) : [];
  return {
    ...summary,
    anatomy: labels.length ? partsFromLabels(labels) : partsForKind(summary.kind, staging.anatomy),
    cruise: staging.cruise,
    vitals: staging.vitals,
    story: [presentation, ...chapters],
    discovery: api.discovery,
    statusNote: api.status_note,
    nssdcaUrl: api.nssdca_url,
    quiz: api.quiz,
    sources: api.sources,
  };
}

// --- Catalogue (liste des machines), chargé une fois par langue --------------

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CatalogState {
  lang: string | null;
  status: LoadStatus;
  machines: MachineSummary[];
  load: (lang: string) => void;
}

const useCatalogStore = create<CatalogState>()((set, get) => ({
  lang: null,
  status: 'idle',
  machines: [],
  load: (lang) => {
    if (get().lang === lang && get().status !== 'error') return;
    set({ lang, status: 'loading' });
    fetchEquipmentList(lang)
      .then((list) => {
        if (get().lang === lang) set({ status: 'ready', machines: list.map(toSummary) });
      })
      .catch(() => {
        if (get().lang === lang) set({ status: 'error' });
      });
  },
}));

/** Toutes les machines, dans la langue courante (chargées à la demande). */
export function useCatalog(): { status: LoadStatus; machines: MachineSummary[] } {
  const language = useStore((s) => s.language);
  const status = useCatalogStore((s) => s.status);
  const machines = useCatalogStore((s) => s.machines);
  const load = useCatalogStore((s) => s.load);
  useEffect(() => load(language), [language, load]);
  return { status, machines };
}

export function machinesOn(machines: MachineSummary[], body: BodyId): MachineSummary[] {
  return machines.filter((m) => m.body === body);
}

// --- Fiche complète d'une machine ---------------------------------------------

const detailCache = new Map<string, Machine>();

/** Charge la fiche complète d'une machine (récit, quiz, sources, voix) dans la langue courante. */
export function useMachine(slug: string | null): { status: LoadStatus; machine?: Machine } {
  const language = useStore((s) => s.language);
  const key = slug ? `${language}:${slug}` : null;
  const [state, setState] = useState<{ key: string | null; status: LoadStatus; machine?: Machine }>({ key: null, status: 'idle' });

  useEffect(() => {
    if (!slug || !key) return;
    const cached = detailCache.get(key);
    if (cached) {
      setState({ key, status: 'ready', machine: cached });
      return;
    }
    let cancelled = false;
    setState({ key, status: 'loading' });
    fetchEquipment(slug, language)
      .then((api) => {
        const machine = toMachine(api);
        detailCache.set(key, machine);
        if (!cancelled) setState({ key, status: 'ready', machine });
      })
      .catch(() => !cancelled && setState({ key, status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [slug, key, language]);

  if (!slug) return { status: 'idle' };
  // Tant que la nouvelle fiche n'est pas là, on n'expose pas l'ancienne (autre machine ou autre langue).
  if (state.key !== key) return { status: 'loading' };
  return { status: state.status, machine: state.machine };
}

/** Charge toutes les fiches (page Sources). */
export async function fetchAllMachines(slugs: string[], lang: string): Promise<Machine[]> {
  return Promise.all(slugs.map((slug) => fetchEquipment(slug, lang).then(toMachine)));
}

// --- Utilitaires ----------------------------------------------------------------

/** Les machines se posent-elles à la surface (et non en orbite ou en survol) ? */
export function landsOnSurface(m: MachineSummary): boolean {
  return m.kind === 'rover' || m.kind === 'helicopter' || m.kind === 'lander' || m.kind === 'reflector';
}

/** Formate une date partielle (« 2004 », « 2004-01 », « 2004-01-25 ») selon la langue. */
export function formatDate(date: string, lang: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  if (!m) return String(y);
  const dt = new Date(Date.UTC(y, m - 1, d || 1));
  return dt.toLocaleDateString(
    locale,
    d ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' },
  );
}
