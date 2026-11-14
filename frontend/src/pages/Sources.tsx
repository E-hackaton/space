import { useTranslation } from 'react-i18next';

export default function Sources() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">{t('sources.title')}</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300">{t('sources.intro')}</p>
    </section>
  );
}
