import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { Loading } from '../components/ui/Loading';
import { GuideBubble } from '../components/guide/GuideBubble';
import { SankofaAvatar } from '../components/guide/SankofaAvatar';
import { SpeechText } from '../components/guide/SpeechText';
import { VitalsPanel } from '../components/story/VitalsPanel';
import { StatusPill } from '../components/story/StatusPill';
import { TravelClock } from '../components/story/TravelClock';
import { Quiz } from '../components/story/Quiz';
import { BODY_ORDER, type BodyId } from '../lib/solarSystem';
import { formatDate, landsOnSurface, machinesOn, useCatalog, useMachine, type MachineSummary } from '../lib/machines';
import { AnatomyPanel } from '../components/guide/AnatomyPanel';
import { webglAvailable } from '../lib/device';
import { usePrefersReducedMotion } from '../lib/hooks';
import { useStore } from '../store/useStore';
import { animateTo, createMissionAnim, targetsFor } from '../scenes/mission/missionAnim';
import { speak, stopSpeaking } from '../audio/speech';

const MissionScene = lazy(() => import('../scenes/MissionScene'));
const MachineViewer = lazy(() => import('../scenes/MachineViewer'));

type Stage = 'explore' | 'pad' | 'story' | 'outro';
/** Ce que le joueur peut faire à une étape du récit. */
type StepAction = 'inspect' | 'countdown' | 'land' | 'laser' | 'fly' | 'call';

const ACTION_ICON: Record<StepAction, string> = { inspect: '🔍', countdown: '🚀', land: '🪂', laser: '⚡', fly: '🚁', call: '📡' };

/** Distance Terre-Lune déduite du temps d'aller-retour de la lumière (c ≈ 300 000 km/s). */
const LASER_SECONDS = 2.56;
const MOON_KM = Math.round((LASER_SECONDS * 300_000) / 2 / 1000) * 1000;

const btn = 'rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-2';
const btnPrimary = `${btn} bg-active text-space hover:brightness-110`;
const btnGhost = `${btn} ring-1 ring-white/30 text-white hover:bg-white/10`;
const btnLight = `${btn} bg-slate-900 text-white hover:bg-slate-700`;

