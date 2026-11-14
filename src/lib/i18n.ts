import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from '../content/i18n/fr.json';
import en from '../content/i18n/en.json';
import { useStore } from '../store/useStore';

export const LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: useStore.getState().language,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

// Garde i18next et l'attribut lang du document synchronisés avec le store.
useStore.subscribe((state) => {
  if (i18n.language !== state.language) i18n.changeLanguage(state.language);
  document.documentElement.lang = state.language;
});
document.documentElement.lang = useStore.getState().language;

export default i18n;
