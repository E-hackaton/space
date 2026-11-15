import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Icon } from '../ui/Glyphs';

/*
 * Figures 3D interactives des engins : un SVG autonome par machine (docs/mars1 pour Mars, avec les
 * modèles NASA 3D Resources ; docs/lune1 pour la Lune, d'après les figures Anatomy), pièces annotées. On le fait tourner,
 * on zoome, on survole une pièce pour lire son nom et son rôle.
 */
const FIGURES: Record<string, string> = {
  ingenuity: '/engins/01-ingenuity.svg',
  insight: '/engins/02-insight.svg',
  'viking-1': '/engins/04-viking.svg',
  opportunity: '/engins/05-opportunity.svg',
  'near-shoemaker': '/engins/06-near.svg',
  'pioneer-10': '/engins/07-pioneer.svg',
  // Lune : figures construites avec le même outil (docs/lune1) à partir des figures Anatomy.
  'surveyor-3': '/engins/10-surveyor.svg',
  'apollo-11-eagle': '/engins/11-eagle.svg',
  'apollo-11-lm': '/engins/11-eagle.svg',
  'apollo-15-lrv': '/engins/12-lrv.svg',
  // Réflecteur et sismomètre du site d'Apollo 11 (Explorer). Le réflecteur d'Apollo 15, plus grand,
  // n'a pas de figure : celle d'Apollo 11 ne le représente pas.
  'apollo-11': '/engins/13-lrrr-apollo11.svg',
  'apollo-11-easep': '/engins/14-psep-apollo11.svg',
};

export const figureOf = (id: string): string | undefined => FIGURES[id];

/** La figure dans un cadre (le SVG a besoin de ses scripts : iframe, pas <img>). */
export function EngineFigure({ id, name, className = '' }: { id: string; name: string; className?: string }) {
  const { t } = useTranslation();
  const src = figureOf(id);
  if (!src) return null;
  return <iframe src={src} title={t('figure.title', { name })} loading="lazy" className={`block h-full w-full border-0 bg-[#0b0f18] ${className}`} />;
}

/** Fenêtre plein écran pour examiner la machine. */
export function FigureOverlay({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex flex-col bg-space/95 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={t('figure.title', { name })}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-display text-2xl font-extrabold uppercase tracking-wide">{name}</p>
        <button type="button" className="btn-ghost" onClick={onClose} autoFocus>
          <Icon name="close" /> {t('figure.close')}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-[4px] ring-1 ring-white/15">
        <EngineFigure id={id} name={name} />
      </div>
      <p className="mt-2 text-xs text-slate-400">{t('figure.hint')}</p>
    </motion.div>
  );
}
