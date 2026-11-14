import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import gsap from 'gsap';
import { Loading } from '../components/ui/Loading';
import { OrbiAvatar } from '../components/guide/OrbiAvatar';
import { StatusPill } from '../components/story/StatusPill';
import { webglAvailable } from '../lib/device';
import { usePrefersReducedMotion } from '../lib/hooks';
import { drive, ship, useWorld, type WorldId } from '../world/state';
import { useKeyboardDrive } from '../world/useKeyboardDrive';
import { distanceKm, replay } from '../world/Replay';
import { useSiteData } from '../world/worlds/MarsWorld';
import { laser } from '../world/worlds/MoonWorld';

const ExplorerCanvas = lazy(() => import('../world/ExplorerCanvas'));

const WORLD_ICON: Record<WorldId, string> = { earth: '🌍', moon: '🌙', jezero: '🔴', gale: '🔴' };

/** Boutons de conduite tactiles (téléphones et tablettes). */
function TouchPad() {
  const btn = (key: keyof typeof drive, label: string, cls: string) => (
    <button
      type="button"
      aria-label={label}
      className={`pointer-events-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-2xl text-white ring-1 ring-white/30 backdrop-blur active:bg-white/35 ${cls}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drive[key] = 1;
      }}
      onPointerUp={() => (drive[key] = 0)}
      onPointerCancel={() => (drive[key] = 0)}
    >
      {label}
    </button>
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-30 flex justify-between px-4 sm:hidden">
      <div className="flex gap-2">
        {btn('left', '◀', '')}
        {btn('right', '▶', '')}
      </div>
      <div className="flex flex-col gap-2">
        {btn('forward', '▲', '')}
        {btn('back', '▼', '')}
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const world = useWorld((s) => s.world);
  const phase = useWorld((s) => s.phase);
  const target = useWorld((s) => s.target);
  const onPad = useWorld((s) => s.onPad);
  const near = useWorld((s) => s.near);
  const sol = useWorld((s) => s.sol);
  const playing = useWorld((s) => s.playing);
  const speed = useWorld((s) => s.speed);
  const travelTo = useWorld((s) => s.travelTo);
  const [chooser, setChooser] = useState(false);
  const flash = useRef<HTMLDivElement>(null);
  const site = world === 'jezero' || world === 'gale' ? world : null;
  const siteData = useSiteData(site ?? 'jezero');

  useKeyboardDrive(phase === 'drive');

  // Voyage : décollage → espace → atterrissage, animé avec GSAP.
  useEffect(() => {
    const k = reduced ? 0.15 : 1;
    const st = useWorld.getState();
    const white = (on: boolean, d = 0.35) => flash.current && gsap.to(flash.current, { opacity: on ? 1 : 0, duration: d * k });
    let tl: gsap.core.Timeline | null = null;
    if (phase === 'liftoff') {
      ship.y = 0;
      tl = gsap
        .timeline()
        .to(ship, { flame: 1, duration: 0.5 * k })
        .to(ship, { y: 110, duration: 3.4 * k, ease: 'power2.in' })
        .add(() => white(true), `-=${0.5 * k}`)
        .add(() => {
          ship.travel = 0;
          st.setPhase('space');
          white(false);
        });
    } else if (phase === 'space') {
      tl = gsap
        .timeline()
        .to(ship, { travel: 1, duration: 4.5 * k, ease: 'power1.inOut' })
        .add(() => white(true), `-=${0.4 * k}`)
        .add(() => {
          ship.y = 90;
          ship.flame = 1;
          st.arrive(st.target ?? 'earth');
          st.setPhase('landing');
          white(false, 0.6);
        });
    } else if (phase === 'landing') {
      tl = gsap
        .timeline()
        .to(ship, { y: 0, duration: 3.6 * k, ease: 'power2.out' })
        .to(ship, { flame: 0, duration: 0.6 * k })
        .add(() => st.setPhase('drive'));
    }
    return () => {
      tl?.kill();
    };
  }, [phase, reduced]);

  const pick = (w: WorldId) => {
    setChooser(false);
    travelTo(w);
  };
  const onPickPlanet = (w: WorldId) => {
    if (w === 'moon') pick('moon');
    else setChooser(true);
  };

  // Fiche de la machine proche : quelques chiffres tirés des données, peu de texte.
  const card = useMemo(() => {
    if (!near) return null;
    if (near === 'perseverance' || near === 'curiosity') {
      const pts = siteData?.paths[near];
      return { name: near === 'perseverance' ? 'Perseverance' : 'Curiosity', active: true, stats: pts ? `${distanceKm(pts, sol).toFixed(1)} km · ${t('explorer.sol')} ${Math.floor(sol)}` : '' };
    }
    if (near === 'ingenuity') {
      const fl = siteData?.flights.ingenuity ?? [];
      const done = fl.filter((f) => f.flight > 0 && f.sol <= sol).length;
      const over = fl.length > 0 && sol >= fl[fl.length - 1].sol;
      return { name: 'Ingenuity', active: !over, stats: `${done} ${t('explorer.flights')}`, story: '/mission?machine=ingenuity' };
    }
    if (near === 'apollo-11') return { name: t('explorer.lrrr'), active: true, stats: '1969', laser: true, story: '/mission?machine=apollo-11' };
    if (near === 'apollo-11-lm') return { name: t('explorer.lm'), active: false, stats: `1969 · ${t('explorer.leftBehind')}`, noStatus: true };
    if (near === 'apollo-11-easep') return { name: t('explorer.easep'), active: false, stats: '1969', noStatus: true };
    return null;
  }, [near, sol, siteData, t]);

  const lastSol = siteData ? Math.max(...Object.values(siteData.paths).map((p) => p[p.length - 1][3])) : 0;

  if (!webglAvailable) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <p>{t('lite.notice')}</p>
        <Link to="/mission" className="mt-4 inline-block underline">{t('nav.mission')}</Link>
      </section>
    );
  }

  return (
    <section className="relative flex-1 bg-space text-white">
      <h1 className="sr-only">{t('explorer.title')}</h1>
      <div className="relative h-[calc(100vh-3.5rem)] min-h-[30rem] w-full overflow-hidden">
        <Suspense fallback={<Loading />}>
          <ExplorerCanvas animate={!reduced} onPickPlanet={onPickPlanet} />
        </Suspense>
        <div ref={flash} className="pointer-events-none absolute inset-0 z-40 bg-white opacity-0" aria-hidden="true" />

        {/* Où suis-je */}
        <div className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-full bg-space/70 px-3 py-1.5 text-sm ring-1 ring-white/15 backdrop-blur">
          <span aria-hidden="true">{WORLD_ICON[world]}</span>
          <span className="font-display text-lg font-extrabold uppercase tracking-wider">{t(`explorer.worlds.${world}`)}</span>
        </div>

        {/* Destinations : toujours accessibles au clavier, en plus des clics sur les planètes */}
        {phase === 'drive' && (
          <nav aria-label={t('explorer.destinations')} className="absolute right-3 top-3 z-30 flex gap-1.5">
            {(['earth', 'moon', 'jezero', 'gale'] as WorldId[])
              .filter((w) => w !== world)
              .map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => pick(w)}
                  title={t(`explorer.worlds.${w}`)}
                  className="flex items-center gap-1.5 rounded-full bg-space/70 px-3 py-1.5 text-sm ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
                >
                  <span aria-hidden="true">🚀</span>
                  <span>{t(`explorer.worlds.${w}`)}</span>
                </button>
              ))}
          </nav>
        )}

        {/* Sur le pas de tir, ou clic sur Mars : choisir où aller */}
        <AnimatePresence>
          {phase === 'drive' && world === 'earth' && (onPad || chooser) && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-x-0 bottom-24 z-30 mx-auto flex w-fit items-end gap-3"
            >
              <OrbiAvatar size={64} talking />
              <div className="rounded-2xl bg-white/95 p-3 text-slate-900 shadow-xl">
                <p className="px-1 pb-2 text-sm font-semibold">{t('explorer.where')}</p>
                <div className="flex gap-2">
                  {(['moon', 'jezero', 'gale'] as WorldId[]).map((w) => (
                    <button key={w} type="button" onClick={() => pick(w)} className="flex flex-col items-center rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700">
                      <span className="text-2xl" aria-hidden="true">{WORLD_ICON[w]}</span>
                      <span className="text-xs font-semibold">{t(`explorer.worlds.${w}`)}</span>
                      <span className="text-[10px] text-slate-300">{t(`explorer.who.${w}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fiche de la machine proche */}
        <AnimatePresence>
          {card && phase === 'drive' && (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute left-1/2 top-16 z-30 w-72 -translate-x-1/2 rounded-2xl bg-space/85 p-3 ring-1 ring-white/20 backdrop-blur"
              role="status"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-xl font-extrabold uppercase">{card.name}</p>
                {!card.noStatus && <StatusPill active={card.active} />}
              </div>
              <p className="mt-0.5 text-sm tabular-nums text-slate-300">{card.stats}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {card.laser && (
                  <button
                    type="button"
                    onClick={() => {
                      laser.firing = true;
                      laser.t0 = performance.now() / 1000;
                    }}
                    className="rounded-full bg-active px-3 py-1 text-sm font-semibold text-space"
                  >
                    ⚡ {t('explorer.fireLaser')}
                  </button>
                )}
                {card.story && (
                  <Link to={card.story} className="rounded-full px-3 py-1 text-sm ring-1 ring-white/30 hover:bg-white/10">
                    📖 {t('explorer.story')}
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Relecture des trajets (Mars) */}
        {site && phase === 'drive' && siteData && (
          <div className="absolute inset-x-0 bottom-3 z-30 mx-auto flex w-fit items-center gap-3 rounded-full bg-space/80 px-3 py-1.5 text-sm ring-1 ring-white/15 backdrop-blur">
            <button type="button" onClick={() => useWorld.getState().setPlaying(!playing)} aria-label={playing ? t('explorer.pause') : t('explorer.play')} className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
              {playing ? '⏸' : '▶'}
            </button>
            <span className="min-w-28 font-display text-lg font-extrabold tabular-nums">
              {t('explorer.sol')} {Math.floor(sol)}
              <span className="text-xs font-normal text-slate-400"> / {Math.floor(lastSol)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={lastSol}
              step={1}
              value={sol}
              aria-label={t('explorer.timeline')}
              onChange={(e) => {
                const v = Number(e.target.value);
                replay.sol = v;
                useWorld.getState().setSol(v);
              }}
              className="w-40 accent-[#4BE08A] sm:w-64"
            />
            {[2, 12, 60].map((s) => (
              <button key={s} type="button" onClick={() => useWorld.getState().setSpeed(s)} aria-pressed={speed === s} className={`rounded-full px-2 py-0.5 text-xs ${speed === s ? 'bg-white text-space' : 'bg-white/10'}`}>
                ×{s}
              </button>
            ))}
          </div>
        )}

        {/* Aide de conduite (discrète) */}
        {phase === 'drive' && (
          <p className="pointer-events-none absolute bottom-3 left-3 z-20 hidden rounded-full bg-space/60 px-3 py-1 text-xs text-slate-300 sm:block">
            ⌨ ↑ ↓ ← → · {t('explorer.brake')} · {t('app.notToScale')}
          </p>
        )}
        {phase === 'drive' && <TouchPad />}
        {phase !== 'drive' && target && (
          <p className="absolute inset-x-0 bottom-6 z-30 text-center font-display text-3xl font-extrabold uppercase tracking-widest drop-shadow">
            {WORLD_ICON[target]} {t(`explorer.worlds.${target}`)}
          </p>
        )}
      </div>
    </section>
  );
}
