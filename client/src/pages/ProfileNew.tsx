import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Shield,
  ExternalLink,
  Edit2,
  Loader2,
  Trophy,
  Target,
  Award,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUserProfile } from '@/hooks/useUsers';

// Import tab components
import ProfileOverview from '@/components/profile/ProfileOverview';
import ProfileBattlelog from '@/components/profile/ProfileBattlelog';
import ProfileMedals from '@/components/profile/ProfileMedals';

type TabType = 'overview' | 'battlelog' | 'medals';

export default function ProfileNew() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const { data: profile, isLoading, error } = useUserProfile(id || '');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const isOwnProfile = currentUser?.id === id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
              <p className="text-gray-400">Laddar profil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background-dark py-12 text-center">
        <p className="text-gray-400">Profilen kunde inte hittas.</p>
      </div>
    );
  }

  if (profile.isPrivate && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-background-dark py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="card p-8">
            <Shield className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">{profile.username}</h1>
            <p className="text-gray-400">Denna profil är privat.</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Översikt', icon: <Target className="w-4 h-4" /> },
    { id: 'battlelog', label: 'Battlelog', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'medals', label: 'Medaljer', icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Profile Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-64 sm:h-80 overflow-hidden">
          {profile.banner ? (
            <img
              src={profile.banner}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-600/20 via-accent-600/20 to-primary-900/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 sm:-mt-24">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl bg-background-card border-4 border-background-dark overflow-hidden">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-display font-bold bg-gradient-to-br from-primary-600 to-accent-600 text-white">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Level Badge */}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg px-3 py-1.5 border-2 border-background-dark">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    <span className="font-bold text-sm">12</span>
                  </div>
                </div>
              </div>

              {/* Name & Info */}
              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="font-display text-3xl sm:text-4xl font-bold">
                    {profile.username}
                  </h1>
                  {profile.roles?.map((role) => (
                    <span
                      key={role.id}
                      className="px-3 py-1 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: `${role.color}20`,
                        color: role.color,
                        border: `1px solid ${role.color}40`,
                      }}
                    >
                      {role.name}
                    </span>
                  ))}
                </div>

                {profile.bio && (
                  <p className="text-gray-300 mb-4 max-w-2xl">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    Medlem sedan {new Date(profile.createdAt).toLocaleDateString('sv-SE')}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    Senast online: {profile.lastSeenAt ? new Date(profile.lastSeenAt).toLocaleDateString('sv-SE') : 'Okänd'}
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              {isOwnProfile && (
                <Link
                  to="/settings"
                  className="btn-secondary whitespace-nowrap self-start sm:self-end"
                >
                  <Edit2 className="w-4 h-4" />
                  Redigera Profil
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 sticky top-0 bg-background-dark/95 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap
                  border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <ProfileOverview profile={profile} />}
          {activeTab === 'battlelog' && <ProfileBattlelog userId={profile.id} />}
          {activeTab === 'medals' && <ProfileMedals userId={profile.id} />}
        </motion.div>
      </div>
    </div>
  );
}
