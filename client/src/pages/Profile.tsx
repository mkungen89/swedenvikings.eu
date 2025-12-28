import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Shield, ExternalLink, Edit2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUserProfile } from '@/hooks/useUsers';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const { data: profile, isLoading, error } = useUserProfile(id || '');

  const isOwnProfile = currentUser?.id === id;

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-400">Laddar profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400">Profilen kunde inte hittas.</p>
      </div>
    );
  }

  if (profile.isPrivate && !isOwnProfile) {
    return (
      <div className="py-12">
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

  const platformIcons: Record<string, string> = {
    discord: 'Discord',
    twitter: 'Twitter',
    youtube: 'YouTube',
    twitch: 'Twitch',
    steam: 'Steam',
    website: 'Hemsida',
  };

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Banner */}
          <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-4">
            {profile.banner ? (
              <img
                src={profile.banner}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-600/30 to-accent-600/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 to-transparent" />
          </div>

          {/* Profile Info */}
          <div className="relative -mt-16 sm:-mt-20 px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-background-card border-4 border-background-dark overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-display font-bold bg-gradient-to-br from-primary-600 to-accent-600 text-white">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name & Roles */}
              <div className="flex-1 pt-2">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">
                    {profile.username}
                  </h1>
                  {profile.roles?.map((role) => (
                    <span
                      key={role.id}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: `${role.color}20`, color: role.color }}
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
                {profile.bio && (
                  <p className="text-gray-400 mb-4">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Medlem sedan {new Date(profile.createdAt).toLocaleDateString('sv-SE')}
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              {isOwnProfile && (
                <Link to="/settings" className="btn-secondary">
                  <Edit2 className="w-4 h-4" />
                  Redigera
                </Link>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Activity placeholder */}
              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold mb-4">Aktivitet</h2>
                <p className="text-gray-400 text-center py-8">
                  Ingen aktivitet att visa.
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Social Links */}
              {profile.socialLinks && profile.socialLinks.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-display text-lg font-semibold mb-4">Sociala länkar</h2>
                  <div className="space-y-2">
                    {profile.socialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
                      >
                        <span className="flex-1">{platformIcons[link.platform] || link.platform}</span>
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats placeholder */}
              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold mb-4">Statistik</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Events deltagit</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Clan</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
