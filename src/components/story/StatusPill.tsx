import { useTranslation } from 'react-i18next';

/** État d'une machine : jamais la couleur seule, toujours une icône et un texte. */
export function StatusPill({ active, label }: { active: boolean; label?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
        active ? 'bg-active/15 text-active ring-active/40' : 'bg-dormant/15 text-dormant ring-dormant/40'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? 'animate-pulse bg-active' : 'bg-dormant'}`} aria-hidden="true" />
      <span aria-hidden="true">{active ? '◉' : '☾'}</span>
      {label ?? (active ? t('status.active') : t('status.dormant'))}
    </span>
  );
}
