import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';

export function LanguageSwitch() {
  const { t } = useTranslation();
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  return (
    <div role="group" aria-label={t('nav.language')} className="flex overflow-hidden rounded-full border border-white/25 text-sm">
      {(['fr', 'en'] as const).map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => setLanguage(lng)}
          aria-pressed={language === lng}
          className={`px-3 py-1 uppercase transition ${language === lng ? 'bg-white text-space' : 'text-white hover:bg-white/10'}`}
        >
          {lng}
        </button>
      ))}
    </div>
  );
}
