import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Crosshair,
  Heart,
  Award,
  Clock,
  Map,
  Trophy,
  Star,
  Shield,
  Truck,
  Wrench,
  Users,
  Zap,
  Flag,
} from 'lucide-react';
import { usePlayerStats, useMatchHistory } from '@/hooks/useStats';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

type Faction = 'NATO' | 'RUS';

interface ProfileBattlelogProps {
  userId: string;
}

export default function ProfileBattlelog({ userId }: ProfileBattlelogProps) {
  const [selectedFaction, setSelectedFaction] = useState<Faction>('NATO');
  const { data: playerStats, isLoading: statsLoading } = usePlayerStats(userId);
  const { data: matchHistory, isLoading: matchesLoading } = useMatchHistory(userId, { limit: 10 });
  const queryClient = useQueryClient();

  // Update preferred faction
  const updateFactionMutation = useMutation({
    mutationFn: async (faction: Faction) => {
      await axios.put(`/api/battlelog/players/${userId}/faction`, { faction });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats', userId] });
    },
  });

  const stats = playerStats || {
    totalPlaytime: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    winRate: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    headshots: 0,
    kdr: 0,
    accuracy: 0,
    pointsCaptured: 0,
    pointsDefended: 0,
    suppliesDelivered: 0,
    vehiclesDestroyed: 0,
    revives: 0,
    distanceTraveled: 0,
    longestKillStreak: 0,
    mostKillsInGame: 0,
    bestScore: 0,
    experiencePoints: 0,
    level: 1,
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const scorePerMin = stats.totalPlaytime > 0
    ? Math.round((stats.bestScore / (stats.totalPlaytime / 60)))
    : 0;

  if (statsLoading || matchesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate progress to next level (mock data - adjust based on your XP system)
  const currentLevelXP = Math.pow(stats.level, 2) * 1000;
  const nextLevelXP = Math.pow(stats.level + 1, 2) * 1000;
  const progressXP = stats.experiencePoints - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const progressPercentage = Math.min((progressXP / requiredXP) * 100, 100);

  const handleFactionChange = (faction: Faction) => {
    setSelectedFaction(faction);
    updateFactionMutation.mutate(faction);
  };

  return (
    <div className="space-y-6">
      {/* Faction Selector */}
      <div className="flex items-center justify-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-white/10">
        <Flag className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-400 font-medium">Välj Fraktion:</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleFactionChange('NATO')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              selectedFaction === 'NATO'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              NATO
            </div>
          </button>
          <button
            onClick={() => handleFactionChange('RUS')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              selectedFaction === 'RUS'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              RUS
            </div>
          </button>
        </div>
      </div>

      {/* Hero Section - Battlefield Style */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border border-white/10">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)',
          }} />
        </div>

        <div className="relative p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
            {/* Left Stats */}
            <div className="space-y-6">
              {/* Rank Emblem */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-2xl border-4 border-yellow-600/50">
                    <div className="text-center">
                      <div className="text-xs font-bold text-black/70 uppercase tracking-wider">Rank</div>
                      <div className="text-4xl font-black text-black">{stats.level}</div>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-slate-900 border-2 border-yellow-500 rounded-lg px-2 py-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">Rank {stats.level}</div>
                  <div className="text-2xl font-display font-bold text-white mb-2">
                    Master Sergeant {stats.level} Star
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {progressXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
                  </div>
                </div>
              </div>

              {/* Time Played */}
              <div>
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Time Played</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-display font-bold">{formatDuration(stats.totalPlaytime)}</div>
                </div>
                <div className="mt-3">
                  <CircularProgress
                    percentage={75}
                    size={120}
                    strokeWidth={8}
                    color="from-blue-500 to-cyan-500"
                  />
                </div>
              </div>

              {/* Score/Min */}
              <div>
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Score / Min</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-display font-bold">{scorePerMin}</div>
                  <div className="text-sm text-gray-500">{formatDuration(stats.totalPlaytime)}</div>
                </div>
                <div className="mt-3">
                  <CircularProgress
                    percentage={60}
                    size={120}
                    strokeWidth={8}
                    color="from-gray-500 to-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Center - Player Image */}
            <div className="hidden lg:block">
              <div className="relative w-80 h-96">
                {/* Placeholder soldier silhouette - replace with actual Arma Reforger soldier image */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-end justify-center">
                  <Shield className="w-64 h-64 text-white/10" strokeWidth={1} />
                </div>
              </div>
            </div>

            {/* Right Stats */}
            <div className="space-y-6">
              {/* W/L Ratio */}
              <div>
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">W/L Ratio</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-display font-bold">
                    {stats.gamesLost > 0 ? (stats.gamesWon / stats.gamesLost).toFixed(2) : stats.gamesWon}
                  </div>
                  <div className="text-sm text-gray-500">{stats.gamesWon} wins</div>
                </div>
                <div className="mt-3">
                  <CircularProgress
                    percentage={stats.winRate}
                    size={120}
                    strokeWidth={8}
                    color="from-green-500 to-emerald-500"
                  />
                </div>
              </div>

              {/* Accuracy */}
              <div>
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Accuracy</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-display font-bold">{stats.accuracy}%</div>
                  <div className="text-sm text-gray-500">{stats.headshots} shots hit</div>
                </div>
                <div className="mt-3">
                  <CircularProgress
                    percentage={stats.accuracy}
                    size={120}
                    strokeWidth={8}
                    color="from-purple-500 to-pink-500"
                  />
                </div>
              </div>

              {/* K/D Ratio */}
              <div>
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">K/D Ratio</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-display font-bold">{stats.kdr}</div>
                  <div className="text-sm text-gray-500">{stats.kills.toLocaleString()} kills</div>
                </div>
                <div className="mt-3">
                  <CircularProgress
                    percentage={Math.min((stats.kdr / 3) * 100, 100)}
                    size={120}
                    strokeWidth={8}
                    color="from-red-500 to-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Top Weapons & Assignments */}
        <div className="space-y-6">
          {/* Top Weapons */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Top Weapons</h2>
            <div className="space-y-4">
              {[
                { name: 'M4A1', kills: 203, icon: '🔫' },
                { name: 'AK-74M', kills: 191, icon: '🔫' },
                { name: 'M16A3', kills: 168, icon: '🔫' },
                { name: 'AEK-971', kills: 77, icon: '🔫' },
                { name: 'M4A1', kills: 50, icon: '🔫' },
              ].map((weapon, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                  <div className="text-2xl">{weapon.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-primary-400">{weapon.name}</div>
                    <div className="text-xs text-gray-500">{weapon.kills} Kills</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{i + 1}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm text-primary-400 hover:text-primary-300 font-medium">
              View all Weapons & Equipment →
            </button>
          </div>

          {/* Assignments */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Assignments and CO-OP</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-400 uppercase mb-1">Assignments</div>
                <div className="text-3xl font-display font-bold text-primary-400">5 / 75</div>
                <div className="text-xs text-gray-500 mt-1">Next Unlock</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-xl">🔫</div>
                  <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500" style={{ width: '30%' }} />
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase mb-1">CO-OP Missions</div>
                <div className="text-3xl font-display font-bold text-accent-400">0 / 6</div>
                <div className="text-xs text-gray-500 mt-1">Next Unlock</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-xl">🔫</div>
                  <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-500" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full text-sm text-primary-400 hover:text-primary-300 font-medium">
              View all Assignments or CO-OP →
            </button>
          </div>
        </div>

        {/* Middle Column - Multiplayer Score & Awards */}
        <div className="space-y-6">
          {/* Multiplayer Score */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Multiplayer Score
            </h2>
            <div className="space-y-3">
              <ScoreRow icon={<Crosshair className="w-4 h-4" />} label="Assault" value="265,070" color="text-red-500" />
              <ScoreRow icon={<Wrench className="w-4 h-4" />} label="Engineer" value="25,752" color="text-yellow-500" />
              <ScoreRow icon={<Shield className="w-4 h-4" />} label="Support" value="7,357" color="text-blue-500" />
              <ScoreRow icon={<Target className="w-4 h-4" />} label="Recon" value="6,686" color="text-green-500" />
              <ScoreRow icon={<Truck className="w-4 h-4" />} label="Vehicles" value="130" color="text-gray-400" />
              <div className="pt-3 border-t border-white/10">
                <ScoreRow icon={<Trophy className="w-4 h-4" />} label="Combat" value="=304,995" bold />
              </div>
              <ScoreRow icon={<Award className="w-4 h-4" />} label="Award" value="+239,500" color="text-primary-400" />
              <ScoreRow icon={<Star className="w-4 h-4" />} label="Unlocks" value="+19,800" color="text-accent-400" />
              <div className="pt-3 border-t border-white/10">
                <ScoreRow icon={<Zap className="w-4 h-4" />} label="Total" value="564,295" bold large />
              </div>
            </div>
          </div>

          {/* Latest Awards */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Latest Awards</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Headshot', icon: '🎯', color: 'from-red-500 to-orange-500' },
                { name: 'Ace Squad', icon: '👥', color: 'from-blue-500 to-cyan-500' },
                { name: 'Savior', icon: '🛡️', color: 'from-green-500 to-emerald-500' },
              ].map((award, i) => (
                <div key={i} className={`aspect-square rounded-lg bg-gradient-to-br ${award.color} p-4 flex flex-col items-center justify-center`}>
                  <div className="text-3xl mb-1">{award.icon}</div>
                  <div className="text-xs font-bold text-center text-white">{award.name}</div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm text-primary-400 hover:text-primary-300 font-medium">
              View all Awards →
            </button>
          </div>
        </div>

        {/* Right Column - All Time Statistics */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold mb-4">All Time Statistics</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <StatItem label="Kills" value={stats.kills.toLocaleString()} />
                <StatItem label="Deaths" value={stats.deaths.toLocaleString()} />
                <StatItem label="K/D ratio" value={stats.kdr.toString()} highlight />
                <StatItem label="Kill assists" value={stats.assists.toLocaleString()} />
                <StatItem label="Score/Min" value={scorePerMin.toString()} />
                <StatItem label="Longest Headshot" value="123.88 m" />
                <StatItem label="Avg. Weapon Accuracy" value={`${stats.accuracy}%`} />
                <StatItem label="Highest Kill Streak" value="15" />
                <StatItem label="Skill" value="877.22" />
                <StatItem label="Avenger Kills" value="137" />
                <StatItem label="Savior Kills" value="134" />
                <StatItem label="Nemesis Kills" value="28" />
                <StatItem label="Squad Score Bonus" value="17,400" />
                <StatItem label="Repairs" value="0" />
                <StatItem label="Revives" value={stats.revives.toLocaleString()} />
                <StatItem label="Resupplies" value="20" />
                <StatItem label="Heals" value="14,312" />
                <StatItem label="Suppression Assists" value="257" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weapon Statistics Table */}
      <div className="card p-6">
        <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <Crosshair className="w-6 h-6 text-primary-500" />
          Weapon Statistics
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-gray-400">
                <th className="text-left py-3 px-2">#</th>
                <th className="text-left py-3 px-4">Weapon</th>
                <th className="text-center py-3 px-4">Service Stars</th>
                <th className="text-center py-3 px-4">Kills</th>
                <th className="text-center py-3 px-4">Kills / Min</th>
                <th className="text-center py-3 px-4">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'M416', stars: 2, kills: 203, kpm: 1.21, accuracy: 14.12, time: '2h 47m' },
                { name: 'AK-74M', stars: 1, kills: 191, kpm: 1.25, accuracy: 18.84, time: '2h 32m' },
                { name: 'M16A3', stars: 1, kills: 168, kpm: 1.4, accuracy: 16.53, time: '1h 59m' },
                { name: 'AEK-971', stars: 0, kills: 77, kpm: 1.16, accuracy: 12.57, time: '1h 6m' },
                { name: 'M4A1', stars: 0, kills: 50, kpm: 1.47, accuracy: 14.09, time: '33m 59s' },
              ].map((weapon, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-2 text-gray-500 font-mono">{i + 1}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🔫</div>
                      <div>
                        <div className="font-semibold text-primary-400">{weapon.name}</div>
                        <div className="text-xs text-gray-500">{weapon.time}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-1">
                      {weapon.stars > 0 ? (
                        <>
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-sm">{weapon.stars}</span>
                          <div className="flex-1 max-w-[100px] h-1 bg-slate-700 rounded-full overflow-hidden ml-2">
                            <div className="h-full bg-yellow-500" style={{ width: '40%' }} />
                          </div>
                        </>
                      ) : (
                        <Star className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-bold">{weapon.kills}</td>
                  <td className="py-4 px-4 text-center text-gray-300">{weapon.kpm}</td>
                  <td className="py-4 px-4 text-center text-gray-300">{weapon.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Statistics Table */}
      <div className="card p-6">
        <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <Truck className="w-6 h-6 text-accent-500" />
          Vehicle Statistics
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-gray-400">
                <th className="text-left py-3 px-2">#</th>
                <th className="text-left py-3 px-4">Vehicle</th>
                <th className="text-center py-3 px-4">Service Stars</th>
                <th className="text-center py-3 px-4">Kills</th>
                <th className="text-center py-3 px-4">Time used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'M1 ABRAMS', kills: 1, time: '1m 50s' },
                { name: 'GAZ-3937 VODNIK', kills: 1, time: '0m 34s' },
                { name: 'M220 TOW LAUNCHER', kills: 0, time: '0m 59s' },
                { name: 'BMP-2M', kills: 0, time: '0m 59s' },
                { name: 'M1128', kills: 0, time: '0m 42s' },
                { name: 'M1114 HMMWV', kills: 0, time: '0m 34s' },
              ].map((vehicle, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-2 text-gray-500 font-mono">{i + 1}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🚙</div>
                      <div className="font-semibold text-accent-400">{vehicle.name}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Star className="w-4 h-4 text-gray-600 inline" />
                  </td>
                  <td className="py-4 px-4 text-center font-bold">{vehicle.kills}</td>
                  <td className="py-4 px-4 text-center text-gray-300">{vehicle.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Circular Progress Component (similar to Battlefield)
function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = "from-primary-500 to-primary-400"
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className={`text-${color.split('-')[1]}-500`} stopColor="currentColor" />
            <stop offset="100%" className={`text-${color.split('-')[1]}-400`} stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

function ScoreRow({
  icon,
  label,
  value,
  color,
  bold = false,
  large = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-bold' : ''}`}>
      <div className="flex items-center gap-2">
        <div className={color || 'text-gray-400'}>{icon}</div>
        <span className={`${large ? 'text-lg' : 'text-sm'} ${color || 'text-gray-300'}`}>{label}</span>
      </div>
      <span className={`${large ? 'text-xl' : 'text-sm'} font-mono ${color || 'text-white'}`}>{value}</span>
    </div>
  );
}

function StatItem({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean
}) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`font-bold ${highlight ? 'text-primary-400 text-lg' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
