import { LANGUAGES } from '../i18n/languageStore'
import { useI18n } from '../i18n/useI18n'
import styles from './LanguageSwitch.module.css'

const LABELS = { fr: 'FR', en: 'EN' } as const
/** Nom complet dans la langue elle-même : c'est ce qu'un lecteur d'écran doit annoncer. */
const NAMES = { fr: 'Français', en: 'English' } as const

/** Bascule de langue : tout le site (interface, contenus, voix) suit le choix. */
export function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div className={styles.switch} role="group" aria-label={t.common.language}>
      {LANGUAGES.map((value) => (
        <button
          key={value}
          type="button"
          lang={value}
          className={styles.option}
          aria-pressed={language === value}
          aria-label={NAMES[value]}
          onClick={() => setLanguage(value)}
        >
          {LABELS[value]}
        </button>
      ))}
    </div>
  )
}
