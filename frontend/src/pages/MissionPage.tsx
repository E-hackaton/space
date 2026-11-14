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
import { formatDate, machinesOn, useCatalog, useMachine, type MachineSummary } from '../lib/machines';
import { webglAvailable } from '../lib/device';
import { usePrefersReducedMotion } from '../lib/hooks';
import { useStore } from '../store/useStore';
import { animateTo, createMissionAnim, targetsFor } from '../scenes/mission/missionAnim';
import { speak, stopSpeaking } from '../audio/speech';

const MissionScene = lazy(() => import('../scenes/MissionScene'));

type Stage = 'explore' | 'pad' | 'story' | 'outro';

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

  // Si la machine change (lien direct, retour arrière), on repart du pas de tir.
  useEffect(() => {
    setStage(slug ? 'pad' : 'explore');
    setStep(-1);
  }, [slug]);

  // GSAP : chaque étape anime la cinématique vers son état.
  useEffect(() => {
    if (!machine) return;
    timeline.current = animateTo(anim, targetsFor(machine, step), reduced);
  }, [machine, step, anim, reduced]);

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
    setStep(0);
  };
  const next = useCallback(() => {
    if (!machine) return;
    if (step >= machine.story.length - 1) {
      setStage('outro');
      completeMachine(machine.id);
    } else setStep((s) => s + 1);
  }, [machine, step, completeMachine]);
  const previous = () => {
    if (stage === 'outro') setStage('story');
    else setStep((s) => Math.max(0, s - 1));
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

  // Lecture automatique : on passe à l'étape suivante quand la cinématique et la narration sont finies.
  useEffect(() => {
    if (!autoplay || stage !== 'story' || !storyText) return;
    const cinematic = timeline.current ? (timeline.current.duration() - timeline.current.time()) * 1000 : 0;
    if (voiceOn) {
      if (finished !== storyText) return; // la voix parle encore
      const id = window.setTimeout(next, Math.max(cinematic, 0) + 800);
      return () => window.clearTimeout(id);
    }
    const reading = Math.max(4500, storyText.length * 55);
    const id = window.setTimeout(next, Math.max(cinematic + 800, reading));
    return () => window.clearTimeout(id);
  }, [autoplay, stage, storyText, voiceOn, finished, next]);

  // Raccourcis clavier pendant le récit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage !== 'story' && stage !== 'outro') return;
      if (e.key === 'ArrowRight' && stage === 'story') next();
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
            />
          </Suspense>
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
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" className={btnGhost} onClick={previous} disabled={step === 0}>
                      ← {t('mission.previous')}
                    </button>
                    <button type="button" className={btnPrimary} onClick={next}>
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
