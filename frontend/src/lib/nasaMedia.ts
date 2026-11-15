/*
 * Médias réels de la NASA (images.nasa.gov, API publique sans clé) pour la Galerie.
 * Une recherche choisie par machine ; résultats gardés en mémoire pendant la visite.
 * Les médias de la NASA sont en général libres de réutilisation : chacun est crédité.
 */

export type MediaKind = 'image' | 'video' | 'figure' | 'diagram';

export interface MediaItem {
  id: string;
  machine: string;
  kind: MediaKind;
  title: string;
  date?: string;
  credit: string;
  thumb: string;
  /** Fichier local (figure, schéma) ; pour la NASA, résolu à l'ouverture. */
  src?: string;
  /** Fiche de la NASA (images.nasa.gov). */
  page?: string;
  nasaId?: string;
}

/** Recherche par machine : des termes précis pour éviter les résultats hors sujet. */
export const NASA_QUERIES: Record<string, string> = {
  'surveyor-3': 'Surveyor 3',
  'apollo-11-eagle': 'Apollo 11 lunar module Eagle',
  'apollo-15-lrv': 'Apollo 15 lunar roving vehicle',
  'apollo-15-retroreflector': 'Apollo 15 laser ranging retroreflector',
  'viking-1': 'Viking 1 lander',
  sojourner: 'Sojourner rover',
  opportunity: 'Opportunity rover',
  curiosity: 'Curiosity rover',
  insight: 'InSight lander',
  ingenuity: 'Ingenuity helicopter',
  perseverance: 'Perseverance rover',
};

const API = 'https://images-api.nasa.gov';
const cache = new Map<string, Promise<unknown>>();
const getJson = <T,>(url: string, signal?: AbortSignal) => {
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url, { signal }).then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      }),
    );
  const p = cache.get(url)!;
  p.catch(() => cache.delete(url));
  return p as Promise<T>;
};
const https = (u: string) => u.replace(/^http:\/\//, 'https://');

interface SearchResponse {
  collection: { items: { data: { nasa_id: string; title: string; date_created?: string; center?: string; media_type: string; secondary_creator?: string }[]; links?: { href: string; rel?: string }[] }[] };
}

/** Photos et vidéos de la NASA pour une machine. */
export async function searchNasa(machine: string, signal?: AbortSignal): Promise<MediaItem[]> {
  const q = NASA_QUERIES[machine];
  if (!q) return [];
  const res = await getJson<SearchResponse>(`${API}/search?q=${encodeURIComponent(q)}&media_type=image,video&page_size=12`, signal);
  return res.collection.items
    .map((it): MediaItem | null => {
      const d = it.data[0];
      const thumb = it.links?.find((l) => l.rel === 'preview')?.href ?? it.links?.[0]?.href;
      if (!d || !thumb || (d.media_type !== 'image' && d.media_type !== 'video')) return null;
      return {
        id: `nasa-${d.nasa_id}`,
        machine,
        kind: d.media_type as 'image' | 'video',
        title: d.title,
        date: d.date_created?.slice(0, 10),
        credit: ['NASA', d.center, d.secondary_creator].filter(Boolean).join(' · '),
        thumb: https(thumb),
        page: `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id)}`,
        nasaId: d.nasa_id,
      };
    })
    .filter((x): x is MediaItem => !!x);
}

/** Fichier à afficher en grand : la plus grande image raisonnable, ou la vidéo MP4 légère. */
export async function resolveMedia(item: MediaItem): Promise<string> {
  if (item.src) return item.src;
  if (!item.nasaId) return item.thumb;
  const res = await getJson<{ collection: { items: { href: string }[] } }>(`${API}/asset/${encodeURIComponent(item.nasaId)}`);
  const hrefs = res.collection.items.map((i) => https(i.href));
  const pick = (...ends: string[]) => ends.map((e) => hrefs.find((h) => h.toLowerCase().endsWith(e))).find(Boolean);
  return (item.kind === 'video' ? pick('~mobile.mp4', '~medium.mp4', '~small.mp4', '.mp4') : pick('~large.jpg', '~medium.jpg', '~orig.jpg', '.jpg', '.png')) ?? item.thumb;
}

/** Médias du projet (hors ligne) : figures 3D interactives et schémas NASA annotés de docs/mars1. */
export const LOCAL_DIAGRAMS: Record<string, { src: string; title: string }[]> = {
  ingenuity: [{ src: '/galerie/01-ingenuity.jpeg', title: 'Ingenuity' }],
  insight: [
    { src: '/galerie/02-insight.jpeg', title: 'InSight' },
    { src: '/galerie/02-insight-schema.jpeg', title: 'InSight' },
  ],
  sojourner: [{ src: '/galerie/03-sojourner.jpeg', title: 'Sojourner' }],
  'viking-1': [{ src: '/galerie/04-viking.jpeg', title: 'Viking' }],
  opportunity: [{ src: '/galerie/05-opportunity.jpeg', title: 'Opportunity' }],
};
