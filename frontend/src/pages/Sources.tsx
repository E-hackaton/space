import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import credits from '../content/credits.json';
import { fetchAllMachines, useCatalog, type Machine } from '../lib/machines';
import { useStore } from '../store/useStore';

interface Credit {
  file: string;
  what: string;
  credit: string;
  source: string;
}

/** Toutes les références : celles de chaque machine (API), puis les données et modèles 3D du jeu. */
export default function Sources() {
  const { t } = useTranslation();
  const language = useStore((s) => s.language);
  const catalog = useCatalog();
  const [machines, setMachines] = useState<Machine[] | null>(null);
  const [failed, setFailed] = useState(false);
  const slugs = catalog.machines.map((m) => m.id).join(',');

  useEffect(() => {
    if (!slugs) return;
    let cancelled = false;
    fetchAllMachines(slugs.split(','), language)
      .then((list) => !cancelled && setMachines(list))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slugs, language]);

  const assetCredits = Object.values(credits).flat() as Credit[];

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">{t('sources.title')}</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300">{t('sources.intro')}</p>

      {(failed || catalog.status === 'error') && <p role="alert" className="mt-6 text-red-500">{t('errors.api')}</p>}
      {!machines && !failed && <p className="mt-6 text-slate-500">{t('chapter.loading')}</p>}

      {machines?.map((machine) => (
        <section key={machine.id} className="mt-8">
          <h2 className="font-display text-2xl font-extrabold uppercase">{machine.name}</h2>
          <p className="text-sm text-slate-500">{machine.mission}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {machine.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer" className="text-sky-700 underline underline-offset-2 dark:text-sky-300">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold uppercase">{t('sources.data')}</h2>
        <ul className="mt-2 space-y-3">
          {assetCredits.map((item) => (
            <li key={item.file} className="text-sm">
              <p className="font-semibold">{item.what}</p>
              <p className="text-slate-500">
                {item.credit}
                {item.source.startsWith('http') && (
                  <>
                    {' · '}
                    <a href={item.source} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                      {item.source}
                    </a>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
