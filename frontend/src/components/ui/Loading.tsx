import { useTranslation } from 'react-i18next';

/** Écran de chargement : un anneau qui tourne et « Chargement… ». */
export function Loading() {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 bg-space text-slate-200">
      <span className="loader-ring" aria-hidden="true" />
      <p className="font-display text-2xl tracking-wide">{t('chapter.loading')}</p>
    </div>
  );
}
