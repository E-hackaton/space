import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { Loading } from '../components/ui/Loading';
import { SankofaAvatar } from '../components/guide/SankofaAvatar';
import { StatusPill } from '../components/story/StatusPill';
import { Compass } from '../components/expedition/Compass';
import { StoryPlayer } from '../components/expedition/StoryPlayer';
import { TouchPad } from '../components/expedition/TouchPad';
import { LivingPlanet } from '../components/ui/LivingPlanet';
import { atlasPoints, isSurfaceBody, type AtlasPoint, type SurfaceBody } from '../lib/atlas';
import { machinesOn, useCatalog, type MachineSummary } from '../lib/machines';
import { webglAvailable } from '../lib/device';
import { usePrefersReducedMotion } from '../lib/hooks';
import { speak, stopSpeaking } from '../audio/speech';
import { useStore } from '../store/useStore';
import { useKeyboardDrive } from '../world/useKeyboardDrive';
import { useExpedition, type GuideMode } from '../scenes/expedition/expedition';
import { MiniMap3D } from '../components/expedition/MiniMap3D';
import { FIND_DIST, layoutSites, type Site } from '../world/expeditionLayout';
import { resetDrive, useAutopilot } from '../world/autopilot';
import { player } from '../world/Player';
import { PlanetGlyph } from '../components/ui/Glyphs';
import { engineStop, engineUpdate, playDetect, playFound } from '../audio/sfx';
import { Icon } from '../components/ui/Glyphs';

const ExpeditionGround = lazy(() => import('../scenes/expedition/ExpeditionGround'));

/** Destinations des missions : uniquement la Lune et Mars. */
type Destination = SurfaceBody;
const DESTINATIONS: Destination[] = ['moon', 'mars'];

/** Sankofa parle (si la voix est activée). */
function useSankofa() {
  const { i18n } = useTranslation();
  const voiceOn = useStore((s) => s.voiceOn);
  return useCallback((text: string) => voiceOn && speak(text, i18n.language), [voiceOn, i18n.language]);
}

export default function MissionPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('astre');
  const dest: Destination | null = isSurfaceBody(raw) ? raw : null;
  const mode = (params.get('mode') as GuideMode | null) ?? null;
  const first = params.get('machine');
  const catalog = useCatalog();

  // Lien direct vers une machine (carnet, carte) : on en déduit l'astre.
  useEffect(() => {
    if (dest || !first || catalog.status !== 'ready') return;
    const m = catalog.machines.find((x) => x.id === first);
    if (m && isSurfaceBody(m.body)) setParams({ astre: m.body, machine: first }, { replace: true });
  }, [dest, first, catalog, setParams]);

  useEffect(() => () => stopSpeaking(), []);

  const set = (next: Record<string, string>) => setParams(next);

  return (
    <section className="relative flex flex-1 flex-col bg-space text-white">
      <h1 className="sr-only">{useTranslation().t('mission.title')}</h1>
      <div className="relative h-[calc(100vh-3.5rem)] min-h-[34rem] w-full overflow-hidden">
        {!dest ? (
          <ChooseDestination machines={catalog.machines} onPick={(d) => set({ astre: d, ...(first ? { machine: first } : {}) })} />
        ) : !mode ? (
          <ChooseMode dest={dest} onPick={(m) => set({ astre: dest, mode: m, ...(first ? { machine: first } : {}) })} onBack={() => set({})} />
        ) : (
          <SurfaceExpedition key={dest} body={dest} mode={mode} machines={catalog.machines} first={first} onBack={() => set({})} onMode={(m) => set({ astre: dest, mode: m })} />
        )}
        {catalog.status === 'error' && <ApiError />}
      </div>
    </section>
  );
}

function ApiError() {
  const { t } = useTranslation();
  return (
    <p role="alert" className="absolute inset-x-0 top-4 z-50 mx-auto w-fit rounded-xl bg-red-500/90 px-4 py-2 text-sm">
      {t('errors.api')}
    </p>
  );
}

/* ----------------------------------------------------------- 1. destination */

