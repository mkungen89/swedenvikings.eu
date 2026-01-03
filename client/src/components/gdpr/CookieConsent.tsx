import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { useCookieConsentStore } from '@/store/cookieConsentStore';
import { useTranslation } from 'react-i18next';

export default function CookieConsent() {
  const { hasConsent, preferences, setConsent, updatePreferences } = useCookieConsentStore();
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Show banner if user hasn't consented yet
    if (hasConsent === null) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasConsent]);

  const handleAcceptAll = () => {
    setConsent(true);
    updatePreferences({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: false,
    });
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    setConsent(true);
    updatePreferences({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    setConsent(true);
    setShowSettings(false);
    setShowBanner(false);
  };

  if (!showBanner && hasConsent !== null) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-background-card border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl">
              {!showSettings ? (
                // Main Banner
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center">
                        <Cookie className="w-6 h-6 text-primary-400" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold mb-2">
                        {t('cookie.title')}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4">
                        {t('cookie.description')}
                      </p>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleAcceptAll}
                          className="btn-primary"
                        >
                          <Check className="w-4 h-4" />
                          {t('cookie.acceptAll')}
                        </button>
                        <button
                          onClick={handleRejectAll}
                          className="btn-secondary"
                        >
                          <X className="w-4 h-4" />
                          {t('cookie.rejectAll')}
                        </button>
                        <button
                          onClick={() => setShowSettings(true)}
                          className="btn-ghost"
                        >
                          <Settings className="w-4 h-4" />
                          {t('cookie.customize')}
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 mt-4">
                        {t('cookie.learnMore')}{' '}
                        <a href="/privacy" className="text-primary-400 hover:underline">
                          {t('gdpr.privacyPolicy').toLowerCase()}
                        </a>{' '}
                        {t('cookie.and')}{' '}
                        <a href="/terms" className="text-primary-400 hover:underline">
                          {t('gdpr.termsOfService').toLowerCase()}
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Settings Panel
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg font-semibold">
                      {t('cookie.settings')}
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Necessary Cookies */}
                    <div className="flex items-start justify-between p-4 bg-background-darker rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{t('cookie.necessary')}</h4>
                          <span className="text-xs px-2 py-0.5 bg-primary-600/20 text-primary-400 rounded">
                            {t('cookie.mandatory')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {t('cookie.necessaryDesc')}
                        </p>
                      </div>
                      <div className="ml-4">
                        <div className="w-12 h-6 rounded-full bg-primary-600">
                          <div className="w-5 h-5 rounded-full bg-white translate-x-6 translate-y-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Functional Cookies */}
                    <div className="flex items-start justify-between p-4 bg-background-darker rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{t('cookie.functional')}</h4>
                        <p className="text-sm text-gray-400">
                          {t('cookie.functionalDesc')}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updatePreferences({
                            ...preferences,
                            functional: !preferences.functional,
                          })
                        }
                        className={`ml-4 w-12 h-6 rounded-full transition-colors ${
                          preferences.functional ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            preferences.functional ? 'translate-x-6' : 'translate-x-0.5'
                          } translate-y-0.5`}
                        />
                      </button>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start justify-between p-4 bg-background-darker rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{t('cookie.analytics')}</h4>
                        <p className="text-sm text-gray-400">
                          {t('cookie.analyticsDesc')}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updatePreferences({
                            ...preferences,
                            analytics: !preferences.analytics,
                          })
                        }
                        className={`ml-4 w-12 h-6 rounded-full transition-colors ${
                          preferences.analytics ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            preferences.analytics ? 'translate-x-6' : 'translate-x-0.5'
                          } translate-y-0.5`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowSettings(false)} className="btn-secondary">
                      {t('common.cancel')}
                    </button>
                    <button onClick={handleSavePreferences} className="btn-primary">
                      {t('settings.saveChanges')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
