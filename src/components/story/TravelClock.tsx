import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../lib/machines';

function toTime(date: string): number {
  const [y, m = 1, d = 1] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

interface Props {
  /** Dates de début et de fin du tronçon affiché (dates réelles de la mission). */
  from: string;
  to: string;
  /** Avancement de la cinématique en cours (0 → 1). */
  getProgress: () => number;
}

/** Pendant le voyage, la date défile au rythme de la cinématique. */
export function TravelClock({ from, to, getProgress }: Props) {
  const { t, i18n } = useTranslation();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const start = toTime(from);
    const end = toTime(to);
    // Précision affichée : celle de la date la moins précise.
    const parts = Math.min(from.split('-').length, to.split('-').length);
    let raf = 0;
    const tick = () => {
      if (ref.current) {
        const d = new Date(start + (end - start) * Math.min(1, Math.max(0, getProgress())));
        const iso = d.toISOString().slice(0, parts === 3 ? 10 : parts === 2 ? 7 : 4);
        ref.current.textContent = formatDate(iso, i18n.language);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, getProgress, i18n.language]);
  return (
    <div className="pointer-events-none rounded-lg bg-space/70 px-3 py-1.5 text-center ring-1 ring-white/10" aria-hidden="true">
      <p className="text-[10px] uppercase tracking-widest text-slate-400">{t('mission.travel')}</p>
      <span ref={ref} className="font-display text-xl font-extrabold tabular-nums" />
    </div>
  );
}
