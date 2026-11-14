import { useTranslation } from 'react-i18next';
import type { Machine } from '../../lib/machines';

/** Constantes vitales du robot, qui évoluent au fil du récit. */
export function VitalsPanel({ machine, progress }: { machine: Machine; progress: number }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl bg-space/80 p-3 ring-1 ring-white/10 backdrop-blur">
      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-slate-300">{t('mission.vitalsTitle')}</p>
      <ul className="mt-2 space-y-2">
        {machine.vitals.map((vital) => {
          const value = Math.round(vital.start + (vital.end - vital.start) * progress);
          // Une jauge « mauvaise quand elle monte » (poussière, chaleur, radiations) change de sens de couleur.
          const worseWhenHigh = vital.end > vital.start && !['vitals.map'].includes(vital.label);
          const health = worseWhenHigh ? 100 - value : value;
          const color = health > 50 ? 'bg-active' : health > 20 ? 'bg-dormant' : 'bg-red-400';
          return (
            <li key={vital.label}>
              <div className="flex justify-between text-xs text-slate-200">
                <span>{t(vital.label)}</span>
                <span className="tabular-nums">
                  {value} {vital.unit}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={t(vital.label)}>
                <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">{t('mission.vitalsNote')}</p>
    </div>
  );
}
