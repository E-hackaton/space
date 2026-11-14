import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-4xl font-extrabold uppercase">{t('notFound.title')}</h1>
      <p className="mt-3">{t('notFound.text')}</p>
      <Link to="/" className="mt-6 inline-block underline">{t('notFound.home')}</Link>
    </section>
  );
}
