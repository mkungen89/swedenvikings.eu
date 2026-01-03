import { ExternalLink, Users, Trophy, Target, Crosshair, Shield } from 'lucide-react';
import { usePlayerStats } from '@/hooks/useStats';
import { useUserAchievements } from '@/hooks/useAchievements';

interface ProfileOverviewProps {
  profile: any;
}

export default function ProfileOverview({ profile }: ProfileOverviewProps) {
  const { data: playerStats, isLoading: statsLoading } = usePlayerStats(profile.id);
  const { data: userAchievements, isLoading: achievementsLoading } = useUserAchievements(profile.id);
  const platformIcons: Record<string, string> = {
    discord: 'Discord',
    twitter: 'Twitter',
    youtube: 'YouTube',
    twitch: 'Twitch',
    steam: 'Steam',
    website: 'Hemsida',
  };

  // Calculate XP for next level
  const calculateXPForNextLevel = (currentLevel: number): number => {
    return Math.pow(currentLevel, 2) * 1000;
  };

  const stats = playerStats ? {
    kills: playerStats.kills,
    deaths: playerStats.deaths,
    kdr: playerStats.kdr,
    winRate: playerStats.winRate,
    level: playerStats.level,
    xp: playerStats.experiencePoints,
    xpToNextLevel: calculateXPForNextLevel(playerStats.level),
    playtime: Math.floor(playerStats.totalPlaytime / 60), // Convert minutes to hours
    gamesPlayed: playerStats.gamesPlayed,
  } : {
    kills: 0,
    deaths: 0,
    kdr: 0,
    winRate: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 1000,
    playtime: 0,
    gamesPlayed: 0,
  };

  // Get recent achievements (completed, sorted by date)
  const recentAchievements = userAchievements
    ? userAchievements
        .filter(ua => ua.isCompleted && ua.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .slice(0, 3)
    : [];

  const completedAchievementsCount = userAchievements?.filter(ua => ua.isCompleted).length || 0;
  const totalAchievementsCount = userAchievements?.length || 0;

  const rarityColors: Record<string, string> = {
    common: 'from-gray-600 to-gray-700',
    rare: 'from-blue-600 to-blue-700',
    epic: 'from-purple-600 to-purple-700',
    legendary: 'from-yellow-600 to-orange-600',
  };

  if (statsLoading || achievementsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Content - Left Column (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Stats Overview */}
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            Statistik Översikt
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Kills */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Crosshair className="w-4 h-4" />
                Kills
              </div>
              <div className="font-display text-2xl font-bold">{stats.kills.toLocaleString()}</div>
            </div>

            {/* Deaths */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-gray-400 text-sm mb-1">Deaths</div>
              <div className="font-display text-2xl font-bold">{stats.deaths.toLocaleString()}</div>
            </div>

            {/* K/D Ratio */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-gray-400 text-sm mb-1">K/D</div>
              <div className="font-display text-2xl font-bold text-green-400">{stats.kdr}</div>
            </div>

            {/* Win Rate */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-gray-400 text-sm mb-1">Win Rate</div>
              <div className="font-display text-2xl font-bold text-primary-400">{stats.winRate}%</div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Level {stats.level}</span>
              <span className="text-sm text-gray-400">
                {stats.xp.toLocaleString()} / {stats.xpToNextLevel.toLocaleString()} XP
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Senaste Prestationer
          </h2>

          <div className="grid gap-4">
            {recentAchievements.length > 0 ? (
              recentAchievements.map((userAchievement) => (
                <div
                  key={userAchievement.id}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/50 transition-all cursor-pointer"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${rarityColors.epic} flex items-center justify-center text-3xl`}>
                    {userAchievement.achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 group-hover:text-primary-400 transition-colors">
                      {userAchievement.achievement.name}
                    </h3>
                    <p className="text-sm text-gray-400">{userAchievement.achievement.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-green-400">+{userAchievement.achievement.xpReward} XP</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {userAchievement.completedAt && new Date(userAchievement.completedAt).toLocaleDateString('sv-SE')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                Inga prestationer uppnådda än
              </div>
            )}
          </div>
        </div>

        {/* Clan Info */}
        {profile.clanMemberships && profile.clanMemberships.length > 0 && (
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-500" />
              Clan
            </h2>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-600 to-primary-600 flex items-center justify-center font-display font-bold text-2xl">
                SV
              </div>
              <div>
                <h3 className="font-semibold text-lg">Sweden Vikings</h3>
                <p className="text-sm text-gray-400">Medlem sedan 2024-01-01</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Right Column (1/3) */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Snabbstatistik</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Speltid</span>
              <span className="font-medium">{stats.playtime}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Matcher</span>
              <span className="font-medium">{stats.gamesPlayed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Prestationer</span>
              <span className="font-medium">{completedAchievementsCount}/{totalAchievementsCount}</span>
            </div>
          </div>
        </div>

        {/* Social Links */}
        {profile.socialLinks && profile.socialLinks.length > 0 && (
          <div className="card p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Sociala Länkar</h2>
            <div className="space-y-2">
              {profile.socialLinks.map((link: any) => (
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

        {/* Top Weapons */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Populära Vapen</h2>
          <div className="space-y-3">
            {[
              { name: 'M4A1', kills: 342, accuracy: 45 },
              { name: 'AK-74', kills: 298, accuracy: 42 },
              { name: 'SVD', kills: 156, accuracy: 68 },
            ].map((weapon, i) => (
              <div key={weapon.name} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{weapon.name}</span>
                  <span className="text-sm text-gray-400">{weapon.kills} kills</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${weapon.accuracy}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{weapon.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
