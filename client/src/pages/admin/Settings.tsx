import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Palette, Shield, Bell, Database, Loader2 } from 'lucide-react';
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

            {/* Other tabs placeholder */}
            {activeTab === 'security' && (
              <div className="text-center py-12 text-gray-400">
                Säkerhetsinställningar kommer snart...
              </div>
            )}
            {activeTab === 'notifications' && (
              <div className="text-center py-12 text-gray-400">
                Notifikationsinställningar kommer snart...
              </div>
            )}
            {activeTab === 'database' && (
              <div className="text-center py-12 text-gray-400">
                Databasinställningar kommer snart...
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
