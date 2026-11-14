/**
 * Forme des réponses de l'API Django (backend/heroes/serializers.py).
 * Les textes arrivent déjà dans la langue demandée (`?lang=fr|en`).
 */

export type ApiBody = 'moon' | 'mars' | 'elsewhere';
export type ApiKind = 'lander' | 'descent_stage' | 'rover' | 'helicopter' | 'instrument' | 'orbiter' | 'probe' | 'telescope';
export type ApiStatus = 'active' | 'useful' | 'silent' | 'lost';
export type ApiPhase = 'conception' | 'launch' | 'arrival' | 'exploration' | 'discovery' | 'legacy';
export type DatePrecision = 'day' | 'month' | 'year';

export interface ApiEquipmentSummary {
  slug: string;
  name: string;
  mission: string;
  body: ApiBody;
  kind: ApiKind;
  status: ApiStatus;
  latitude: number | null;
  longitude: number | null;
  location: string;
  tagline: string;
  launch_date: string | null;
  arrival_date: string | null;
  last_contact_date: string | null;
  mission_end_date: string | null;
}

export interface ApiChapter {
  order: number;
  phase: ApiPhase;
  date: string | null;
  date_precision: DatePrecision;
  title: string;
  body: string;
  /** MP3 ElevenLabs, ou null : le navigateur lit alors le texte. */
  audio: string | null;
}

export interface ApiQuizQuestion {
  id: number;
  question: string;
  choices: string[];
  answer_index: number;
  explanation: string;
}

export interface ApiSource {
  label: string;
  url: string;
  is_nasa: boolean;
}

export interface ApiEquipmentDetail extends ApiEquipmentSummary {
  nssdca_url: string;
  discovery: string;
  status_note: string;
  presentation: { title: string; body: string; audio: string | null };
  chapters: ApiChapter[];
  quiz: ApiQuizQuestion[];
  sources: ApiSource[];
}