export default function MissionPage() {
  const { t, i18n } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const [params, setParams] = useSearchParams();
  const voiceOn = useStore((s) => s.voiceOn);
  const setVoiceOn = useStore((s) => s.setVoiceOn);
  const autoplay = useStore((s) => s.autoplay);
  const setAutoplay = useStore((s) => s.setAutoplay);
  const completeMachine = useStore((s) => s.completeMachine);
  const earnBadge = useStore((s) => s.earnBadge);
  const badges = useStore((s) => s.badges);
  const hasBadge = (machineSlug: string) => badges.includes(machineSlug);

  // Le catalogue (liste) et la fiche complète viennent de l'API Django.
  const catalog = useCatalog();
  const slug = params.get('machine');
  const summary = catalog.machines.find((m) => m.id === slug);
  const detail = useMachine(slug);
  const machine = detail.machine;
  const rawBody = params.get('astre');
  const body: BodyId | null = summary?.body ?? (BODY_ORDER.includes(rawBody as BodyId) ? (rawBody as BodyId) : null);

  const [stage, setStage] = useState<Stage>(slug ? 'pad' : 'explore');
  const [step, setStep] = useState(-1);
  const anim = useMemo(() => createMissionAnim(), [machine?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const timeline = useRef<ReturnType<typeof animateTo> | null>(null);
  /** Dernier texte lu jusqu'au bout : la lecture automatique attend la fin de la voix. */
  const [finished, setFinished] = useState<string | null>(null);

  // --- Actions du joueur : c'est lui qui fait avancer l'histoire en 3D ---
  /** Le joueur a lancé le compte à rebours et la fusée est partie. */
  const [launched, setLaunched] = useState(false);
  /** Le joueur a déclenché l'atterrissage. */
  const [landed, setLanded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectPart, setInspectPart] = useState<string | null>(null);
  const [laserShots, setLaserShots] = useState(0);
  const [laserBack, setLaserBack] = useState(false);
  const [flyingOn, setFlyingOn] = useState(false);
  const [call, setCall] = useState<'sending' | 'done' | null>(null);

  // Si la machine change (lien direct, retour arrière), on repart du pas de tir.
  useEffect(() => {
    setStage(slug ? 'pad' : 'explore');
    setStep(-1);
    setLaunched(false);
    setLanded(false);
    setCountdown(null);
    setInspecting(false);
  }, [slug]);

  /** Change d'étape et remet à zéro ce qui ne vaut que pour une étape (vol, tir, appel). */
  const goToStep = useCallback((index: number) => {
    setFlyingOn(false);
    setLaserBack(false);
    setCall(null);
    setInspecting(false);
    setStep(index);
  }, []);

  // Où la cinématique voudrait aller pour cette étape, et où elle a le droit d'aller :
  // la fusée attend le compte à rebours, la descente attend le signal d'atterrissage.
  const surface = !!machine && landsOnSurface(machine) && machine.lat !== undefined;
  const wanted = useMemo(() => (machine ? targetsFor(machine, step) : null), [machine, step]);
  const needsLaunch = !!wanted && wanted.launch > 0 && !launched;
  const needsLanding = !!wanted && surface && wanted.arrive > 0 && !landed && !needsLaunch;
  const target = useMemo(() => {
    if (!wanted) return null;
    if (needsLaunch) return createMissionAnim();
    if (needsLanding) return { ...wanted, arrive: 0, decline: 0, end: 0 };
    return wanted;
  }, [wanted, needsLaunch, needsLanding]);

  // GSAP : chaque étape anime la cinématique vers son état.
  useEffect(() => {
    if (!target) return;
    timeline.current = animateTo(anim, target, reduced);
  }, [target, anim, reduced]);

  // Compte à rebours 3, 2, 1… puis décollage.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setLaunched(true);
      return;
    }
    const id = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  // Le laser revient au bout de 2,56 s : on affiche alors la mesure.
  useEffect(() => {
    if (!laserShots) return;
    const id = window.setTimeout(() => setLaserBack(true), 2600);
    return () => window.clearTimeout(id);
  }, [laserShots]);

  // Le message radio met un peu de temps : suspense avant la réponse (ou le silence).
  useEffect(() => {
    if (call !== 'sending') return;
    const id = window.setTimeout(() => setCall('done'), 2500);
    return () => window.clearTimeout(id);
  }, [call]);

  useEffect(() => () => stopSpeaking(), []);

  const selectBody = useCallback(
    (id: BodyId) => {
      stopSpeaking();
      setParams({ astre: id }, { replace: false });
    },
    [setParams],
  );
  const chooseMachine = (m: MachineSummary) => setParams({ astre: m.body, machine: m.id });
  const leaveMission = () => {
    stopSpeaking();
    setParams(body ? { astre: body } : {});
  };
  const start = () => {
    setStage('story');
    goToStep(0);
  };
  const next = useCallback(() => {
    if (!machine) return;
    if (step >= machine.story.length - 1) {
      setInspecting(false);
      setStage('outro');
      completeMachine(machine.id);
    } else goToStep(step + 1);
  }, [machine, step, completeMachine, goToStep]);
  const previous = () => {
    if (stage === 'outro') setStage('story');
    else goToStep(Math.max(0, step - 1));
  };
  const skip = () => timeline.current?.progress(1);

  // Texte courant (Sankofa ou la machine), lu à voix haute si la voix est activée.
  const machineName = machine?.name ?? summary?.name ?? '';
  const bodyName = body ? t(`bodies.${body}.name`) : '';
  const available = body ? machinesOn(catalog.machines, body) : [];
  const guideText =
    stage === 'explore'
      ? !body
        ? `${t('guide.welcome')} ${t('guide.chooseBody')}`
        : catalog.status !== 'ready'
          ? ''
          : available.length
            ? t('guide.chooseMachine', { body: bodyName })
            : t('guide.noMachine', { body: bodyName })
      : stage === 'pad'
        ? `${t('guide.ready')} ${t('guide.handover', { machine: machineName })}`
        : stage === 'outro'
          ? t('guide.outro', { machine: machineName })
          : '';
  const current = machine && step >= 0 ? machine.story[step] : undefined;
  const storyText = stage === 'story' && current ? current.text : '';
  const spoken = stage === 'story' ? storyText : guideText;
  // Seuls les récits des machines ont une voix ElevenLabs ; Sankofa parle avec la voix du navigateur.
  const spokenAudio = stage === 'story' ? (current?.audio ?? null) : null;

  useEffect(() => {
    if (!voiceOn || !spoken) return;
    speak(spoken, i18n.language, { audio: spokenAudio, onEnd: () => setFinished(spoken) });
  }, [spoken, spokenAudio, voiceOn, i18n.language]);

  // L'action proposée au joueur pour cette étape. Décoller et atterrir sont obligatoires
  // (l'histoire attend) ; inspecter, tirer le laser, voler et appeler sont des bonus.
  const action: StepAction | null =
    stage !== 'story' || !current
      ? null
      : needsLaunch
        ? 'countdown'
        : needsLanding
          ? 'land'
          : step === 0
            ? 'inspect'
            : current.effect === 'laser' && surface
              ? 'laser'
              : current.effect === 'flight'
                ? 'fly'
                : current.phase === 'end'
                  ? 'call'
                  : null;
  const blocking = action === 'countdown' || action === 'land';

  function act() {
    if (!machine) return;
    if (action === 'countdown' && countdown === null) {
      if (reduced) setLaunched(true);
      else setCountdown(3);
    } else if (action === 'land') setLanded(true);
    else if (action === 'inspect') setInspecting((open) => !open);
    else if (action === 'laser') {
      setLaserBack(false);
      setLaserShots((n) => n + 1);
    } else if (action === 'fly') setFlyingOn((on) => !on);
    else if (action === 'call' && call !== 'sending') setCall('sending');
  }

  // En lecture automatique, les actions obligatoires se déclenchent toutes seules.
  useEffect(() => {
    if (!autoplay || !blocking || countdown !== null) return;
    const id = window.setTimeout(() => (action === 'countdown' ? setCountdown(reduced ? 0 : 3) : setLanded(true)), 1500);
    return () => window.clearTimeout(id);
  }, [autoplay, blocking, action, countdown, reduced]);

  // Lecture automatique : on passe à l'étape suivante quand la cinématique et la narration sont finies.
  useEffect(() => {
    if (!autoplay || stage !== 'story' || !storyText || blocking || countdown !== null) return;
    const cinematic = timeline.current ? (timeline.current.duration() - timeline.current.time()) * 1000 : 0;
    if (voiceOn) {
      if (finished !== storyText) return; // la voix parle encore
      const id = window.setTimeout(next, Math.max(cinematic, 0) + 800);
      return () => window.clearTimeout(id);
    }
    const reading = Math.max(4500, storyText.length * 55);
    const id = window.setTimeout(next, Math.max(cinematic + 800, reading));
    return () => window.clearTimeout(id);
  }, [autoplay, stage, storyText, voiceOn, finished, next, blocking, countdown]);

  // Raccourcis clavier pendant le récit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage !== 'story' && stage !== 'outro') return;
      if (e.key === 'ArrowRight' && stage === 'story' && !blocking) next();
      if (e.key === 'ArrowLeft') previous();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const inMission = !!machine && stage !== 'explore';
  const progress = machine ? (stage === 'outro' ? 1 : Math.max(0, step) / Math.max(1, machine.story.length - 1)) : 0;
  const ended = stage === 'outro' || current?.phase === 'end';
  const activeNow = machine ? (ended ? machine.fate === 'active' : true) : true;

  // Compteur de dates pendant le voyage : de la date de lancement jusqu'à l'arrivée.
  const clock = useMemo(() => {
    if (!machine || stage !== 'story' || !current) return null;
    if (current.phase !== 'launch' && current.phase !== 'cruise' && current.phase !== 'arrival') return null;
    const to = current.phase === 'arrival' ? (current.date ?? machine.arrivalDate) : machine.arrivalDate;
    const from = machine.launchDate;
    return from && to && from < to ? { from, to } : null;
  }, [machine, stage, current]);
  const getProgress = useCallback(() => timeline.current?.progress() ?? 1, []);

  return (
    <section className="relative flex flex-1 flex-col bg-space text-white">
      <h1 className="sr-only">{t('mission.title')}</h1>
      <div className="relative h-[calc(100vh-3.5rem)] min-h-[34rem] w-full overflow-hidden">
        {webglAvailable && (
          <Suspense fallback={<Loading />}>
            <MissionScene
              focus={body ?? 'overview'}
              onSelect={selectBody}
              machine={machine}
              inMission={inMission}
              step={stage === 'outro' ? (machine?.story.length ?? 0) - 1 : step}
              anim={anim}
              animate={!reduced}
              flying={flyingOn}
              laserShots={laserShots}
            />
          </Suspense>
        )}

        {/* Compte à rebours, en grand au centre */}
        <AnimatePresence>
          {countdown !== null && countdown > 0 && (
            <motion.p
              key={countdown}
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="pointer-events-none absolute inset-0 z-40 grid place-items-center font-display text-[10rem] font-extrabold text-white drop-shadow-[0_0_30px_rgba(75,224,138,0.7)]"
              aria-live="assertive"
            >
              {countdown}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Inspection : la machine en 3D, à faire tourner, avec son anatomie */}
        {inspecting && machine && (
          <div className="absolute left-4 top-28 z-30 flex w-[min(24rem,calc(100%-2rem))] flex-col overflow-hidden rounded-2xl bg-space/90 ring-1 ring-active/40 backdrop-blur">
            <div className="h-56 sm:h-64">
              <Suspense fallback={<Loading />}>
                <MachineViewer
                  model={machine.model}
                  kind={machine.kind}
                  active={activeNow}
                  focusPart={inspectPart}
                  animate={!reduced}
                  label={t('anatomy.title') + ' · ' + machine.name}
                />
              </Suspense>
            </div>
            <div className="max-h-56 overflow-y-auto p-3">
              <AnatomyPanel parts={machine.anatomy} selected={inspectPart} onSelect={setInspectPart} />
              <button type="button" className="mt-3 text-xs text-slate-400 underline underline-offset-4" onClick={() => setInspecting(false)}>
                {t('anatomy.close')}
              </button>
            </div>
          </div>
        )}

        {/* Fiche en cours de chargement, ou API injoignable */}
        {slug && detail.status === 'loading' && <Loading />}
        {(catalog.status === 'error' || (slug && detail.status === 'error')) && (
          <p role="alert" className="absolute inset-x-0 top-20 z-40 mx-auto w-fit rounded-xl bg-red-500/90 px-4 py-2 text-sm">
            {t('errors.api')}
          </p>
        )}

        {/* Bandeau supérieur : machine en cours */}
        {inMission && machine && (
          <div className="absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-3 bg-gradient-to-b from-space/90 to-transparent p-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                {machine.mission} · {bodyName}
              </p>
              <p className="font-display text-3xl font-extrabold uppercase tracking-wide">{machineName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusPill active={activeNow} label={ended ? t(`mission.fates.${machine.fate}`) : undefined} />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {clock && <TravelClock from={clock.from} to={clock.to} getProgress={getProgress} />}
              <div className="flex gap-2">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    if (voiceOn) stopSpeaking();
                    setVoiceOn(!voiceOn);
                  }}
                  aria-pressed={voiceOn}
                >
                  {voiceOn ? '🔊' : '🔇'} <span className="sr-only sm:not-sr-only">{voiceOn ? t('guide.mute') : t('guide.unmute')}</span>
                </button>
                <button type="button" className={btnGhost} onClick={() => setAutoplay(!autoplay)} aria-pressed={autoplay}>
                  {autoplay ? '⏸' : '▶'} <span className="sr-only sm:not-sr-only">{t('mission.autoplay')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Constantes vitales */}
        {inMission && machine && stage !== 'pad' && machine.vitals.length > 0 && (
          <div className="absolute right-4 top-36 z-20 hidden w-60 sm:block">
            <VitalsPanel machine={machine} progress={progress} />
          </div>
        )}

        {/* Liste accessible des destinations (exploration) */}
        {stage === 'explore' && (
          <nav aria-label={t('tour.navLabel')} className="absolute right-3 top-3 z-20 max-h-[45%] overflow-auto rounded-xl bg-space/70 p-2 ring-1 ring-white/10 backdrop-blur sm:max-h-none">
            <ul className="flex flex-wrap gap-1.5 sm:flex-col">
              {BODY_ORDER.map((id) => {
                const count = machinesOn(catalog.machines, id).length;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => selectBody(id)}
                      aria-current={body === id ? 'true' : undefined}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm transition ${
                        body === id ? 'bg-white text-space' : 'hover:bg-white/10'
                      }`}
                    >
                      <span>{t(`bodies.${id}.name`)}</span>
                      {count > 0 && <span className="rounded-full bg-active/20 px-1.5 text-xs text-active">{count}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Bas d'écran : Sankofa, choix des machines, ou récit de la machine */}
        <div className="absolute inset-x-0 bottom-0 z-30 max-h-full overflow-y-auto bg-gradient-to-t from-space via-space/80 to-transparent px-4 pb-4 pt-20">
          <div className="mx-auto max-w-5xl">
            <AnimatePresence mode="wait">
              {stage === 'explore' && (
                <motion.div key={`explore-${body}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {guideText && <GuideBubble text={guideText} />}
                  {body && catalog.status === 'loading' && <p className="mt-4 text-sm text-slate-400">{t('chapter.loading')}</p>}
                  {body && available.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">{t('mission.machinesOn', { body: bodyName })}</p>
                      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {available.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => chooseMachine(m)}
                              className="group block w-full rounded-xl bg-white/5 p-3 text-left ring-1 ring-white/15 transition hover:bg-white/10 hover:ring-active/60"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="font-display text-xl font-extrabold uppercase">
                                  {m.name}
                                  {hasBadge(m.id) && (
                                    <span className="ml-1" title={t('badges.earned')} aria-label={t('badges.earned')}>
                                      🏅
                                    </span>
                                  )}
                                </span>
                                <StatusPill active={m.status === 'active'} />
                              </span>
                              <span className="mt-1 block text-xs text-slate-400">
                                {m.mission}
                                {m.launchDate && ` · ${t('mission.launched')} ${formatDate(m.launchDate, i18n.language)}`}
                              </span>
                              <span className="mt-1 block text-sm text-slate-300">{m.tagline}</span>
                              <span className="mt-2 block text-sm font-semibold text-active group-hover:underline">{t('mission.choose')} →</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {stage === 'pad' && machine && (
                <motion.div key="pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GuideBubble text={guideText}>
                    <button type="button" className={btnPrimary} onClick={start} autoFocus>
                      🚀 {t('mission.launch')}
                    </button>
                    <button type="button" className={btnLight} onClick={leaveMission}>
                      {t('mission.back')}
                    </button>
                  </GuideBubble>
                </motion.div>
              )}

              {stage === 'story' && machine && current && (
                <motion.div
                  key={`story-${step}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-space/85 p-4 ring-1 ring-white/15 backdrop-blur"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-white">{t(`mission.phases.${step === 0 ? 'presentation' : current.phase}`)}</span>
                    {current.date && <span className="text-slate-300">{formatDate(current.date, i18n.language)}</span>}
                    <span className="ml-auto text-slate-500">{t('mission.step', { n: step + 1, total: machine.story.length })}</span>
                  </div>
                  {step > 0 && <h2 className="mt-3 font-display text-2xl font-extrabold uppercase tracking-wide">{current.title}</h2>}
                  <div aria-live="polite">
                    <SpeechText text={storyText} className="mt-2 text-lg leading-relaxed sm:text-xl" />
                  </div>

                  {/* L'action du joueur à cette étape, et son résultat */}
                  {action && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-active/10 p-3 ring-1 ring-active/40">
                      <SankofaAvatar size={36} talking={blocking} />
                      <p className="min-w-40 flex-1 text-sm text-slate-200">{t(`actions.hints.${action}`)}</p>
                      <button
                        type="button"
                        className={btnPrimary}
                        onClick={act}
                        disabled={countdown !== null || call === 'sending'}
                        aria-pressed={action === 'fly' || action === 'inspect' ? (action === 'fly' ? flyingOn : inspecting) : undefined}
                        autoFocus={blocking}
                      >
                        {ACTION_ICON[action]} {action === 'fly' && flyingOn ? t('actions.flying') : t(`actions.${action}`)}
                      </button>
                      <div className="w-full text-sm" aria-live="polite">
                        {action === 'laser' && laserBack && (
                          <p className="text-active">{t('actions.laserResult', { s: LASER_SECONDS.toLocaleString(i18n.language), km: MOON_KM.toLocaleString(i18n.language) })}</p>
                        )}
                        {action === 'call' && call === 'sending' && <p className="animate-pulse text-slate-300">📡 · · ·</p>}
                        {action === 'call' && call === 'done' && (
                          <p className={machine.fate === 'active' ? 'text-active' : 'text-dormant'}>
                            {t(machine.fate === 'active' ? 'actions.callActive' : 'actions.callSilent', { name: machine.name })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" className={btnGhost} onClick={previous} disabled={step === 0}>
                      ← {t('mission.previous')}
                    </button>
                    <button type="button" className={blocking ? btnGhost : btnPrimary} onClick={next} disabled={blocking || countdown !== null}>
                      {t('mission.next')} →
                    </button>
                    <button type="button" className={`${btn} text-slate-300 underline-offset-4 hover:underline`} onClick={skip}>
                      {t('mission.skip')}
                    </button>
                    <span className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                      <SankofaAvatar size={28} /> {t('app.notToScale')}
                    </span>
                  </div>
                </motion.div>
              )}

              {stage === 'outro' && machine && (
                <motion.div key="outro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="grid gap-3 rounded-2xl bg-space/90 p-4 ring-1 ring-white/15 backdrop-blur md:grid-cols-3">
                    <div>
                      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-dormant">{t('mission.fateTitle')}</p>
                      <p className="mt-1 text-sm">{machine.statusNote}</p>
                    </div>
                    <div>
                      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-active">{t('mission.discovery')}</p>
                      <p className="mt-1 text-sm">{machine.discovery}</p>
                    </div>
                    <div>
                      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-slate-300">{t('mission.sources')}</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {machine.sources.map((s) => (
                          <li key={s.url}>
                            <a href={s.url} target="_blank" rel="noreferrer" className="text-sky-300 underline underline-offset-2">
                              {s.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {machine.quiz.length > 0 && (
                    <div className="rounded-2xl bg-space/90 p-4 ring-1 ring-white/15 backdrop-blur">
                      <p className="mb-3 font-display text-sm font-extrabold uppercase tracking-widest text-active">
                        {hasBadge(machine.id) ? `🏅 ${t('badges.earned')}` : t('quiz.title')}
                      </p>
                      <Quiz key={`${machine.id}-${i18n.language}`} questions={machine.quiz} onComplete={() => earnBadge(machine.id)} />
                    </div>
                  )}

                  <GuideBubble text={guideText} compact>
                    <button type="button" className={btnLight} onClick={leaveMission}>
                      {t('mission.restart')}
                    </button>
                    <button type="button" className={btnLight} onClick={() => setParams({})}>
                      {t('mission.otherBody')}
                    </button>
                    <button type="button" className={btnLight} onClick={() => setInspecting((open) => !open)} aria-pressed={inspecting}>
                      🔍 {t('actions.inspect')}
                    </button>
                    <Link to="/carnet" className={btnLight}>
                      {t('nav.logbook')}
                    </Link>
                    <button type="button" className={`${btn} text-slate-600 hover:underline`} onClick={previous}>
                      ← {t('mission.previous')}
                    </button>
                  </GuideBubble>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
