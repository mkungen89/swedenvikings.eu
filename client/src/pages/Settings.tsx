import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Globe, Camera, Save, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile, useUpdateSettings, useUploadAvatar, useUploadBanner } from '@/hooks/useUsers';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  
  const updateProfile = useUpdateProfile();
  const updateSettings = useUpdateSettings();
  const uploadAvatar = useUploadAvatar();
  const uploadBanner = useUploadBanner();
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    isPrivate: user?.isPrivate || false,
  });

  const [settings, setSettings] = useState({
    theme: user?.theme || 'dark',
    language: user?.language || 'sv',
    emailNotifications: true,
    discordNotifications: true,
  });

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(profile);
      updateUser(profile);
      toast.success('Profil uppdaterad!');
    } catch {
      toast.error('Kunde inte spara ändringar');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync(settings);
      toast.success('Inställningar sparade!');
    } catch {
      toast.error('Kunde inte spara ändringar');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bilden får max vara 5MB');
      return;
    }
    
    try {
      const result = await uploadAvatar.mutateAsync(file);
      updateUser({ avatar: result.url });
      toast.success('Profilbild uppdaterad!');
    } catch {
      toast.error('Kunde inte ladda upp bilden');
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Bilden får max vara 10MB');
      return;
    }
    
    try {
      const result = await uploadBanner.mutateAsync(file);
      updateUser({ banner: result.url });
      toast.success('Banner uppdaterad!');
    } catch {
      toast.error('Kunde inte ladda upp bilden');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifikationer', icon: Bell },
    { id: 'appearance', label: 'Utseende', icon: Palette },
    { id: 'language', label: 'Språk', icon: Globe },
  ];

  const isLoading = updateProfile.isPending || updateSettings.isPending;

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold mb-8">Inställningar</h1>

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
                    <h2 className="font-display text-xl font-semibold">Profil</h2>

                    {/* Avatar */}
                    <div>
                      <label className="label">Profilbild</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl bg-background-darker overflow-hidden">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-primary-600 to-accent-600 text-white">
                              {user?.username?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={avatarInputRef}
                          onChange={handleAvatarChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadAvatar.isPending}
                          className="btn-secondary"
                        >
                          {uploadAvatar.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                          Ändra bild
                        </button>
                      </div>
                    </div>

                    {/* Banner */}
                    <div>
                      <label className="label">Banner</label>
                      <div className="h-24 rounded-xl bg-background-darker overflow-hidden relative">
                        {user?.banner ? (
                          <img src={user.banner} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-primary-600/30 to-accent-600/30" />
                        )}
                        <input
                          type="file"
                          ref={bannerInputRef}
                          onChange={handleBannerChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={uploadBanner.isPending}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                        >
                          {uploadBanner.isPending ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <Camera className="w-6 h-6" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Username */}
                    <div>
                      <label className="label">Användarnamn</label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        className="input"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="label">Bio</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={3}
                        className="input resize-none"
                        placeholder="Berätta lite om dig själv..."
                      />
                    </div>

                    {/* Privacy */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium">Privat profil</label>
                        <p className="text-sm text-gray-400">
                          Dölj din profil från andra användare
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
                      {updateProfile.isPending ? 'Sparar...' : 'Spara ändringar'}
                    </button>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="font-display text-xl font-semibold">Notifikationer</h2>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">E-post notifikationer</label>
                          <p className="text-sm text-gray-400">
                            Få notifikationer via e-post
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
                          <label className="font-medium">Discord notifikationer</label>
                          <p className="text-sm text-gray-400">
                            Få notifikationer via Discord DM
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
                      {updateSettings.isPending ? 'Sparar...' : 'Spara ändringar'}
                    </button>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <h2 className="font-display text-xl font-semibold">Utseende</h2>

                    <div>
                      <label className="label">Tema</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['light', 'dark', 'system'].map((theme) => (
                          <button
                            key={theme}
                            onClick={() => setSettings({ ...settings, theme })}
                            className={`p-4 rounded-xl border-2 transition-colors ${
                              settings.theme === theme
                                ? 'border-primary-500 bg-primary-500/10'
                                : 'border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="text-sm font-medium capitalize">{theme === 'system' ? 'System' : theme === 'dark' ? 'Mörkt' : 'Ljust'}</div>
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
                      {updateSettings.isPending ? 'Sparar...' : 'Spara ändringar'}
                    </button>
                  </div>
                )}

                {/* Language Tab */}
                {activeTab === 'language' && (
                  <div className="space-y-6">
                    <h2 className="font-display text-xl font-semibold">Språk</h2>

                    <div>
                      <label className="label">Välj språk</label>
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
                      {updateSettings.isPending ? 'Sparar...' : 'Spara ändringar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
