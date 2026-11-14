import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import gsap from 'gsap';
import { Loading } from '../components/ui/Loading';
import { SankofaAvatar } from '../components/guide/SankofaAvatar';
import { StatusPill } from '../components/story/StatusPill';
import { webglAvailable } from '../lib/device';
import { usePrefersReducedMotion } from '../lib/hooks';
import { drive, ship, useWorld, type WorldId } from '../world/state';
import { useKeyboardDrive } from '../world/useKeyboardDrive';
import { distanceKm, replay } from '../world/Replay';
import { useSiteData } from '../world/worlds/MarsWorld';
import { laser } from '../world/worlds/MoonWorld';
import { AnatomyPanel } from '../components/guide/AnatomyPanel';
import { MODELS, type ModelId } from '../components/3d/NasaModel';
import { partsFromLabels } from '../content/anatomy';
import { speak } from '../audio/speech';
import { useStore } from '../store/useStore';
import { player } from '../world/Player';
import { engineStop, engineUpdate, playBump, playDetect, playLanding, playLiftoff, type SoundWorld } from '../audio/sfx';

const SOUND_WORLD: Record<WorldId, SoundWorld> = { earth: 'earth', moon: 'moon', jezero: 'mars', gale: 'mars' };

/** Sons de l'exploration : moteur du rover, chocs, fusée, détection des machines. */
function useExplorerSounds(world: WorldId, phase: string, near: string | null) {
  useEffect(() => {
    let raf = 0;
    let lastBump = 0;
    const tick = () => {
      engineUpdate(SOUND_WORLD[world], player.speed, phase === 'drive');
      if (player.bump > 0.6 && lastBump <= 0.6) playBump(SOUND_WORLD[world]);
      lastBump = player.bump;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [world, phase]);
  useEffect(() => () => engineStop(), []);
  useEffect(() => {
    if (phase === 'liftoff') playLiftoff(SOUND_WORLD[world]);
    if (phase === 'landing') playLanding(SOUND_WORLD[world]);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (near) playDetect();
  }, [near]);
}
import { Icon, PlanetGlyph } from '../components/ui/Glyphs';

const ExplorerCanvas = lazy(() => import('../world/ExplorerCanvas'));


/** Étiquettes 3D de chaque machine de l'Explorer : ce sont les pièces de son anatomie. */
const modelLabels = (id: ModelId) => MODELS[id].annotations.map((a) => a.key);
const ANATOMY_LABELS: Record<string, string[]> = {
  perseverance: modelLabels('perseverance'),
  curiosity: modelLabels('curiosity'),
  ingenuity: modelLabels('ingenuity'),
  'apollo-11-lm': modelLabels('apollo_lm'),
  'apollo-11': ['parts.reflectorPanel'],
  'apollo-11-easep': ['parts.seismometer', 'parts.seismoPanels'],
};

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
  const { t, i18n } = useTranslation();
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
  useExplorerSounds(world, phase, near);

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
  const card = useMemo((): { name: string; active: boolean; stats: string; story?: string; laser?: boolean; noStatus?: boolean } | null => {
    if (!near) return null;
    if (near === 'perseverance' || near === 'curiosity') {
      const pts = siteData?.paths[near];
      return {
        name: near === 'perseverance' ? 'Perseverance' : 'Curiosity',
        active: true,
        stats: pts ? `${distanceKm(pts, sol).toFixed(1)} km · ${t('explorer.sol')} ${Math.floor(sol)}` : '',
        story: `/mission?machine=${near}`,
      };
    }
    if (near === 'ingenuity') {
      const fl = siteData?.flights.ingenuity ?? [];
      const done = fl.filter((f) => f.flight > 0 && f.sol <= sol).length;
      const over = fl.length > 0 && sol >= fl[fl.length - 1].sol;
      return { name: 'Ingenuity', active: !over, stats: `${done} ${t('explorer.flights')}`, story: '/mission?machine=ingenuity' };
    }
    // Le réflecteur d'Apollo 11 n'a pas sa propre fiche : on raconte celui d'Apollo 15, son cousin.
    if (near === 'apollo-11') return { name: t('explorer.lrrr'), active: true, stats: '1969', laser: true, story: '/mission?machine=apollo-15-retroreflector' };
    if (near === 'apollo-11-lm')
      return { name: t('explorer.lm'), active: false, stats: `1969 · ${t('explorer.leftBehind')}`, noStatus: true, story: '/mission?machine=apollo-11-eagle' };
    if (near === 'apollo-11-easep') return { name: t('explorer.easep'), active: false, stats: '1969', noStatus: true };
    return null;
  }, [near, sol, siteData, t]);

  // Anatomie de la machine proche : les pièces étiquetées sur son modèle 3D.
  const part = useWorld((s) => s.part);
  const setPart = useWorld((s) => s.setPart);
  const anatomy = useMemo(() => (near ? partsFromLabels(ANATOMY_LABELS[near] ?? []) : []), [near]);

  // En arrivant près d'une machine, Sankofa la présente (une fois par machine rejointe).
  const voiceOn = useStore((s) => s.voiceOn);
  useEffect(() => {
    if (!card || !voiceOn) return;
    speak(t('explorer.arrived', { name: card.name }), i18n.language);
  }, [card?.name, voiceOn]); // eslint-disable-line react-hooks/exhaustive-deps

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

        {/* Destinations pour le clavier : invisibles, elles n'apparaissent qu'au focus (on clique sinon sur les planètes du ciel). */}
        {phase === 'drive' && (
          <nav aria-label={t('explorer.destinations')} className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:right-3 focus-within:top-3 focus-within:z-30 focus-within:flex focus-within:gap-3">
            {(['earth', 'moon', 'jezero', 'gale'] as WorldId[])
              .filter((w) => w !== world)
              .map((w) => (
                <button key={w} type="button" onClick={() => pick(w)} className="text-sm text-white underline-offset-4 hover:underline">
                  {t(`explorer.worlds.${w}`)}
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
              <SankofaAvatar size={64} talking />
              <div className="rounded-3xl bg-gradient-to-t from-space/90 to-space/40 px-5 pb-3 pt-4 backdrop-blur-md">
                <p className="pb-3 font-display text-xl font-extrabold uppercase tracking-wider text-white">{t('explorer.where')}</p>
                <div className="flex gap-6">
                  {(['moon', 'jezero', 'gale'] as WorldId[]).map((w) => (
                    <button key={w} type="button" onClick={() => pick(w)} className="group flex flex-col items-center text-white transition hover:-translate-y-1">
                      <PlanetGlyph body={w} size={72} className="transition group-hover:scale-110" />
                      <span className="mt-1 font-display text-lg font-extrabold uppercase leading-none group-hover:text-active">{t(`explorer.worlds.${w}`)}</span>
                      <span className="text-[11px] text-slate-400">{t(`explorer.who.${w}`)}</span>
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
              // Sur grand écran, la fiche se range à droite pour laisser voir la machine et ses étiquettes 3D.
              className="absolute left-1/2 top-16 z-30 max-h-[60%] w-[min(22rem,calc(100%-1.5rem))] -translate-x-1/2 overflow-y-auto rounded-2xl bg-space/85 p-3 ring-1 ring-white/20 backdrop-blur sm:left-auto sm:right-3 sm:translate-x-0"
              role="region"
              aria-label={card.name}
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
                    <Icon name="bolt" /> {t('explorer.fireLaser')}
                  </button>
                )}
                {card.story && (
                  <Link to={card.story} className="rounded-full px-3 py-1 text-sm ring-1 ring-white/30 hover:bg-white/10">
                    <Icon name="book" /> {t('explorer.story')}
                  </Link>
                )}
              </div>
              {anatomy.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <AnatomyPanel parts={anatomy} selected={part} onSelect={setPart} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Relecture des trajets (Mars) */}
        {site && phase === 'drive' && siteData && (
          <div className="absolute inset-x-0 bottom-3 z-30 mx-auto flex w-fit items-center gap-3 rounded-full bg-space/80 px-3 py-1.5 text-sm ring-1 ring-white/15 backdrop-blur">
            <button type="button" onClick={() => useWorld.getState().setPlaying(!playing)} aria-label={playing ? t('explorer.pause') : t('explorer.play')} className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
              <Icon name={playing ? 'pause' : 'play'} />
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
            <Icon name="keys" size={14} /> ↑ ↓ ← → · {t('explorer.brake')} · {t('app.notToScale')}
          </p>
        )}
        {/* Astuce scientifique : la poussière ne retombe pas pareil sur la Lune et sur Mars. */}
        {phase === 'drive' && world !== 'earth' && !card && (
          <p className="pointer-events-none absolute left-3 top-14 z-20 max-w-xs rounded-xl bg-space/70 px-3 py-1.5 text-xs text-slate-200 ring-1 ring-white/10">
            <Icon name="wind" size={14} /> {t(world === 'moon' ? 'explorer.dustMoon' : 'explorer.dustMars')}
          </p>
        )}
        {phase === 'drive' && <TouchPad />}
        {phase !== 'drive' && target && (
          <p className="absolute inset-x-0 bottom-6 z-30 text-center font-display text-3xl font-extrabold uppercase tracking-widest drop-shadow">
            <PlanetGlyph body={target} size={40} className="mr-2 inline-block align-middle" />
            {t(`explorer.worlds.${target}`)}
          </p>
        )}
      </div>
    </section>
  );
}
