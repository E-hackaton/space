import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import type { AnatomyPart } from '../../content/anatomy';
import { speak } from '../../audio/speech';
import { useStore } from '../../store/useStore';

interface Props {
  parts: AnatomyPart[];
  /** Étiquette de la pièce choisie (ex. « parts.arm »), ou null. */
  selected: string | null;
  onSelect: (label: string | null) => void;
}

/**
 * Anatomie d'une machine : une puce par pièce ; la pièce choisie est expliquée
 * (à quoi elle sert, pourquoi c'est important) et Sankofa la lit à voix haute.
 */
export function AnatomyPanel({ parts, selected, onSelect }: Props) {
  const { t, i18n } = useTranslation();
  const voiceOn = useStore((s) => s.voiceOn);
  const current = parts.find((p) => p.label === selected);

  function choose(part: AnatomyPart) {
    if (part.label === selected) {
      onSelect(null);
      return;
    }
    onSelect(part.label);
    if (voiceOn) {
      const name = t(part.label);
      speak(`${name}. ${t(`anatomy.${part.key}.does`)} ${t(`anatomy.${part.key}.why`)}`, i18n.language);
    }
  }

  return (
    <div>
      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-active">{t('anatomy.title')}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t('anatomy.title')}>
        {parts.map((part) => (
          <li key={part.label}>
            <button
              type="button"
              onClick={() => choose(part)}
              aria-pressed={part.label === selected}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition ${
                part.label === selected ? 'bg-active text-space ring-active' : 'ring-white/30 hover:bg-white/10'
              }`}
            >
              {t(part.label)}
            </button>
          </li>
        ))}
      </ul>
      <div aria-live="polite">
        <AnimatePresence mode="wait">
          {current ? (
            <motion.dl
              key={current.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 space-y-2 text-sm"
            >
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('anatomy.does')}</dt>
                <dd>{t(`anatomy.${current.key}.does`)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('anatomy.why')}</dt>
                <dd>{t(`anatomy.${current.key}.why`)}</dd>
              </div>
            </motion.dl>
          ) : (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-slate-400">
              {t('anatomy.hint')}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
