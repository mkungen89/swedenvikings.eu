import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentStore {
  hasConsent: boolean | null;
  preferences: CookiePreferences;
  consentDate: string | null;
  setConsent: (consent: boolean) => void;
  updatePreferences: (preferences: CookiePreferences) => void;
  revokeConsent: () => void;
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: true,
  marketing: false,
};

export const useCookieConsentStore = create<CookieConsentStore>()(
  persist(
    (set) => ({
      hasConsent: null,
      preferences: defaultPreferences,
      consentDate: null,

      setConsent: (consent: boolean) =>
        set({
          hasConsent: consent,
          consentDate: new Date().toISOString(),
        }),

      updatePreferences: (preferences: CookiePreferences) =>
        set({ preferences }),

      revokeConsent: () =>
        set({
          hasConsent: null,
          preferences: defaultPreferences,
          consentDate: null,
        }),
    }),
    {
      name: 'cookie-consent',
    }
  )
);
