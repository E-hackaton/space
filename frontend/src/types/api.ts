/**
 * Types des réponses de l'API Django (backend/heroes/serializers.py).
 * Toute modification côté serializer doit être reportée ici.
 */

export type BodySlug = 'moon' | 'mars' | 'elsewhere'

/** Niveau de fonctionnement actuel d'un engin. */
export type EquipmentStatus = 'active' | 'useful' | 'silent' | 'lost'

export type EquipmentKind =
  | 'lander'
  | 'descent_stage'
  | 'rover'
  | 'helicopter'
  | 'instrument'
  | 'orbiter'
  | 'probe'
  | 'telescope'

/** Date au format ISO « AAAA-MM-JJ », telle que renvoyée par Django. */
export type IsoDate = string

export interface CelestialBody {
  slug: BodySlug
  name: string
  intro: string
  map_image: string | null
  map_credit: string
  equipment_count: number
}

/** Version légère d'un héros (liste de l'Atlas). */
export interface EquipmentSummary {
  slug: string
  name: string
  mission: string
  body: BodySlug
  kind: EquipmentKind
  status: EquipmentStatus
  latitude: number | null
  longitude: number | null
  location: string
  tagline: string
  image: string | null
  image_credit: string
  launch_date: IsoDate | null
  arrival_date: IsoDate | null
  last_contact_date: IsoDate | null
  /** Renseignée seulement quand elle diffère du dernier contact (ex. Eagle, Ingenuity). */
  mission_end_date: IsoDate | null
}

/** Pièce de la machine que la caméra 3D montre pendant une étape. */
export type MachineFocus =
  | 'overview'
  | 'body'
  | 'wheels'
  | 'arm'
  | 'mast'
  | 'panels'
  | 'legs'
  | 'rotor'
  | 'antenna'
  | 'mirror'
  | 'engine'

export type DatePrecision = 'day' | 'month' | 'year'

/** Les six temps du récit d'une mission (concept FORBITS). */
export type StoryPhase = 'conception' | 'launch' | 'arrival' | 'exploration' | 'discovery' | 'legacy'

/** Étape datée de la mission, racontée par la machine. */
export interface StoryChapter {
  order: number
  phase: StoryPhase
  date: IsoDate | null
  date_precision: DatePrecision
  focus: MachineFocus
  title: string
  body: string
  /** URL du MP3 ElevenLabs dans la langue demandée, ou null (repli : voix du navigateur). */
  audio: string | null
}

/** Étape de la visite d'accueil de Sankofa. */
export interface GuideStep {
  key: string
  order: number
  text: string
  audio: string | null
}

export interface QuizQuestion {
  id: number
  question: string
  choices: string[]
  answer_index: number
  explanation: string
}

export interface Source {
  label: string
  url: string
  is_nasa: boolean
}

/** Fiche complète d'un héros. */
export interface EquipmentDetail extends EquipmentSummary {
  nssdca_id: string
  nssdca_url: string
  discovery: string
  status_note: string
  chapters: StoryChapter[]
  quiz: QuizQuestion[]
  sources: Source[]
}
