import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SankofaAvatar } from './SankofaAvatar';
import { SpeechText } from './SpeechText';

/** Sankofa et sa bulle de dialogue. */
export function GuideBubble({ text, children, compact = false }: { text: string; children?: ReactNode; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="pointer-events-auto flex items-end gap-3">
      <SankofaAvatar size={compact ? 56 : 92} talking />
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className="relative max-w-md rounded-2xl rounded-bl-sm bg-white/95 px-4 py-3 text-slate-900 shadow-xl"
          role="status"
        >
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-emerald-700">
            {t('guide.name')} <span className="font-sans text-xs font-normal normal-case tracking-normal text-slate-500">· {t('guide.role')}</span>
          </p>
          <SpeechText text={text} className="mt-1 text-[15px] leading-snug" />
          {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
