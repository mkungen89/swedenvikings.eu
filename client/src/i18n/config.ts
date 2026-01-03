import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import sv from './locales/sv.json';
import en from './locales/en.json';

const resources = {
  sv: {
    translation: sv,
  },
  en: {
    translation: en,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources,
    fallbackLng: 'sv', // Fallback to Swedish
    lng: 'sv', // Default language

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator'],
      // Keys to store language preference
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
