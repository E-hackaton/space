import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { SpeechText } from '../guide/SpeechText';
import { SankofaAvatar } from '../guide/SankofaAvatar';
import { Quiz } from '../story/Quiz';
import { formatDate, useMachine } from '../../lib/machines';
import { lookOf } from '../../lib/atlas';
import { findingPartsOf, findingsOf } from '../../content/findings';
import { useParts } from '../3d/InteractiveParts';
import { speak, stopSpeaking } from '../../audio/speech';
import { useStore } from '../../store/useStore';
import { useExpedition, type GuideMode } from '../../scenes/expedition/expedition';
import { Icon, MedalGlyph } from '../ui/Glyphs';

/** Distance Terre-Lune déduite du temps d'aller-retour de la lumière (c ≈ 300 000 km/s). */
const LASER_SECONDS = 2.56;
const MOON_KM = Math.round((LASER_SECONDS * 300_000) / 2 / 1000) * 1000;

interface Props {
  slug: string;
  mode: GuideMode;
  /** Fin de l'histoire (ou sortie) : on repart explorer. */
  onDone: () => void;
  /** Phrase de Sankofa à la fin (ex. « Cap sur Spirit ! »). */
  nextLine?: string;
}

/**
 * L'histoire d'une machine, racontée sur place à la première personne :
 * sous-titres façon cinéma, voix, constantes vitales, puis quiz et badge.
 */
