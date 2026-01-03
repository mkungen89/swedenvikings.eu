import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Globe, Save, Loader2, Shield, Link as LinkIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useUpdateProfile, useUpdateSettings } from '@/hooks/useUsers';
import { usePlatformAccounts, useSetPrimaryPlatform, useUnlinkPlatform, getPlatformIcon, getPlatformColor, getPlatformName } from '@/hooks/usePlatform';
import AvatarUpload from '@/components/profile/AvatarUpload';
import BannerUpload from '@/components/profile/BannerUpload';
import GDPRSettings from '@/components/settings/GDPRSettings';
import ImageDebug from '@/components/debug/ImageDebug';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');

  const updateProfile = useUpdateProfile();
  const updateSettings = useUpdateSettings();

  const [profile, setProfile] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
  });

  const [settings, setSettings] = useState<{
    theme: 'light' | 'dark' | 'system';
    language: 'sv' | 'en';
    emailNotifications: boolean;
    discordNotifications: boolean;
  }>({
    theme: (user?.theme as 'light' | 'dark' | 'system') || 'dark',
    language: (user?.language as 'sv' | 'en') || 'sv',
    emailNotifications: true,
    discordNotifications: true,
  });

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(profile);
      updateUser(profile);
      toast.success(t('notifications.profileUpdated'));
    } catch {
      toast.error(t('notifications.errorSaving'));
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync(settings);
      toast.success(t('notifications.settingsSaved'));
    } catch {
      toast.error(t('notifications.errorSaving'));
    }
  };


  const { data: platformAccounts, isLoading: loadingPlatforms } = usePlatformAccounts();
  const setPrimary = useSetPrimaryPlatform();
  const unlinkPlatform = useUnlinkPlatform();

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'platforms', label: 'Spelkonton', icon: LinkIcon },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
    { id: 'language', label: t('settings.language'), icon: Globe },
    { id: 'privacy', label: t('settings.privacy'), icon: Shield },
  ];

  const isLoading = updateProfile.isPending || updateSettings.isPending;

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold mb-8">{t('settings.title')}</h1>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Tabs */}
            <div className="md:w-48 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="card p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <h2 className="font-display text-xl font-semibold">{t('settings.profile')}</h2>

                    {/* Avatar Upload */}
                    <AvatarUpload />

                    {/* Banner Upload */}
                    <BannerUpload />

                    {/* Username */}
                    <div>
                      <label className="label">{t('settings.username')}</label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        className="input"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="label">{t('settings.bio')}</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={3}
                        className="input resize-none"
                        placeholder={t('settings.bioPlaceholder')}
                      />
                    </div>

                    {/* Privacy */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium">{t('settings.privateProfile')}</label>
                        <p className="text-sm text-gray-400">
                          {t('settings.privateProfileDesc')}
                        </p>
                      </div>
                      <button
                        onClick={() => setProfile({ ...profile, isPrivate: !profile.isPrivate })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          profile.isPrivate ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            profile.isPrivate ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {updateProfile.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {updateProfile.isPending ? t('settings.saving') : t('settings.saveChanges')}
                    </button>
                  </div>
                )}

                {/* Platforms Tab */}
                {activeTab === 'platforms' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-xl font-semibold mb-2">Länkade spelkonton</h2>
                      <p className="text-gray-400">
                        Hantera dina länkade gaming-konton från olika plattformar
                      </p>
                    </div>

                    {loadingPlatforms ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                      </div>
                    ) : platformAccounts && platformAccounts.length > 0 ? (
                      <div className="space-y-3">
                        {platformAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="card p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getPlatformColor(account.platform)}`}>
                                {getPlatformIcon(account.platform)}
                              </div>
                              <div>
                                <div className="font-semibold flex items-center gap-2">
                                  {getPlatformName(account.platform)}
                                  {account.isPrimary && (
                                    <span className="px-2 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded">
                                      Primär
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {account.platformUsername || account.platformId}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Länkad {new Date(account.linkedAt).toLocaleDateString('sv-SE')}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!account.isPrimary && (
                                <button
                                  onClick={() => setPrimary.mutate(account.id)}
                                  disabled={setPrimary.isPending}
                                  className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                  Gör primär
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm('Är du säker på att du vill ta bort denna länkning?')) {
                                    unlinkPlatform.mutate(account.id);
                                  }
                                }}
                                disabled={unlinkPlatform.isPending}
                                className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                              >
                                Ta bort
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="card p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                          <LinkIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold mb-2">Inga länkade konton</h3>
                        <p className="text-gray-400 mb-4">
                          Länka ditt Xbox- eller PlayStation-konto för att tracka din statistik
                        </p>
                        <a href="/link-account" className="btn-primary inline-flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" />
                          Länka spelkonto
                        </a>
                      </div>
                    )}

                    <div className="card p-4 bg-primary-500/10 border border-primary-500/20">
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-gray-300">
                          <strong className="text-white">Hur länkar jag mitt spelkonto?</strong>
                          <p className="mt-1">
                            Anslut till vår Arma Reforger-server från din Xbox eller PlayStation så får du en länkningskod.
                            Gå sedan till <a href="/link-account" className="text-primary-400 hover:underline">länkningssidan</a> och ange koden.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="font-display text-xl font-semibold">{t('settings.notifications')}</h2>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">{t('settings.emailNotifications')}</label>
                          <p className="text-sm text-gray-400">
                            {t('settings.emailNotificationsDesc')}
                          </p>
                        </div>
                        <button
                          onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            settings.emailNotifications ? 'bg-primary-600' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              settings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">{t('settings.discordNotifications')}</label>
                          <p className="text-sm text-gray-400">
                            {t('settings.discordNotificationsDesc')}
                          </p>
                        </div>
                        <button
                          onClick={() => setSettings({ ...settings, discordNotifications: !settings.discordNotifications })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            settings.discordNotifications ? 'bg-primary-600' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              settings.discordNotifications ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {updateSettings.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {updateSettings.isPending ? t('settings.saving') : t('settings.saveChanges')}
                    </button>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <h2 className="font-display text-xl font-semibold">{t('settings.appearance')}</h2>

                    <div>
                      <label className="label">{t('settings.theme')}</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['light', 'dark', 'system'] as const).map((themeOption) => (
                          <button
                            key={themeOption}
                            onClick={() => {
                              setSettings({ ...settings, theme: themeOption });
                              // Apply theme immediately for light/dark (system needs OS detection)
                              if (themeOption !== 'system') {
                                setTheme(themeOption);
                              }
                            }}
                            className={`p-4 rounded-xl border-2 transition-colors ${
                              settings.theme === themeOption
                                ? 'border-primary-500 bg-primary-500/10'
                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                              {themeOption === 'system' ? t('settings.themeSystem') : themeOption === 'dark' ? t('settings.themeDark') : t('settings.themeLight')}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {updateSettings.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {updateSettings.isPending ? t('settings.saving') : t('settings.saveChanges')}
                    </button>
                  </div>
                )}

                {/* Language Tab */}
                {activeTab === 'language' && (
                  <div className="space-y-6">
                    <h2 className="font-display text-xl font-semibold">{t('settings.language')}</h2>

                    <div>
                      <label className="label">{t('settings.selectLanguage')}</label>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        className="input"
                      >
                        <option value="sv">Svenska</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {updateSettings.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {updateSettings.isPending ? t('settings.saving') : t('settings.saveChanges')}
                    </button>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && <GDPRSettings />}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <ImageDebug />
    </div>
  );
}
