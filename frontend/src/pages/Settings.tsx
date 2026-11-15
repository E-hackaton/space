import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '../components/ui/LanguageSwitch';
import { stopSpeaking } from '../audio/speech';
import { playDetect, unlockSfx } from '../audio/sfx';
import { ROVER_COLORS, useStore, type Motion, type Quality, type RoverColor, type SubtitleSize, type Theme } from '../store/useStore';

/** Un groupe de réglages. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md bg-white p-5 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
      <h2 className="font-display text-xl font-extrabold uppercase tracking-wide">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Une ligne : libellé à gauche, contrôle à droite. */
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        {hint && <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** Choix exclusif (boutons segmentés). */
function Choice<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex overflow-hidden rounded-[4px] ring-1 ring-slate-300 dark:ring-white/20">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 text-sm transition ${value === o.v ? 'bg-slate-900 text-white dark:bg-white dark:text-space' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-active' : 'bg-slate-300 dark:bg-white/20'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[1.375rem]' : 'left-0.5'}`} />
    </button>
  );
}

/** Paramètres : thème, langue, voix, sons, couleur du rover, sous-titres, animations, qualité, progression. */
export default function Settings() {
  const { t } = useTranslation();
  const st = useStore();
  const [confirm, setConfirm] = useState(false);
  useEffect(() => () => stopSpeaking(), []);

  const set = st.setPrefs;
  return (
    <div className="flex-1 bg-slate-50 px-4 py-10 text-slate-900 dark:bg-space dark:text-slate-100">
      <div className="mx-auto max-w-3xl space-y-5">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">{t('settings.title')}</h1>

        <Section title={t('settings.display')}>
          <Row label={t('settings.theme')} hint={t('settings.themeHint')}>
            <Choice<Theme> label={t('settings.theme')} value={st.theme} onChange={(theme) => set({ theme })} options={[{ v: 'system', label: t('settings.system') }, { v: 'light', label: t('settings.light') }, { v: 'dark', label: t('settings.dark') }]} />
          </Row>
          <Row label={t('settings.language')}>
            {/* Le sélecteur est fait pour un fond sombre : on le pose sur une pastille sombre. */}
            <div className="rounded-full bg-space p-1">
              <LanguageSwitch />
            </div>
          </Row>
          <Row label={t('settings.motion')} hint={t('settings.motionHint')}>
            <Choice<Motion> label={t('settings.motion')} value={st.motion} onChange={(motion) => set({ motion })} options={[{ v: 'system', label: t('settings.system') }, { v: 'reduce', label: t('settings.reduced') }, { v: 'full', label: t('settings.full') }]} />
          </Row>
          <Row label={t('settings.quality')} hint={t('settings.qualityHint')}>
            <Choice<Quality> label={t('settings.quality')} value={st.quality} onChange={(quality) => set({ quality })} options={[{ v: 'auto', label: t('settings.auto') }, { v: 'high', label: t('settings.high') }, { v: 'low', label: t('settings.low') }]} />
          </Row>
        </Section>

        <Section title={t('settings.narration')}>
          <Row label={t('settings.voiceOn')}>
            <Toggle label={t('settings.voiceOn')} on={st.voiceOn} onChange={(v) => (v ? st.setVoiceOn(true) : (stopSpeaking(), st.setVoiceOn(false)))} />
          </Row>
          <Row label={t('settings.subtitles')}>
            <Choice<SubtitleSize> label={t('settings.subtitles')} value={st.subtitleSize} onChange={(subtitleSize) => set({ subtitleSize })} options={[{ v: 'normal', label: t('settings.normal') }, { v: 'large', label: t('settings.large') }]} />
          </Row>
        </Section>

        <Section title={t('settings.sound')}>
          <Row label={t('app.sfx')}>
            <Toggle label={t('app.sfx')} on={st.sfxOn} onChange={(v) => st.setSfxOn(v)} />
          </Row>
          <Row label={t('settings.volume')} hint={`${Math.round(st.sfxVolume * 100)} %`}>
            <input type="range" min={0} max={1} step={0.05} value={st.sfxVolume} onChange={(e) => set({ sfxVolume: Number(e.target.value) })} className="w-48 accent-[#4BE08A]" aria-label={t('settings.volume')} />
            <button
              type="button"
              className="btn-ghost !py-1.5 !text-slate-900 dark:!text-white"
              onClick={() => {
                unlockSfx();
                playDetect();
              }}
            >
              {t('settings.test')}
            </button>
          </Row>
        </Section>

        <Section title={t('settings.rover')}>
          <Row label={t('settings.roverColor')}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('settings.roverColor')}>
              {(Object.keys(ROVER_COLORS) as RoverColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={st.roverColor === c}
                  aria-label={t(`settings.colors.${c}`)}
                  title={t(`settings.colors.${c}`)}
                  onClick={() => set({ roverColor: c })}
                  className={`grid h-11 w-11 place-items-center rounded-[4px] ring-2 transition ${st.roverColor === c ? 'ring-active' : 'ring-transparent hover:ring-slate-300 dark:hover:ring-white/30'}`}
                >
                  <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
                    <rect x="4" y="14" width="32" height="14" rx="5" fill={ROVER_COLORS[c].body} stroke="#0003" />
                    <rect x="9" y="8" width="22" height="9" rx="4" fill={ROVER_COLORS[c].accent} />
                    {[10, 20, 30].map((x) => (
                      <circle key={x} cx={x} cy="31" r="4" fill="#23252d" />
                    ))}
                  </svg>
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title={t('settings.progress')}>
          <Row label={t('settings.reset')} hint={t('settings.resetHint')}>
            {!confirm ? (
              <button type="button" className="btn-ghost !py-1.5 !text-red-600 dark:!text-red-300" onClick={() => setConfirm(true)}>
                {t('settings.reset')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-primary !bg-red-500 !py-1.5 !text-white"
                  onClick={() => {
                    st.resetProgress();
                    setConfirm(false);
                  }}
                >
                  {t('settings.confirm')}
                </button>
                <button type="button" className="btn-ghost !py-1.5 !text-slate-900 dark:!text-white" onClick={() => setConfirm(false)}>
                  {t('settings.cancel')}
                </button>
              </>
            )}
          </Row>
        </Section>
      </div>
    </div>
  );
}
