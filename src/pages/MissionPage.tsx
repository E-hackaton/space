import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { Loading } from '../components/ui/Loading';
import { GuideBubble } from '../components/guide/GuideBubble';
import { OrbiAvatar } from '../components/guide/OrbiAvatar';
import { SpeechText } from '../components/guide/SpeechText';
import { VitalsPanel } from '../components/story/VitalsPanel';
import { StatusPill } from '../components/story/StatusPill';
import { TravelClock } from '../components/story/TravelClock';
import { BODY_ORDER, type BodyId } from '../lib/solarSystem';
import { formatDate, getMachine, machinesOn, type Machine } from '../lib/machines';
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

  const machine = getMachine(params.get('machine'));
  const rawBody = params.get('astre');
  const body: BodyId | null = machine?.body ?? (BODY_ORDER.includes(rawBody as BodyId) ? (rawBody as BodyId) : null);

  const [stage, setStage] = useState<Stage>(machine ? 'pad' : 'explore');
  const [step, setStep] = useState(-1);
  const anim = useMemo(() => createMissionAnim(), [machine?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const timeline = useRef<ReturnType<typeof animateTo> | null>(null);

  // Si la machine change (lien direct, retour arrière), on repart du pas de tir.
  useEffect(() => {
    setStage(machine ? 'pad' : 'explore');
    setStep(-1);
  }, [machine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const chooseMachine = (m: Machine) => setParams({ astre: m.body, machine: m.id });
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

  // Texte courant (guide ou machine), lu à voix haute si la voix est activée.
  const machineName = machine ? t(machine.name) : '';
  const bodyName = body ? t(`bodies.${body}.name`) : '';
  const available = body ? machinesOn(body) : [];
  const guideText =
    stage === 'explore'
      ? !body
        ? `${t('guide.welcome')} ${t('guide.chooseBody')}`
        : available.length
          ? t('guide.chooseMachine', { body: bodyName })
          : t('guide.noMachine', { body: bodyName })
      : stage === 'pad'
        ? `${t('guide.ready')} ${t('guide.handover', { machine: machineName })}`
        : stage === 'outro'
          ? t('guide.outro', { machine: machineName })
          : '';
  const storyText = machine && stage === 'story' && step >= 0 ? t(machine.story[step].textKey) : '';
  const spoken = stage === 'story' ? storyText : guideText;

  useEffect(() => {
    if (!voiceOn || !spoken) return;
    speak(spoken, i18n.language);
  }, [spoken, voiceOn, i18n.language]);

  // Lecture automatique : on passe à l'étape suivante quand la cinématique et le texte sont finis.
  useEffect(() => {
    if (!autoplay || stage !== 'story' || !storyText) return;
    const cinematic = timeline.current ? (timeline.current.duration() - timeline.current.time()) * 1000 : 0;
    const reading = Math.max(4500, storyText.length * (voiceOn ? 75 : 55));
    const id = window.setTimeout(next, Math.max(cinematic + 800, reading));
    return () => window.clearTimeout(id);
  }, [autoplay, stage, storyText, voiceOn, next]);

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
  const current = machine && step >= 0 ? machine.story[step] : undefined;
  const progress = machine ? (stage === 'outro' ? 1 : Math.max(0, step) / Math.max(1, machine.story.length - 1)) : 0;
  const ended = stage === 'outro' || current?.phase === 'end';
  const activeNow = machine ? (ended ? machine.fate === 'active' : true) : true;

  // Compteur de dates : du dernier repère daté jusqu'à la date de l'étape (voyage et arrivée).
  const clock = useMemo(() => {
    if (!machine || stage !== 'story' || !current) return null;
    if (current.phase !== 'cruise' && current.phase !== 'arrival') return null;
    const to = current.date ?? (current.phase === 'arrival' ? machine.arrivalDate : machine.story.slice(step + 1).find((s) => s.date)?.date ?? machine.arrivalDate);
    const from = machine.story.slice(0, step).reverse().find((s) => s.date)?.date ?? machine.launchDate;
    return to ? { from, to } : null;
  }, [machine, stage, current, step]);
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

        {/* Bandeau supérieur : machine en cours */}
        {inMission && machine && (
          <div className="absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-3 bg-gradient-to-b from-space/90 to-transparent p-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                {t(machine.mission)} · {bodyName}
              </p>
              <p className="font-display text-3xl font-extrabold uppercase tracking-wide">{machineName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusPill active={activeNow} label={ended ? t(`mission.fates.${machine.fate}`) : undefined} />
                {import.meta.env.DEV && !machine.verified && (
                  <span className="rounded bg-dormant/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dormant">
                    {t('mission.unverified')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {clock && <TravelClock from={clock.from} to={clock.to} getProgress={getProgress} />}
              <div className="flex gap-2">
                <button type="button" className={btnGhost} onClick={() => setVoiceOn(!voiceOn)} aria-pressed={voiceOn}>
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
        {inMission && machine && stage !== 'pad' && (
          <div className="absolute right-4 top-36 z-20 hidden w-60 sm:block">
            <VitalsPanel machine={machine} progress={progress} />
          </div>
        )}

        {/* Liste accessible des destinations (exploration) */}
        {stage === 'explore' && (
          <nav aria-label={t('tour.navLabel')} className="absolute right-3 top-3 z-20 max-h-[45%] overflow-auto rounded-xl bg-space/70 p-2 ring-1 ring-white/10 backdrop-blur sm:max-h-none">
            <ul className="flex flex-wrap gap-1.5 sm:flex-col">
              {BODY_ORDER.map((id) => {
                const count = machinesOn(id).length;
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

        {/* Bas d'écran : Orbi, choix des machines, ou récit de la machine */}
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-space via-space/80 to-transparent px-4 pb-4 pt-20">
          <div className="mx-auto max-w-5xl">
            <AnimatePresence mode="wait">
              {stage === 'explore' && (
                <motion.div key={`explore-${body}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GuideBubble text={guideText} />
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
                                <span className="font-display text-xl font-extrabold uppercase">{t(m.name)}</span>
                                <StatusPill active={m.status === 'active'} />
                              </span>
                              <span className="mt-1 block text-xs text-slate-400">
                                {t(m.mission)} · {t('mission.launched')} {formatDate(m.launchDate, i18n.language)}
                              </span>
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
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-white">{t(`mission.phases.${current.phase}`)}</span>
                    {current.date && <span className="text-slate-300">{formatDate(current.date, i18n.language)}</span>}
                    <span className="ml-auto text-slate-500">{t('mission.step', { n: step + 1, total: machine.story.length })}</span>
                  </div>
                  <div aria-live="polite">
                    <SpeechText text={storyText} className="mt-3 text-lg leading-relaxed sm:text-xl" />
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
                      <OrbiAvatar size={28} /> {t('app.notToScale')}
                    </span>
                  </div>
                </motion.div>
              )}

              {stage === 'outro' && machine && (
                <motion.div key="outro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="grid gap-3 rounded-2xl bg-space/90 p-4 ring-1 ring-white/15 backdrop-blur md:grid-cols-3">
                    <div>
                      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-dormant">{t('mission.fateTitle')}</p>
                      <p className="mt-1 text-sm">{t(`machines.${machine.id}.fate`)}</p>
                    </div>
                    <div>
                      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-active">{t('mission.earthImpact')}</p>
                      <p className="mt-1 text-sm">{t(machine.earthImpact)}</p>
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
                  <GuideBubble text={guideText} compact>
                    <button type="button" className={btnLight} onClick={leaveMission}>
                      {t('mission.restart')}
                    </button>
                    <button type="button" className={btnLight} onClick={() => setParams({})}>
                      {t('mission.otherBody')}
                    </button>
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