export function StoryPlayer({ slug, mode, onDone, nextLine }: Props) {
  const { t, i18n } = useTranslation();
  const { machine, status } = useMachine(slug);
  const voiceOn = useStore((s) => s.voiceOn);
  const subtitleSize = useStore((s) => s.subtitleSize);
  const setVoiceOn = useStore((s) => s.setVoiceOn);
  const completeMachine = useStore((s) => s.completeMachine);
  const earnBadge = useStore((s) => s.earnBadge);
  const badges = useStore((s) => s.badges);
  const setStep = useExpedition((s) => s.setStep);
  const [step, setLocal] = useState(0);
  const [outro, setOutro] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [spokenDone, setSpokenDone] = useState<string | null>(null);

  const total = machine?.story.length ?? 0;
  const en = i18n.language === 'en';
  // Pièces clés de cette machine et ce qu'elles ont permis de découvrir.
  const chain = useMemo(() => {
    const look = lookOf(slug);
    const model = look.kind === 'nasa' || look.kind === 'anatomy' ? look.id : look.kind === 'sojourner' ? 'sojourner' : look.kind === 'reflector' ? 'reflector' : '';
    return model ? findingsOf(model) : [];
  }, [slug]);
  const chainParts = useMemo(() => {
    const look = lookOf(slug);
    const model = look.kind === 'nasa' || look.kind === 'anatomy' ? look.id : look.kind === 'sojourner' ? 'sojourner' : look.kind === 'reflector' ? 'reflector' : '';
    return model ? findingPartsOf(model) : [];
  }, [slug]);
  const current = machine?.story[step];

  useEffect(() => {
    if (current) setStep(step, current.effect, current.phase);
  }, [current, step, setStep]);
  // Au moment de la découverte (et à la fin), la pièce qui l'a rendue possible s'allume sur la machine.
  useEffect(() => {
    if (!chainParts.length) return;
    const show = outro || current?.phase === 'discovery' || current?.phase === 'work';
    const idx = current?.phase === 'work' ? chainParts.length - 1 : 0;
    useParts.setState({ pinned: show ? chainParts[Math.min(idx, chainParts.length - 1)] : null });
  }, [current?.phase, outro, chainParts]);

  const next = useCallback(() => {
    if (!machine) return;
    if (step >= total - 1) {
      setOutro(true);
      completeMachine(machine.id);
    } else setLocal(step + 1);
  }, [machine, step, total, completeMachine]);

  // Narration : la voix de la machine (ElevenLabs) ou celle du navigateur ; Sankofa conclut.
  const outroText = machine ? `${machine.statusNote} ${nextLine ?? ''}`.trim() : '';
  const text = outro ? outroText : (current?.text ?? '');
  useEffect(() => {
    if (!text) return;
    if (!voiceOn) {
      stopSpeaking();
      return;
    }
    speak(text, i18n.language, { audio: outro ? null : (current?.audio ?? null), onEnd: () => setSpokenDone(text) });
  }, [text, voiceOn, outro, current?.audio, i18n.language]);
  useEffect(() => () => stopSpeaking(), []);

  // Pilote auto : on enchaîne quand la voix a fini (ou après un temps de lecture si le son est coupé).
  useEffect(() => {
    if (mode !== 'auto' || !text || quiz) return;
    if (voiceOn && spokenDone !== text) return;
    const wait = voiceOn ? (outro ? 2500 : 900) : Math.max(4200, text.length * 55);
    const id = window.setTimeout(outro ? onDone : next, wait);
    return () => window.clearTimeout(id);
  }, [mode, text, voiceOn, spokenDone, outro, quiz, next, onDone]);

  // Clavier : → suivant, ← précédent, Échap pour quitter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && !outro) next();
      if (e.key === 'ArrowLeft' && !outro) setLocal((s) => Math.max(0, s - 1));
      if (e.key === 'Escape') onDone();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, outro, onDone]);

  if (status === 'error') {
    return (
      <div className="story-shell">
        <p role="alert" className="text-red-300">{t('errors.api')}</p>
        <button type="button" className="btn-ghost mt-3" onClick={onDone}>{t('expedition.continue')}</button>
      </div>
    );
  }
  if (!machine || !current)
    return (
      <div className="story-shell" role="status">
        <div className="flex items-center justify-center gap-3 text-slate-200">
          <span className="loader-ring !h-7 !w-7" aria-hidden="true" />
          <span className="font-display text-xl tracking-wide">{t('chapter.loading')}</span>
        </div>
      </div>
    );


  return (
    <>
      {/* Bandeau : qui raconte */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="story-head">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300">{machine.mission}</p>
        <p className="font-display text-3xl font-extrabold uppercase leading-none tracking-wide sm:text-4xl">{machine.name}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <button type="button" className="chip" onClick={() => (voiceOn ? (stopSpeaking(), setVoiceOn(false)) : setVoiceOn(true))} aria-pressed={voiceOn}>
            <Icon name={voiceOn ? 'sound' : 'mute'} />
            <span className="sr-only">{voiceOn ? t('guide.mute') : t('guide.unmute')}</span>
          </button>
          <button type="button" className="chip" onClick={onDone}>
            <Icon name="close" /> <span className="sr-only sm:not-sr-only">{t('expedition.leaveStory')}</span>
          </button>
        </div>
      </motion.div>

      {/* Sous-titres */}
      <div className="story-shell">
        <AnimatePresence mode="wait">
          {!outro ? (
            <motion.div key={step} initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.25em] text-active">
                <span>{t(`mission.phases.${step === 0 ? 'presentation' : current.phase}`)}</span>
                {current.date && <span className="text-slate-300">· {formatDate(current.date, i18n.language)}</span>}
              </div>
              <div aria-live="polite">
                <SpeechText key={`${step}-${i18n.language}`} text={current.text} className={`story-subtitle ${subtitleSize === 'large' ? 'story-subtitle-large' : ''}`} />
              </div>
              {current.effect === 'laser' && (
                <p className="mt-2 text-center text-sm text-active"><Icon name="bolt" /> {t('actions.laserResult', { s: LASER_SECONDS.toLocaleString(i18n.language), km: MOON_KM.toLocaleString(i18n.language) })}</p>
              )}
            </motion.div>
          ) : (
            <motion.div key="outro" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
              <div className="flex items-start gap-3">
                <SankofaAvatar size={52} talking />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-extrabold uppercase tracking-widest text-active">{t('mission.discovery')}</p>
                  <p className="text-base sm:text-lg">{machine.discovery}</p>
                </div>
              </div>
              {/* Le fil rouge : de la pièce à la découverte */}
              {chain.length > 0 && (
                <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-active/30">
                  <p className="font-display text-sm font-extrabold uppercase tracking-widest text-active">{t('findings.title')}</p>
                  <ul className="mt-2 space-y-2">
                    {chain.map((f) => (
                      <li key={f.partFr} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                        <span className="shrink-0 font-semibold text-white sm:w-44">{en ? f.partEn : f.partFr}</span>
                        <span className="text-sm text-slate-200">
                          → {en ? f.en : f.fr}{' '}
                          <a href={f.source} target="_blank" rel="noreferrer" className="whitespace-nowrap text-xs text-sky-300 underline underline-offset-2">
                            NASA
                          </a>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {quiz && machine.quiz.length > 0 && (
                <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <Quiz key={`${machine.id}-${i18n.language}`} questions={machine.quiz} onComplete={() => earnBadge(machine.id)} />
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                {machine.quiz.length > 0 && !quiz && (
                  <button type="button" className="btn-primary" onClick={() => setQuiz(true)}>
                    <MedalGlyph earned={badges.includes(machine.id)} /> {badges.includes(machine.id) ? t('badges.earned') : t('expedition.quiz')}
                  </button>
                )}
                <button type="button" className={quiz ? 'btn-primary' : 'btn-ghost'} onClick={onDone}>
                  {t('expedition.continue')} →
                </button>
                <a href={machine.sources[0]?.url ?? machine.nssdcaUrl} target="_blank" rel="noreferrer" className="btn-ghost">
                  <Icon name="sources" /> {t('mission.sources')}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progression et commandes */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {!outro && (
            <button type="button" className="chip" onClick={() => setLocal(Math.max(0, step - 1))} disabled={step === 0} aria-label={t('mission.previous')}>
              ←
            </button>
          )}
          <ol className="flex gap-1.5" aria-label={t('mission.step', { n: step + 1, total })}>
            {machine.story.map((_, i) => (
              <li key={i} className={`h-1.5 rounded-full transition-all ${i === step && !outro ? 'w-6 bg-active' : i < step || outro ? 'w-1.5 bg-white/70' : 'w-1.5 bg-white/25'}`} />
            ))}
          </ol>
          {!outro && (
            <button type="button" className={mode === 'manual' ? 'btn-primary !py-1' : 'chip'} onClick={next} aria-label={t('mission.next')}>
              {mode === 'manual' ? `${t('mission.next')} →` : '→'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
