import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatusPill } from '../components/story/StatusPill';
import { useCatalog } from '../lib/machines';
import { useStore } from '../store/useStore';
import { MedalGlyph } from '../components/ui/Glyphs';

/** Carnet d'explorateur : les machines rencontrées et les badges gagnés aux quiz. */
export default function Logbook() {
  const { t } = useTranslation();
  const { machines, status } = useCatalog();
  const badges = useStore((s) => s.badges);
  const heard = useStore((s) => s.completedMachines);
  const earned = machines.filter((m) => badges.includes(m.id)).length;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">{t('logbook.title')}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{t('logbook.intro')}</p>
      {status === 'ready' && <p className="mt-2 font-semibold">{t('logbook.progress', { earned, total: machines.length })}</p>}
      {status === 'error' && <p role="alert" className="mt-6 text-red-500">{t('errors.api')}</p>}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {machines.map((m) => {
          const hasBadge = badges.includes(m.id);
          return (
            <li key={m.id} className={`rounded-xl p-4 ring-1 ${hasBadge ? 'bg-active/10 ring-active/50' : 'ring-slate-300 dark:ring-white/15'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-xl font-extrabold uppercase">
                  {hasBadge && <MedalGlyph size={20} />} 
                  {m.name}
                </p>
                <StatusPill active={m.status === 'active'} />
              </div>
              <p className="text-xs text-slate-500">
                {m.mission} · {t(`bodies.${m.body}.name`)}
              </p>
              <p className="mt-2 text-sm">
                {hasBadge ? t('badges.earned') : heard.includes(m.id) ? t('logbook.heard') : t('logbook.toDiscover')}
              </p>
              <Link to={`/mission?astre=${m.body}&machine=${m.id}`} className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-active">
                {t('logbook.open')} →
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
