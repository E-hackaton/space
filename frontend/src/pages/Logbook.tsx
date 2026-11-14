import { useEffect, useMemo, useId } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { SankofaAvatar } from '../components/guide/SankofaAvatar';
import { SpeechText } from '../components/guide/SpeechText';
import { MedalGlyph, PlanetGlyph } from '../components/ui/Glyphs';
import { machinesOn, useCatalog } from '../lib/machines';
import { speak } from '../audio/speech';
import { useStore } from '../store/useStore';

const BODIES = ['moon', 'mars', 'deep-space'] as const;

/** Anneau de progression en volume. */
function Ring({ value, total }: { value: number; total: number }) {
  const id = useId().replace(/:/g, '');
  const r = 52;
  const c = 2 * Math.PI * r;
  const k = total ? value / total : 0;
  return (
    <svg width="150" height="150" viewBox="0 0 140 140" aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bfffd9" />
          <stop offset="60%" stopColor="#4BE08A" />
          <stop offset="100%" stopColor="#1f9a57" />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#0e1630" strokeWidth="14" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="14" transform="translate(0 2)" />
      <motion.circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke={`url(#g${id})`}
        strokeWidth="14"
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - k) }}
        transition={{ duration: 1.6, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ filter: 'drop-shadow(0 0 8px rgba(75,224,138,.6))' }}
      />
      <text x="70" y="78" textAnchor="middle" className="fill-white font-display" fontSize="30" fontWeight="800">
        {value}/{total}
      </text>
    </svg>
  );
}

/** Carnet d'explorateur : ce que tu as retrouvé, raconté par Sankofa. */
export default function Logbook() {
  const { t, i18n } = useTranslation();
  const { machines, status } = useCatalog();
  const badges = useStore((s) => s.badges);
  const heard = useStore((s) => s.completedMachines);
  const voiceOn = useStore((s) => s.voiceOn);
  const found = machines.filter((m) => heard.includes(m.id)).length;
  const earned = machines.filter((m) => badges.includes(m.id)).length;

  // La phrase de Sankofa : où en est l'explorateur, et où aller ensuite.
  const line = useMemo(() => {
    if (!machines.length) return '';
    const next = BODIES.map((b) => ({ b, left: machinesOn(machines, b).filter((m) => !heard.includes(m.id)).length })).find((x) => x.left > 0);
    const base = t('carnet.summary', { found, total: machines.length, count: earned });
    return next ? `${base} ${t('carnet.next', { count: next.left, body: t(`bodies.${next.b}.name`) })}` : `${base} ${t('carnet.done')}`;
  }, [machines, heard, found, earned, t]);
  useEffect(() => {
    if (line && voiceOn) speak(line, i18n.language);
  }, [line]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="relative flex-1 overflow-hidden bg-space px-4 py-10 text-white">
      <div className="living-bg" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-6">
          <Ring value={found} total={machines.length} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-5xl font-extrabold uppercase tracking-wide">{t('logbook.title')}</h1>
            <div className="mt-2 flex items-start gap-3">
              <SankofaAvatar size={56} talking />
              {line && <SpeechText text={line} className="max-w-xl text-lg text-slate-100" />}
            </div>
          </div>
        </div>
        {status === 'error' && <p role="alert" className="mt-6 text-red-400">{t('errors.api')}</p>}

        {BODIES.map((b, bi) => {
          const list = machinesOn(machines, b);
          if (!list.length) return null;
          return (
            <motion.div key={b} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: bi * 0.1 }} className="mt-12">
              <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold uppercase tracking-wider">
                <PlanetGlyph body={b} size={44} /> {t(`bodies.${b}.name`)}
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
                {list.map((m, i) => {
                  const isFound = heard.includes(m.id);
                  const badge = badges.includes(m.id);
                  return (
                    <motion.li key={m.id} initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 120 }}>
                      <Link
                        to={`/mission?astre=${b}&mode=auto&machine=${m.id}`}
                        className={`medallion ${badge ? 'medallion-badge' : isFound ? 'medallion-found' : 'medallion-unknown'}`}
                        aria-label={`${m.name} · ${badge ? t('badges.earned') : isFound ? t('logbook.heard') : t('logbook.toDiscover')}`}
                      >
                        <span className="medallion-disc">{badge ? <MedalGlyph size={46} /> : isFound ? <span className="medallion-check">✓</span> : <span className="medallion-q">?</span>}</span>
                        <span className="medallion-name">{m.name}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
