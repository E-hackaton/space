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

export interface StoryChapter {
  order: number
  title: string
  body: string
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
