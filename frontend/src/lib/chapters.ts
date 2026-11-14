import chaptersData from '../content/chapters.json';

export type ChapterId = 'earth' | 'moon' | 'mars' | 'deep-space';

export interface Chapter {
  id: ChapterId;
  order: number;
  titleKey: string;
  teaserKey: string;
  color: string;
}

export const chapters = (chaptersData as Chapter[]).slice().sort((a, b) => a.order - b.order);

export function getChapter(id: string | undefined): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

/** Un chapitre est débloqué si c'est le premier ou si le précédent a été visité. */
export function isUnlocked(id: ChapterId, visited: ChapterId[]): boolean {
  const index = chapters.findIndex((c) => c.id === id);
  if (index <= 0) return true;
  return visited.includes(chapters[index - 1].id);
}
