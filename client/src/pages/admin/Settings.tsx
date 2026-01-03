import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Palette, Shield, Bell, Database, Loader2, Mail, Send, AlertCircle, HardDrive, Download, Upload, Trash2, RefreshCw, Search } from 'lucide-react';
import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/useAdmin';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  
  const { data: savedSettings, isLoading, error } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  const [settings, setSettings] = useState({
    siteName: 'Sweden Vikings',
    siteDescription: 'Arma Reforger Gaming Community',
    maintenance: false,
    maintenanceMessage: 'Sidan är under underhåll. Försök igen senare.',
    primaryColor: '#6366f1',
    accentColor: '#06b6d4',
    discordInvite: '',
    twitterUrl: '',
    youtubeUrl: '',
    // SEO settings
    seoKeywords: '',
    seoCanonicalUrl: '',
    seoRobotsIndex: true,
    seoRobotsFollow: true,
    seoGoogleSiteVerification: '',
    seoBingSiteVerification: '',
    seoGoogleAnalyticsId: '',
    seoFacebookAppId: '',
    seoTwitterCard: 'summary_large_image',
    seoTwitterSite: '',
    seoTwitterCreator: '',
    seoOgType: 'website',
    seoOgLocale: 'sv_SE',
    // Security settings
    requireEmailVerification: false,
    enableTwoFactor: true,
    sessionTimeout: 24, // hours
    maxLoginAttempts: 5,
    loginLockoutDuration: 30, // minutes
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    enableRateLimiting: true,
    rateLimitRequests: 100,
    rateLimitWindow: 15, // minutes
    enableCORS: true,
    allowedOrigins: 'http://localhost:5173',
    enableCSRF: true,
    ipWhitelist: '',
    ipBlacklist: '',
    // Notification settings
    enableEmailNotifications: true,
    enableDiscordNotifications: true,
    enablePushNotifications: false,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: true,
    smtpUser: '',
    smtpPassword: '',
    emailFromAddress: 'noreply@swedenvikings.eu',
    emailFromName: 'Sweden Vikings',
    discordWebhookUrl: '',
    discordBotToken: '',
    notifyOnNewUser: true,
    notifyOnNewTicket: true,
    notifyOnNewNews: false,
    notifyOnNewEvent: false,
    notifyOnServerDown: true,
    adminEmailAddresses: '',
    // Database settings
    enableAutoBackup: true,
    backupFrequency: 'daily', // daily, weekly, monthly
    backupRetentionDays: 30,
    backupLocation: '/var/backups/swedenvikings',
    enableDatabaseOptimization: true,
    optimizationSchedule: 'weekly',
    maxDatabaseSize: 10, // GB
    enableQueryLogging: false,
    slowQueryThreshold: 1000, // ms
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings({
        siteName: savedSettings.siteName || 'Sweden Vikings',
        siteDescription: savedSettings.siteDescription || '',
        maintenance: savedSettings.maintenance || false,
        maintenanceMessage: savedSettings.maintenanceMessage || '',
        primaryColor: savedSettings.primaryColor || '#6366f1',
        accentColor: savedSettings.accentColor || '#06b6d4',
        discordInvite: savedSettings.discordInvite || '',
        twitterUrl: savedSettings.twitterUrl || '',
        youtubeUrl: savedSettings.youtubeUrl || '',
        // Security settings
        requireEmailVerification: savedSettings.requireEmailVerification ?? false,
        enableTwoFactor: savedSettings.enableTwoFactor ?? true,
        sessionTimeout: savedSettings.sessionTimeout || 24,
        maxLoginAttempts: savedSettings.maxLoginAttempts || 5,
        loginLockoutDuration: savedSettings.loginLockoutDuration || 30,
        passwordMinLength: savedSettings.passwordMinLength || 8,
        passwordRequireUppercase: savedSettings.passwordRequireUppercase ?? true,
        passwordRequireLowercase: savedSettings.passwordRequireLowercase ?? true,
        passwordRequireNumbers: savedSettings.passwordRequireNumbers ?? true,
        passwordRequireSpecialChars: savedSettings.passwordRequireSpecialChars ?? true,
        enableRateLimiting: savedSettings.enableRateLimiting ?? true,
        rateLimitRequests: savedSettings.rateLimitRequests || 100,
        rateLimitWindow: savedSettings.rateLimitWindow || 15,
        enableCORS: savedSettings.enableCORS ?? true,
        allowedOrigins: savedSettings.allowedOrigins || 'http://localhost:5173',
        enableCSRF: savedSettings.enableCSRF ?? true,
        ipWhitelist: savedSettings.ipWhitelist || '',
        ipBlacklist: savedSettings.ipBlacklist || '',
        // Notification settings
        enableEmailNotifications: savedSettings.enableEmailNotifications ?? true,
        enableDiscordNotifications: savedSettings.enableDiscordNotifications ?? true,
        enablePushNotifications: savedSettings.enablePushNotifications ?? false,
        smtpHost: savedSettings.smtpHost || 'smtp.gmail.com',
        smtpPort: savedSettings.smtpPort || 587,
        smtpSecure: savedSettings.smtpSecure ?? true,
        smtpUser: savedSettings.smtpUser || '',
        smtpPassword: savedSettings.smtpPassword || '',
        emailFromAddress: savedSettings.emailFromAddress || 'noreply@swedenvikings.eu',
        emailFromName: savedSettings.emailFromName || 'Sweden Vikings',
        discordWebhookUrl: savedSettings.discordWebhookUrl || '',
        discordBotToken: savedSettings.discordBotToken || '',
        notifyOnNewUser: savedSettings.notifyOnNewUser ?? true,
        notifyOnNewTicket: savedSettings.notifyOnNewTicket ?? true,
        notifyOnNewNews: savedSettings.notifyOnNewNews ?? false,
        notifyOnNewEvent: savedSettings.notifyOnNewEvent ?? false,
        notifyOnServerDown: savedSettings.notifyOnServerDown ?? true,
        adminEmailAddresses: savedSettings.adminEmailAddresses || '',
        // Database settings
        enableAutoBackup: savedSettings.enableAutoBackup ?? true,
        backupFrequency: savedSettings.backupFrequency || 'daily',
        backupRetentionDays: savedSettings.backupRetentionDays || 30,
        backupLocation: savedSettings.backupLocation || '/var/backups/swedenvikings',
        enableDatabaseOptimization: savedSettings.enableDatabaseOptimization ?? true,
        optimizationSchedule: savedSettings.optimizationSchedule || 'weekly',
        maxDatabaseSize: savedSettings.maxDatabaseSize || 10,
        enableQueryLogging: savedSettings.enableQueryLogging ?? false,
        slowQueryThreshold: savedSettings.slowQueryThreshold || 1000,
        // SEO settings
        seoKeywords: savedSettings.seoKeywords || '',
        seoCanonicalUrl: savedSettings.seoCanonicalUrl || '',
        seoRobotsIndex: savedSettings.seoRobotsIndex ?? true,
        seoRobotsFollow: savedSettings.seoRobotsFollow ?? true,
        seoGoogleSiteVerification: savedSettings.seoGoogleSiteVerification || '',
        seoBingSiteVerification: savedSettings.seoBingSiteVerification || '',
        seoGoogleAnalyticsId: savedSettings.seoGoogleAnalyticsId || '',
        seoFacebookAppId: savedSettings.seoFacebookAppId || '',
        seoTwitterCard: savedSettings.seoTwitterCard || 'summary_large_image',
        seoTwitterSite: savedSettings.seoTwitterSite || '',
        seoTwitterCreator: savedSettings.seoTwitterCreator || '',
        seoOgType: savedSettings.seoOgType || 'website',
        seoOgLocale: savedSettings.seoOgLocale || 'sv_SE',
      });
    }
  }, [savedSettings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(settings);
      toast.success('Inställningar sparade!');
    } catch {
      toast.error('Kunde inte spara ändringar');
    }
  };

  const tabs = [
    { id: 'general', label: 'Allmänt', icon: Globe },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'appearance', label: 'Utseende', icon: Palette },
    { id: 'security', label: 'Säkerhet', icon: Shield },
    { id: 'notifications', label: 'Notifikationer', icon: Bell },
    { id: 'database', label: 'Databas', icon: Database },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Laddar inställningar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">Ett fel uppstod vid laddning av inställningar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Inställningar</h1>
        <p className="text-gray-400">Konfigurera sidans inställningar</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-48 flex-shrink-0">
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
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold">Allmänna inställningar</h2>

                <div>
                  <label className="label">Sidans namn</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Beskrivning</label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    rows={3}
                    className="input resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <div>
                    <label className="font-medium text-yellow-400">Underhållsläge</label>
                    <p className="text-sm text-gray-400">
                      Stäng av sidan tillfälligt för underhåll
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, maintenance: !settings.maintenance })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.maintenance ? 'bg-yellow-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        settings.maintenance ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {settings.maintenance && (
                  <div>
                    <label className="label">Underhållsmeddelande</label>
                    <textarea
                      value={settings.maintenanceMessage}
                      onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                      rows={2}
                      className="input resize-none"
                    />
                  </div>
                )}

                <hr className="border-white/10" />

                <h3 className="font-medium">Sociala länkar</h3>

                <div>
                  <label className="label">Discord inbjudningslänk</label>
                  <input
                    type="text"
                    value={settings.discordInvite}
                    onChange={(e) => setSettings({ ...settings, discordInvite: e.target.value })}
                    placeholder="https://discord.gg/..."
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Twitter URL</label>
                  <input
                    type="text"
                    value={settings.twitterUrl}
                    onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                    placeholder="https://twitter.com/..."
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">YouTube URL</label>
                  <input
                    type="text"
                    value={settings.youtubeUrl}
                    onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                    placeholder="https://youtube.com/..."
                    className="input"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                  className="btn-primary"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {updateSettings.isPending ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold">SEO & Analytics</h2>

                <div className="grid gap-6">
                  {/* Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      value={settings.seoKeywords}
                      onChange={(e) => setSettings({ ...settings, seoKeywords: e.target.value })}
                      placeholder="gaming, arma reforger, sweden, community"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Kommaseparerade nyckelord</p>
                  </div>

                  {/* Canonical URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      value={settings.seoCanonicalUrl}
                      onChange={(e) => setSettings({ ...settings, seoCanonicalUrl: e.target.value })}
                      placeholder="https://swedenvikings.eu"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Primär URL för din webbplats</p>
                  </div>

                  {/* Robots */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-4 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={settings.seoRobotsIndex}
                        onChange={(e) => setSettings({ ...settings, seoRobotsIndex: e.target.checked })}
                        className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">Allow Indexing</div>
                        <div className="text-xs text-gray-400">Låt sökmotorer indexera sidan</div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-4 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={settings.seoRobotsFollow}
                        onChange={(e) => setSettings({ ...settings, seoRobotsFollow: e.target.checked })}
                        className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">Follow Links</div>
                        <div className="text-xs text-gray-400">Låt sökmotorer följa länkar</div>
                      </div>
                    </label>
                  </div>

                  {/* Site Verification */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Google Site Verification
                      </label>
                      <input
                        type="text"
                        value={settings.seoGoogleSiteVerification}
                        onChange={(e) => setSettings({ ...settings, seoGoogleSiteVerification: e.target.value })}
                        placeholder="verification code"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bing Site Verification
                      </label>
                      <input
                        type="text"
                        value={settings.seoBingSiteVerification}
                        onChange={(e) => setSettings({ ...settings, seoBingSiteVerification: e.target.value })}
                        placeholder="verification code"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Google Analytics ID
                      </label>
                      <input
                        type="text"
                        value={settings.seoGoogleAnalyticsId}
                        onChange={(e) => setSettings({ ...settings, seoGoogleAnalyticsId: e.target.value })}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">GA4 Measurement ID</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Facebook App ID
                      </label>
                      <input
                        type="text"
                        value={settings.seoFacebookAppId}
                        onChange={(e) => setSettings({ ...settings, seoFacebookAppId: e.target.value })}
                        placeholder="123456789"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Twitter Card */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Twitter Card Type
                    </label>
                    <select
                      value={settings.seoTwitterCard}
                      onChange={(e) => setSettings({ ...settings, seoTwitterCard: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="summary">Summary</option>
                      <option value="summary_large_image">Summary Large Image</option>
                      <option value="app">App</option>
                      <option value="player">Player</option>
                    </select>
                  </div>

                  {/* Twitter Handles */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Twitter Site (@username)
                      </label>
                      <input
                        type="text"
                        value={settings.seoTwitterSite}
                        onChange={(e) => setSettings({ ...settings, seoTwitterSite: e.target.value })}
                        placeholder="@swedenvikings"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Twitter Creator (@username)
                      </label>
                      <input
                        type="text"
                        value={settings.seoTwitterCreator}
                        onChange={(e) => setSettings({ ...settings, seoTwitterCreator: e.target.value })}
                        placeholder="@creator"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Open Graph */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Open Graph Type
                      </label>
                      <input
                        type="text"
                        value={settings.seoOgType}
                        onChange={(e) => setSettings({ ...settings, seoOgType: e.target.value })}
                        placeholder="website"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">website, article, product, etc.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Open Graph Locale
                      </label>
                      <input
                        type="text"
                        value={settings.seoOgLocale}
                        onChange={(e) => setSettings({ ...settings, seoOgLocale: e.target.value })}
                        placeholder="sv_SE"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {updateSettings.isPending ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold">Utseende</h2>

                <div>
                  <label className="label">Primärfärg</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="input flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Accentfärg</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="input flex-1"
                    />
                  </div>
                </div>

                <div className="p-4 bg-background-darker rounded-xl">
                  <p className="text-sm text-gray-400 mb-4">Förhandsvisning</p>
                  <div className="flex gap-4">
                    <button
                      className="px-4 py-2 rounded-lg text-white"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      Primär knapp
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white"
                      style={{ backgroundColor: settings.accentColor }}
                    >
                      Accent knapp
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                  className="btn-primary"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {updateSettings.isPending ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold">Säkerhetsinställningar</h2>

                {/* Authentication */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Autentisering</h3>

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl">
                    <div>
                      <label className="font-medium">Kräv e-postverifiering</label>
                      <p className="text-sm text-gray-400">
                        Användare måste verifiera sin e-post vid registrering
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.requireEmailVerification ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.requireEmailVerification ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl">
                    <div>
                      <label className="font-medium">Aktivera tvåfaktorsautentisering</label>
                      <p className="text-sm text-gray-400">
                        Tillåt användare att aktivera 2FA för extra säkerhet
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enableTwoFactor: !settings.enableTwoFactor })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.enableTwoFactor ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.enableTwoFactor ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="label">Session timeout (timmar)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                      className="input"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Hur länge en användare förblir inloggad (1-168 timmar)
                    </p>
                  </div>
                </div>

                <hr className="border-white/10" />

                {/* Login Protection */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Inloggningsskydd</h3>

                  <div>
                    <label className="label">Max inloggningsförsök</label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                      className="input"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Antal misslyckade inloggningsförsök innan låsning (3-10)
                    </p>
                  </div>

                  <div>
                    <label className="label">Låsningstid (minuter)</label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={settings.loginLockoutDuration}
                      onChange={(e) => setSettings({ ...settings, loginLockoutDuration: parseInt(e.target.value) })}
                      className="input"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Hur länge kontot är låst efter för många försök (5-1440 minuter)
                    </p>
                  </div>
                </div>

                <hr className="border-white/10" />

                {/* Password Requirements */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Lösenordskrav</h3>

                  <div>
                    <label className="label">Minsta längd</label>
                    <input
                      type="number"
                      min="6"
                      max="32"
                      value={settings.passwordMinLength}
                      onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
                      className="input"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Minsta antal tecken i lösenord (6-32)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
                      <span className="text-sm">Versaler (A-Z)</span>
                      <button
                        onClick={() => setSettings({ ...settings, passwordRequireUppercase: !settings.passwordRequireUppercase })}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          settings.passwordRequireUppercase ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings.passwordRequireUppercase ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
                      <span className="text-sm">Gemener (a-z)</span>
                      <button
                        onClick={() => setSettings({ ...settings, passwordRequireLowercase: !settings.passwordRequireLowercase })}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          settings.passwordRequireLowercase ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings.passwordRequireLowercase ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
                      <span className="text-sm">Siffror (0-9)</span>
                      <button
                        onClick={() => setSettings({ ...settings, passwordRequireNumbers: !settings.passwordRequireNumbers })}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          settings.passwordRequireNumbers ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings.passwordRequireNumbers ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
                      <span className="text-sm">Specialtecken (!@#)</span>
                      <button
                        onClick={() => setSettings({ ...settings, passwordRequireSpecialChars: !settings.passwordRequireSpecialChars })}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          settings.passwordRequireSpecialChars ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings.passwordRequireSpecialChars ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="border-white/10" />

                {/* Rate Limiting */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Rate Limiting</h3>

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl">
                    <div>
                      <label className="font-medium">Aktivera rate limiting</label>
                      <p className="text-sm text-gray-400">
                        Begränsa antal förfrågningar per IP-adress
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enableRateLimiting: !settings.enableRateLimiting })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.enableRateLimiting ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.enableRateLimiting ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.enableRateLimiting && (
                    <>
                      <div>
                        <label className="label">Max antal förfrågningar</label>
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          value={settings.rateLimitRequests}
                          onChange={(e) => setSettings({ ...settings, rateLimitRequests: parseInt(e.target.value) })}
                          className="input"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Antal tillåtna förfrågningar per tidsfönster
                        </p>
                      </div>

                      <div>
                        <label className="label">Tidsfönster (minuter)</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={settings.rateLimitWindow}
                          onChange={(e) => setSettings({ ...settings, rateLimitWindow: parseInt(e.target.value) })}
                          className="input"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Hur lång period rate limit gäller för
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <hr className="border-white/10" />

                {/* CORS & CSRF */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">CORS & CSRF</h3>

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl">
                    <div>
                      <label className="font-medium">Aktivera CORS</label>
                      <p className="text-sm text-gray-400">
                        Cross-Origin Resource Sharing
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enableCORS: !settings.enableCORS })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.enableCORS ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.enableCORS ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.enableCORS && (
                    <div>
                      <label className="label">Tillåtna ursprung (CORS)</label>
                      <textarea
                        value={settings.allowedOrigins}
                        onChange={(e) => setSettings({ ...settings, allowedOrigins: e.target.value })}
                        rows={3}
                        className="input resize-none font-mono text-xs"
                        placeholder="http://localhost:5173&#10;https://yourdomain.com"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Ett ursprung per rad. Använd * för att tillåta alla (ej rekommenderat)
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl">
                    <div>
                      <label className="font-medium">Aktivera CSRF-skydd</label>
                      <p className="text-sm text-gray-400">
                        Cross-Site Request Forgery Protection
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enableCSRF: !settings.enableCSRF })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.enableCSRF ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.enableCSRF ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <hr className="border-white/10" />

                {/* IP Filtering */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">IP-filtrering</h3>

                  <div>
                    <label className="label">IP Whitelist</label>
                    <textarea
                      value={settings.ipWhitelist}
                      onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                      rows={3}
                      className="input resize-none font-mono text-xs"
                      placeholder="192.168.1.1&#10;10.0.0.0/24"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Tillåt endast dessa IP-adresser (ett per rad). Lämna tomt för att inaktivera.
                    </p>
                  </div>

                  <div>
                    <label className="label">IP Blacklist</label>
                    <textarea
                      value={settings.ipBlacklist}
                      onChange={(e) => setSettings({ ...settings, ipBlacklist: e.target.value })}
                      rows={3}
                      className="input resize-none font-mono text-xs"
                      placeholder="192.168.1.100&#10;10.0.0.0/8"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Blockera dessa IP-adresser (ett per rad). Lämna tomt för att inaktivera.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <p className="text-sm text-yellow-400 font-medium mb-1">⚠️ Varning</p>
                  <p className="text-sm text-gray-300">
                    Säkerställ att du förstår konsekvenserna innan du ändrar säkerhetsinställningar.
                    Felaktiga inställningar kan låsa ute användare eller göra systemet osäkert.
                  </p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                  className="btn-primary"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {updateSettings.isPending ? 'Sparar...' : 'Spara säkerhetsinställningar'}
                </button>
              </div>
            )}
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold">Notifikationsinställningar</h2>

                {/* Enable/Disable Notifications */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Aktivera notifikationskanaler</h3>

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl">
                    <div>
                      <label className="font-medium">E-postnotifikationer</label>
                      <p className="text-sm text-gray-400">
                        Skicka notifikationer via e-post
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enableEmailNotifications: !settings.enableEmailNotifications })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.enableEmailNotifications ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.enableEmailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl">
                    <div>
                      <label className="font-medium">Discord-notifikationer</label>
                      <p className="text-sm text-gray-400">
                        Skicka notifikationer till Discord via webhook
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enableDiscordNotifications: !settings.enableDiscordNotifications })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.enableDiscordNotifications ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.enableDiscordNotifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl">
                    <div>
                      <label className="font-medium">Push-notifikationer</label>
                      <p className="text-sm text-gray-400">
                        Skicka push-notifikationer till användare (kräver service worker)
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enablePushNotifications: !settings.enablePushNotifications })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.enablePushNotifications ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.enablePushNotifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <hr className="border-white/10" />

                {/* Email Configuration */}
                {settings.enableEmailNotifications && (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        SMTP E-postkonfiguration
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">SMTP Host</label>
                          <input
                            type="text"
                            value={settings.smtpHost}
                            onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                            placeholder="smtp.gmail.com"
                            className="input"
                          />
                        </div>

                        <div>
                          <label className="label">SMTP Port</label>
                          <input
                            type="number"
                            min="1"
                            max="65535"
                            value={settings.smtpPort}
                            onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                            className="input"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl">
                        <div>
                          <label className="font-medium">Säker anslutning (TLS/SSL)</label>
                          <p className="text-sm text-gray-400">
                            Använd krypterad anslutning
                          </p>
                        </div>
                        <button
                          onClick={() => setSettings({ ...settings, smtpSecure: !settings.smtpSecure })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            settings.smtpSecure ? 'bg-primary-600' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              settings.smtpSecure ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      <div>
                        <label className="label">SMTP Användarnamn</label>
                        <input
                          type="text"
                          value={settings.smtpUser}
                          onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                          placeholder="your-email@gmail.com"
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="label">SMTP Lösenord</label>
                        <input
                          type="password"
                          value={settings.smtpPassword}
                          onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                          placeholder="••••••••••"
                          className="input"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          För Gmail, använd ett app-specifikt lösenord
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Från e-postadress</label>
                          <input
                            type="email"
                            value={settings.emailFromAddress}
                            onChange={(e) => setSettings({ ...settings, emailFromAddress: e.target.value })}
                            placeholder="noreply@swedenvikings.eu"
                            className="input"
                          />
                        </div>

                        <div>
                          <label className="label">Från namn</label>
                          <input
                            type="text"
                            value={settings.emailFromName}
                            onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                            placeholder="Sweden Vikings"
                            className="input"
                          />
                        </div>
                      </div>

                      <button
                        className="btn-secondary flex items-center gap-2"
                        onClick={() => toast.success('Test-e-post skulle skickas här')}
                      >
                        <Send className="w-4 h-4" />
                        Skicka test-e-post
                      </button>
                    </div>

                    <hr className="border-white/10" />
                  </>
                )}

                {/* Discord Configuration */}
                {settings.enableDiscordNotifications && (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Discord-konfiguration
                      </h3>

                      <div>
                        <label className="label">Discord Webhook URL</label>
                        <input
                          type="text"
                          value={settings.discordWebhookUrl}
                          onChange={(e) => setSettings({ ...settings, discordWebhookUrl: e.target.value })}
                          placeholder="https://discord.com/api/webhooks/..."
                          className="input font-mono text-xs"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Skapa en webhook i dina Discord-serverinställningar
                        </p>
                      </div>

                      <div>
                        <label className="label">Discord Bot Token (valfritt)</label>
                        <input
                          type="password"
                          value={settings.discordBotToken}
                          onChange={(e) => setSettings({ ...settings, discordBotToken: e.target.value })}
                          placeholder="Din Discord Bot Token här"
                          className="input font-mono text-xs"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          För avancerade Discord-integrationer
                        </p>
                      </div>

                      <button
                        className="btn-secondary flex items-center gap-2"
                        onClick={() => toast.success('Test-meddelande skulle skickas till Discord')}
                      >
                        <Send className="w-4 h-4" />
                        Skicka test till Discord
                      </button>
                    </div>

                    <hr className="border-white/10" />
                  </>
                )}

                {/* Notification Events */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    När ska notifikationer skickas?
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
                      <span className="text-sm">Ny användare registrerad</span>
                      <button
                        onClick={() => setSettings({ ...settings, notifyOnNewUser: !settings.notifyOnNewUser })}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          settings.notifyOnNewUser ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings.notifyOnNewUser ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
                      <span className="text-sm">Nytt supportärende</span>
                      <button
                        onClick={() => setSettings({ ...settings, notifyOnNewTicket: !settings.notifyOnNewTicket })}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          settings.notifyOnNewTicket ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings.notifyOnNewTicket ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
                      <span className="text-sm">Ny nyhet publicerad</span>
                      <button
                        onClick={() => setSettings({ ...settings, notifyOnNewNews: !settings.notifyOnNewNews })}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          settings.notifyOnNewNews ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings.notifyOnNewNews ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg">
                      <span className="text-sm">Nytt event skapat</span>
                      <button
                        onClick={() => setSettings({ ...settings, notifyOnNewEvent: !settings.notifyOnNewEvent })}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          settings.notifyOnNewEvent ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings.notifyOnNewEvent ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-darker rounded-lg col-span-2">
                      <span className="text-sm">Spelserver nere/otillgänglig</span>
                      <button
                        onClick={() => setSettings({ ...settings, notifyOnServerDown: !settings.notifyOnServerDown })}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          settings.notifyOnServerDown ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings.notifyOnServerDown ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="border-white/10" />

                {/* Admin Recipients */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Administratörs-mottagare</h3>

                  <div>
                    <label className="label">Admin e-postadresser</label>
                    <textarea
                      value={settings.adminEmailAddresses}
                      onChange={(e) => setSettings({ ...settings, adminEmailAddresses: e.target.value })}
                      rows={3}
                      className="input resize-none font-mono text-xs"
                      placeholder="admin1@example.com&#10;admin2@example.com&#10;admin3@example.com"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      En e-postadress per rad. Dessa kommer få admin-notifikationer.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-sm text-blue-400 font-medium mb-1">💡 Tips</p>
                  <p className="text-sm text-gray-300">
                    Testa alltid dina notifikationsinställningar efter ändringar. Använd test-knapparna ovan för att säkerställa att allt fungerar.
                  </p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                  className="btn-primary"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {updateSettings.isPending ? 'Sparar...' : 'Spara notifikationsinställningar'}
                </button>
              </div>
            )}
            {activeTab === 'database' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold mb-2">Databasinställningar</h2>
                  <p className="text-gray-400">
                    Hantera databas-backuper, optimering och underhåll
                  </p>
                </div>

                <hr className="border-white/10" />

                {/* Database Status */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Databasstatus
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-background-darker rounded-xl border border-white/10">
                      <p className="text-sm text-gray-400 mb-1">Databasstorlek</p>
                      <p className="text-2xl font-bold text-primary-400">2.4 GB</p>
                      <p className="text-xs text-gray-500 mt-1">av {settings.maxDatabaseSize} GB max</p>
                    </div>

                    <div className="p-4 bg-background-darker rounded-xl border border-white/10">
                      <p className="text-sm text-gray-400 mb-1">Tabeller</p>
                      <p className="text-2xl font-bold text-accent-400">24</p>
                      <p className="text-xs text-gray-500 mt-1">totalt antal tabeller</p>
                    </div>

                    <div className="p-4 bg-background-darker rounded-xl border border-white/10">
                      <p className="text-sm text-gray-400 mb-1">Senaste backup</p>
                      <p className="text-2xl font-bold text-green-400">2h</p>
                      <p className="text-xs text-gray-500 mt-1">sedan</p>
                    </div>
                  </div>
                </div>

                <hr className="border-white/10" />

                {/* Backup Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Automatiska backuper
                  </h3>

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl border border-white/10">
                    <div>
                      <label className="font-medium">Aktivera automatiska backuper</label>
                      <p className="text-sm text-gray-400">
                        Schemalagda backuper körs automatiskt enligt inställd frekvens
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enableAutoBackup: !settings.enableAutoBackup })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.enableAutoBackup ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.enableAutoBackup ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.enableAutoBackup && (
                    <div className="space-y-4 p-4 bg-background-darker/50 rounded-xl border border-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Backup-frekvens</label>
                          <select
                            value={settings.backupFrequency}
                            onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                            className="input"
                          >
                            <option value="hourly">Varje timme</option>
                            <option value="daily">Dagligen</option>
                            <option value="weekly">Veckovis</option>
                            <option value="monthly">Månadsvis</option>
                          </select>
                        </div>

                        <div>
                          <label className="label">Lagra backuper i antal dagar</label>
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={settings.backupRetentionDays}
                            onChange={(e) => setSettings({ ...settings, backupRetentionDays: parseInt(e.target.value) })}
                            className="input"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Äldre backuper raderas automatiskt
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="label">Backup-plats</label>
                        <input
                          type="text"
                          value={settings.backupLocation}
                          onChange={(e) => setSettings({ ...settings, backupLocation: e.target.value })}
                          className="input font-mono text-sm"
                          placeholder="/var/backups/swedenvikings"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Absolut sökväg på servern där backuper sparas
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-white/10" />

                {/* Manual Backup Actions */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Manuella åtgärder</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="btn-secondary flex items-center justify-center gap-2 py-3">
                      <Download className="w-4 h-4" />
                      Skapa backup nu
                    </button>

                    <button className="btn-secondary flex items-center justify-center gap-2 py-3">
                      <Upload className="w-4 h-4" />
                      Återställ från backup
                    </button>

                    <button className="btn-secondary flex items-center justify-center gap-2 py-3">
                      <RefreshCw className="w-4 h-4" />
                      Optimera databas
                    </button>

                    <button className="btn-secondary flex items-center justify-center gap-2 py-3 border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                      Rensa gamla data
                    </button>
                  </div>
                </div>

                <hr className="border-white/10" />

                {/* Database Optimization */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Databasoptimering</h3>

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl border border-white/10">
                    <div>
                      <label className="font-medium">Automatisk optimering</label>
                      <p className="text-sm text-gray-400">
                        Kör VACUUM och ANALYZE schemalagt för optimal prestanda
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enableDatabaseOptimization: !settings.enableDatabaseOptimization })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.enableDatabaseOptimization ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.enableDatabaseOptimization ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.enableDatabaseOptimization && (
                    <div className="p-4 bg-background-darker/50 rounded-xl border border-white/5">
                      <label className="label">Optimeringsschema</label>
                      <select
                        value={settings.optimizationSchedule}
                        onChange={(e) => setSettings({ ...settings, optimizationSchedule: e.target.value })}
                        className="input"
                      >
                        <option value="daily">Dagligen</option>
                        <option value="weekly">Veckovis</option>
                        <option value="monthly">Månadsvis</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="label">Max databasstorlek (GB)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.maxDatabaseSize}
                      onChange={(e) => setSettings({ ...settings, maxDatabaseSize: parseInt(e.target.value) })}
                      className="input"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Varning visas när databasen når denna storlek
                    </p>
                  </div>
                </div>

                <hr className="border-white/10" />

                {/* Query Logging */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Frågeloggning</h3>

                  <div className="flex items-center justify-between p-4 bg-background-darker rounded-xl border border-white/10">
                    <div>
                      <label className="font-medium">Aktivera långsamma frågor-loggning</label>
                      <p className="text-sm text-gray-400">
                        Logga databas-queries som tar längre tid än tröskelvärdet
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enableQueryLogging: !settings.enableQueryLogging })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.enableQueryLogging ? 'bg-primary-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.enableQueryLogging ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.enableQueryLogging && (
                    <div className="p-4 bg-background-darker/50 rounded-xl border border-white/5">
                      <label className="label">Tröskelvärde för långsamma frågor (ms)</label>
                      <input
                        type="number"
                        min="100"
                        max="10000"
                        step="100"
                        value={settings.slowQueryThreshold}
                        onChange={(e) => setSettings({ ...settings, slowQueryThreshold: parseInt(e.target.value) })}
                        className="input"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Queries över {settings.slowQueryThreshold}ms loggas för analys
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <p className="text-sm text-yellow-400 font-medium mb-1">⚠️ Viktigt</p>
                  <p className="text-sm text-gray-300">
                    Säkerställ att du har tillräckligt diskutrymme för backuper. Testa återställning regelbundet för att verifiera att backuperna fungerar.
                  </p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                  className="btn-primary"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {updateSettings.isPending ? 'Sparar...' : 'Spara databasinställningar'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