function ChooseDestination({ machines, onPick }: { machines: MachineSummary[]; onPick: (d: Destination) => void }) {
  const { t } = useTranslation();
  const say = useSankofa();
  const found = useStore((s) => s.completedMachines);
  useEffect(() => {
    say(t('expedition.pickBody'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="stage-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex max-w-xl items-center gap-3 text-left">
        <SankofaAvatar size={64} talking />
        <p className="text-lg sm:text-xl">{t('expedition.pickBody')}</p>
      </motion.div>
      <ul className="flex w-full max-w-5xl flex-wrap items-end justify-center gap-x-14 gap-y-8">
        {DESTINATIONS.map((d, i) => {
          const list = machinesOn(machines, d);
          const done = list.filter((m) => found.includes(m.id)).length;
          return (
            <motion.li key={d} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i, type: 'spring', stiffness: 70 }}>
              <button type="button" onClick={() => onPick(d)} className="planet-pick">
                <LivingPlanet body={d} size={d === 'mars' ? 220 : 200} />
                <span className="planet-pick-name">{t(`bodies.${d}.name`)}</span>
                <span className="block text-sm text-slate-400">
                  {done}/{list.length}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------- 2. pilote */

function ChooseMode({ dest, onPick, onBack }: { dest: Destination; onPick: (m: GuideMode) => void; onBack: () => void }) {
  const { t } = useTranslation();
  const say = useSankofa();
  useEffect(() => {
    say(t('expedition.pickMode', { body: t(`bodies.${dest}.name`) }));
  }, [dest]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="stage-center">
      <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-25" aria-hidden="true">
        <LivingPlanet body={dest} size={560} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 flex max-w-xl items-center gap-3">
        <SankofaAvatar size={64} talking />
        <p className="text-lg sm:text-xl">{t('expedition.pickMode', { body: t(`bodies.${dest}.name`) })}</p>
      </motion.div>
      <div className="relative flex flex-col items-center gap-5">
        {(['auto', 'manual'] as GuideMode[]).map((m, i) => (
          <motion.button
            key={m}
            type="button"
            onClick={() => onPick(m)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * i }}
            className="mode-pick"
          >
            <span className="mode-pick-name">{t(`expedition.modes.${m}`)}</span>
            <span className="block text-base text-slate-300">{t(`expedition.modeHint.${m}`)}</span>
          </motion.button>
        ))}
      </div>
      <button type="button" onClick={onBack} className="relative mt-8 text-sm text-slate-400 underline-offset-4 hover:text-white hover:underline">
        ← {t('expedition.otherBody')}
      </button>
    </div>
  );
}

/* ----------------------------------------------------------- 3. expédition au sol */

interface SurfaceProps {
  body: SurfaceBody;
  mode: GuideMode;
  machines: MachineSummary[];
  first: string | null;
  onBack: () => void;
  onMode: (m: GuideMode) => void;
}

function SurfaceExpedition({ body, mode, machines, first, onBack, onMode }: SurfaceProps) {
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const say = useSankofa();
  const { sites } = useMemo(() => layoutSites(machines, body), [machines, body]);
  const points = useMemo(() => atlasPoints(machines, body), [machines, body]);
  const byId = useMemo(() => new Map(sites.map((s) => [s.machine.id, s])), [sites]);
  const target = useExpedition((s) => s.target);
  const near = useExpedition((s) => s.near);
  const story = useExpedition((s) => s.story);
  const found = useExpedition((s) => s.found);
  const setTarget = useExpedition((s) => s.setTarget);
  const openStory = useExpedition((s) => s.openStory);
  const closeStory = useExpedition((s) => s.closeStory);
  const [finished, setFinished] = useState(false);

  // Départ : un peu à l'écart de la première machine, tourné vers elle.
  const start = useMemo((): { pos: [number, number]; heading: number } | null => {
    const s0 = (first && byId.get(first)) || sites[0];
    if (!s0) return null;
    const len = Math.hypot(s0.x, s0.z) || 1;
    const pos: [number, number] = [s0.x - (s0.x / len) * 55, s0.z - (s0.z / len) * 55];
    return { pos, heading: Math.atan2(-(s0.x - pos[0]), -(s0.z - pos[1])) };
  }, [sites, byId, first]);

  useKeyboardDrive(mode === 'manual' && !story);
  useEffect(() => {
    useExpedition.getState().setMode(mode);
    resetDrive();
  }, [mode]);

  /** Machine pas encore retrouvée la plus proche du véhicule. */
  const nearestLeft = useCallback(
    (exclude: string[] = []) => {
      let best: Site | null = null;
      let bestD = Infinity;
      for (const s of sites) {
        if (useExpedition.getState().found.includes(s.machine.id) || exclude.includes(s.machine.id)) continue;
        const d = Math.hypot(s.x - player.x, s.z - player.z);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      return best;
    },
    [sites],
  );

  // Arrivée : on repart de zéro, Sankofa présente l'expédition.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !sites.length) return;
    started.current = true;
    useExpedition.getState().reset();
    useExpedition.getState().setMode(mode);
    const s0 = (first && byId.get(first)) || sites[0];
    if (mode === 'auto' || first) setTarget(s0.machine.id);
    say(t(mode === 'auto' ? 'expedition.introAuto' : 'expedition.introManual', { body: t(`bodies.${body}.name`), count: sites.length }));
  }, [sites]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pilote auto : une machine pas encore retrouvée croisée en chemin passe d'abord (on s'y arrête,
  // on écoute son histoire), puis le trajet reprend vers la plus proche des machines restantes.
  useEffect(() => {
    if (mode !== 'auto' || story || !near || near === target) return;
    if (useExpedition.getState().found.includes(near)) return;
    setTarget(near);
  }, [mode, near, story, target, setTarget]);

  // Pilote auto : il conduit le véhicule jusqu'à la cible, puis l'histoire commence.
  useAutopilot({
    enabled: mode === 'auto' && !story && !finished,
    target: () => {
      const s = target ? byId.get(target) : undefined;
      return s ? { x: s.x, z: s.z } : null;
    },
    arrive: FIND_DIST * 0.7,
    onArrive: () => target && openStory(target),
  });

  // Sons : moteur du véhicule, « ping » quand un objet oublié est détecté, accord à la découverte.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      engineUpdate(body, player.speed, !story);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      engineStop();
    };
  }, [body, story]);
  useEffect(() => {
    if (!near || story) return;
    playDetect();
    if (mode === 'manual') say(t('expedition.foundIt', { name: byId.get(near)?.machine.name }));
  }, [near]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (story) playFound();
  }, [story]);

  const upcoming = useMemo(() => (mode === 'auto' && story ? nearestLeft([story]) : null), [mode, story, nearestLeft]);

  const endStory = useCallback(() => {
    stopSpeaking();
    closeStory();
    if (mode === 'auto') {
      const next = nearestLeft();
      if (next) setTarget(next.machine.id);
      else {
        setTarget(null);
        setFinished(true);
        say(t('expedition.allFound', { body: t(`bodies.${body}.name`) }));
      }
    } else if (target && useExpedition.getState().found.includes(target)) setTarget(null);
  }, [mode, nearestLeft, setTarget, closeStory, target, say, t, body]);

  const pick = (id: string) => {
    if (story) return;
    setTarget(id);
    playDetect();
    if (mode === 'manual') say(t('expedition.waypoint', { name: byId.get(id)?.machine.name }));
  };

  // Entrée : écouter l'histoire de la machine toute proche (pilote manuel).
  useEffect(() => {
    if (mode !== 'manual' || !near || story) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && openStory(near);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, near, story, openStory]);

  const nearSite = near ? byId.get(near) : undefined;
  const targetSite = target ? byId.get(target) : undefined;

  if (!webglAvailable) return <LiteList points={points} onBack={onBack} />;

  return (
    <>
      {start && (
        <Suspense fallback={<Loading />}>
          <ExpeditionGround key={body} body={body} sites={sites} start={start.pos} startHeading={start.heading} animate={!reduced} />
        </Suspense>
      )}

      {/* Où suis-je, et qui pilote */}
      {!story && (
        <div className="absolute left-3 top-3 z-30 flex flex-wrap items-center gap-2">
          <button type="button" onClick={onBack} className="chip" aria-label={t('expedition.otherBody')}>←</button>
          <span className="hud-pill flex items-center gap-2 font-display text-lg font-extrabold uppercase tracking-wider">
            <PlanetGlyph body={body} size={22} /> {t(`bodies.${body}.name`)}
          </span>
          <div className="hud-pill flex gap-1 p-1" role="group" aria-label={t('expedition.pilot')}>
            {(['auto', 'manual'] as GuideMode[]).map((m) => (
              <button key={m} type="button" onClick={() => onMode(m)} aria-pressed={mode === m} className={`rounded-[3px] px-3 py-0.5 text-sm ${mode === m ? 'bg-white text-space' : 'hover:bg-white/10'}`}>
                {t(`expedition.modes.${m}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pilote auto : Sankofa annonce la prochaine machine */}
      <AnimatePresence>
        {mode === 'auto' && !story && targetSite && (
          <motion.div key={targetSite.machine.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-x-0 top-16 z-30 mx-auto flex w-fit items-center gap-2 rounded-full bg-space/75 py-1 pl-1 pr-4 ring-1 ring-white/15 backdrop-blur">
            <SankofaAvatar size={40} talking />
            <span className="text-sm">
              {t('expedition.headingTo')} <strong className="font-display text-lg uppercase">{targetSite.machine.name}</strong>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pilote manuel : boussole vers la balise, puis invitation à écouter */}
      {mode === 'manual' && !story && targetSite && target !== near && (
        <div className="absolute inset-x-0 top-16 z-30 mx-auto w-fit">
          <Compass target={targetSite} />
        </div>
      )}
      <AnimatePresence>
        {mode === 'manual' && !story && nearSite && (
          <motion.div key={nearSite.machine.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-x-0 bottom-24 z-30 mx-auto flex w-fit items-center gap-3 rounded-2xl bg-space/85 p-3 ring-1 ring-active/50 backdrop-blur">
            <div>
              <p className="font-display text-2xl font-extrabold uppercase leading-none">{nearSite.machine.name}</p>
              <div className="mt-1">
                <StatusPill active={nearSite.machine.status === 'active'} />
              </div>
            </div>
            <button type="button" className="btn-primary" onClick={() => openStory(nearSite.machine.id)} autoFocus>
              <Icon name="book" /> {t('expedition.listen')}
            </button>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Minicarte 3D */}
      {!story && <MiniMap3D body={body} sites={sites} target={target} found={found} onPick={pick} />}

      {mode === 'manual' && !story && (
        <>
          <p className="pointer-events-none absolute bottom-3 right-3 z-20 hidden rounded-full bg-space/60 px-3 py-1 text-xs text-slate-300 sm:block">
            <Icon name="keys" size={14} /> ↑ ↓ ← → · {t('expedition.enter')}
          </p>
          <TouchPad className="bottom-24" />
        </>
      )}
      {!story && (
        <p className="pointer-events-none absolute bottom-10 right-3 z-10 max-w-xs text-right text-[11px] text-slate-300/80">
          {t('expedition.layoutNote')}
        </p>
      )}

      {/* L'histoire, racontée sur place */}
      {story && (
        <StoryPlayer
          key={story}
          slug={story}
          mode={mode}
          onDone={endStory}
          nextLine={mode === 'auto' ? (upcoming ? t('expedition.nextUp', { name: upcoming.machine.name }) : t('expedition.lastOne')) : undefined}
        />
      )}

      {/* Toutes les machines retrouvées */}
      <AnimatePresence>
        {finished && !story && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-40 grid place-items-center bg-space/50 p-4 backdrop-blur-sm">
            <div className="max-w-md text-center">
              <div className="flex justify-center">
                <SankofaAvatar size={110} talking />
              </div>
              <p className="mt-3 text-2xl">{t('expedition.allFound', { body: t(`bodies.${body}.name`) })}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link to="/carnet" className="btn-primary">{t('nav.logbook')}</Link>
                <button type="button" className="btn-ghost" onClick={onBack}>{t('expedition.otherBody')}</button>
                <button type="button" className="btn-ghost" onClick={() => (setFinished(false), onMode('manual'))}>{t('expedition.modes.manual')}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Sans WebGL : la liste des objets, chacun ouvre son histoire. */
function LiteList({ points, onBack }: { points: AtlasPoint[]; onBack: () => void }) {
  const { t } = useTranslation();
  const story = useExpedition((s) => s.story);
  const openStory = useExpedition((s) => s.openStory);
  const closeStory = useExpedition((s) => s.closeStory);
  if (story) return <StoryPlayer slug={story} mode="manual" onDone={closeStory} />;
  return (
    <div className="stage-center">
      <ul className="grid w-full max-w-3xl gap-2 sm:grid-cols-2">
        {points.map((p) => (
          <li key={p.machine.id}>
            <button type="button" className="dest-card !p-4 text-left" onClick={() => openStory(p.machine.id)}>
              <span className="font-display text-xl font-extrabold uppercase">{p.machine.name}</span> <StatusPill active={p.machine.status === 'active'} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-ghost mt-4" onClick={onBack}>← {t('expedition.otherBody')}</button>
    </div>
  );
}
