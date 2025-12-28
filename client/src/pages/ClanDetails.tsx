import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Shield, Users, Calendar, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useClan, useJoinClan, useLeaveClan } from '@/hooks/useClans';
import toast from 'react-hot-toast';

export default function ClanDetails() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user, login } = useAuthStore();
  const { data: clan, isLoading, error } = useClan(id || '');
  const joinClan = useJoinClan();
  const leaveClan = useLeaveClan();

  const handleJoin = async () => {
    if (!id) return;
    try {
      await joinClan.mutateAsync(id);
      toast.success('Du har gått med i clanen!');
    } catch {
      toast.error('Kunde inte gå med i clanen');
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    try {
      await leaveClan.mutateAsync(id);
      toast.success('Du har lämnat clanen');
    } catch {
      toast.error('Kunde inte lämna clanen');
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-400">Laddar clan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !clan) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400">Clanen kunde inte hittas.</p>
        <Link to="/clans" className="text-primary-400 hover:underline mt-4 inline-block">
          Tillbaka till clans
        </Link>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    leader: 'Ledare',
    officer: 'Officer',
    member: 'Medlem',
  };

  const roleIcons: Record<string, typeof Crown> = {
    leader: Crown,
    officer: Shield,
    member: Users,
  };

  const isInClan = clan.members?.some(m => m.user.id === user?.id);

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/clans"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till clans
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Banner */}
          {clan.banner && (
            <div className="relative h-48 rounded-2xl overflow-hidden mb-8">
              <img
                src={clan.banner}
                alt={clan.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 to-transparent" />
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-3xl text-white shadow-lg"
              style={{ backgroundColor: clan.color }}
            >
              {clan.tag}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold">{clan.name}</h1>
                {clan.isRecruiting && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                    Rekryterar
                  </span>
                )}
              </div>
              <p className="text-gray-400 mb-4">{clan.description || 'Ingen beskrivning.'}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {clan.members?.length || clan.memberCount || 0} medlemmar
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Skapad {new Date(clan.createdAt).toLocaleDateString('sv-SE')}
                </div>
              </div>
            </div>

            {/* Actions */}
            {isAuthenticated ? (
              !isInClan && clan.isRecruiting ? (
                <button
                  onClick={handleJoin}
                  disabled={joinClan.isPending}
                  className="btn-primary"
                >
                  {joinClan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gå med'}
                </button>
              ) : isInClan ? (
                <button
                  onClick={handleLeave}
                  disabled={leaveClan.isPending}
                  className="btn-danger"
                >
                  {leaveClan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lämna clan'}
                </button>
              ) : !clan.isRecruiting ? (
                <span className="text-sm text-gray-500">Rekryterar inte</span>
              ) : null
            ) : (
              <button onClick={login} className="btn-primary">
                Logga in för att gå med
              </button>
            )}
          </div>

          {/* Members */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold mb-6">Medlemmar</h2>
            {clan.members && clan.members.length > 0 ? (
              <div className="space-y-4">
                {clan.members.map((member) => {
                  const Icon = roleIcons[member.role] || Users;
                  return (
                    <Link
                      key={member.id}
                      to={`/profile/${member.user.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-background-darker flex items-center justify-center font-medium border border-white/10 overflow-hidden">
                        {member.user.avatar ? (
                          <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          member.user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{member.user.username}</div>
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Icon className="w-3 h-3" />
                          {roleLabels[member.role] || member.role}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(member.joinedAt).toLocaleDateString('sv-SE')}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">Inga medlemmar.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
