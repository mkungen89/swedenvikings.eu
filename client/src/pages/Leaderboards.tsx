import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Crosshair, Target, Award, Crown } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useStats';

type LeaderboardType = 'level' | 'kills' | 'kdr' | 'winrate';

export default function Leaderboards() {
  const [selectedType, setSelectedType] = useState<LeaderboardType>('level');
  const [limit] = useState(50);

  const { data: leaderboard, isLoading } = useLeaderboard(selectedType, limit);

  const leaderboardTypes = [
    {
      id: 'level' as LeaderboardType,
      label: 'Nivå',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Högsta nivå',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      id: 'kills' as LeaderboardType,
      label: 'Kills',
      icon: <Crosshair className="w-5 h-5" />,
      description: 'Flest kills',
      color: 'from-red-500 to-rose-600',
    },
    {
      id: 'kdr' as LeaderboardType,
      label: 'K/D Ratio',
      icon: <Target className="w-5 h-5" />,
      description: 'Bästa K/D',
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'winrate' as LeaderboardType,
      label: 'Win Rate',
      icon: <Trophy className="w-5 h-5" />,
      description: 'Högsta vinst%',
      color: 'from-purple-500 to-violet-600',
    },
  ];

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Crown className={`w-6 h-6 ${getRankColor(rank)}`} />;
    }
    return null;
  };

  const formatValue = (type: LeaderboardType, player: any) => {
    switch (type) {
      case 'level':
        return `Lvl ${player.level}`;
      case 'kills':
        return player.kills.toLocaleString();
      case 'kdr':
        return player.kdr.toFixed(2);
      case 'winrate':
        return `${player.winRate.toFixed(1)}%`;
      default:
        return '-';
    }
  };

  const getSecondaryValue = (type: LeaderboardType, player: any) => {
    switch (type) {
      case 'level':
        return `${(player.experiencePoints / 1000).toFixed(1)}K XP`;
      case 'kills':
        return `${player.deaths} deaths`;
      case 'kdr':
        return `${player.kills}K / ${player.deaths}D`;
      case 'winrate':
        return `${player.gamesWon}W / ${player.gamesLost}L`;
      default:
        return '';
    }
  };

  const currentType = leaderboardTypes.find((t) => t.id === selectedType);

  return (
    <div className="min-h-screen bg-background-darker">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600/20 via-background-dark to-background-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold">Leaderboards</h1>
              <p className="text-gray-400 mt-1">Toppspelarna i communityn</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar - Leaderboard Type Selection */}
          <aside className="space-y-3">
            <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-4">
              Kategorier
            </h2>
            {leaderboardTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`
                  w-full flex items-center gap-3 p-4 rounded-xl transition-all
                  ${
                    selectedType === type.id
                      ? `bg-gradient-to-br ${type.color} text-white shadow-lg`
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }
                `}
              >
                {type.icon}
                <div className="flex-1 text-left">
                  <div className="font-semibold">{type.label}</div>
                  <div
                    className={`text-xs ${
                      selectedType === type.id ? 'text-white/80' : 'text-gray-500'
                    }`}
                  >
                    {type.description}
                  </div>
                </div>
              </button>
            ))}
          </aside>

          {/* Main Leaderboard */}
          <main>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold flex items-center gap-3">
                  {currentType?.icon}
                  {currentType?.label} Leaderboard
                </h2>
                <div className="text-sm text-gray-400">Top {limit}</div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((player, index) => {
                    const rank = index + 1;
                    const isTopThree = rank <= 3;

                    return (
                      <Link
                        key={player.userId}
                        to={`/profile/${player.userId}`}
                        className={`
                          group flex items-center gap-4 p-4 rounded-xl transition-all
                          ${
                            isTopThree
                              ? 'bg-gradient-to-r from-white/10 to-white/5 border-2 border-white/20 hover:border-primary-500/50'
                              : 'bg-white/5 border border-white/10 hover:border-primary-500/50 hover:bg-white/10'
                          }
                        `}
                      >
                        {/* Rank */}
                        <div className={`w-12 flex items-center justify-center font-display text-2xl font-bold ${getRankColor(rank)}`}>
                          {getRankIcon(rank) || `#${rank}`}
                        </div>

                        {/* Avatar */}
                        <div className="relative">
                          <img
                            src={player.user.avatar || '/default-avatar.png'}
                            alt={player.user.username}
                            className="w-14 h-14 rounded-xl border-2 border-white/20"
                          />
                          {isTopThree && (
                            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${
                              rank === 1 ? 'from-yellow-500 to-yellow-600' :
                              rank === 2 ? 'from-gray-400 to-gray-500' :
                              'from-amber-600 to-amber-700'
                            } flex items-center justify-center text-xs font-bold text-white`}>
                              {rank}
                            </div>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg group-hover:text-primary-400 transition-colors truncate">
                            {player.user.username}
                          </div>
                          <div className="text-sm text-gray-400">
                            {getSecondaryValue(selectedType, player)}
                          </div>
                        </div>

                        {/* Main Value */}
                        <div className="text-right">
                          <div className={`font-display text-2xl font-bold ${
                            isTopThree ? 'text-primary-400' : 'text-white'
                          }`}>
                            {formatValue(selectedType, player)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {player.gamesPlayed} matcher
                          </div>
                        </div>

                        {/* Level Badge */}
                        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 font-display font-bold">
                          {player.level}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Ingen data tillgänglig än</p>
                </div>
              )}
            </div>

            {/* Stats Summary */}
            {leaderboard && leaderboard.length > 0 && (
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="card p-4">
                  <div className="text-sm text-gray-400 mb-1">Högsta värde</div>
                  <div className="font-display text-2xl font-bold text-primary-400">
                    {formatValue(selectedType, leaderboard[0])}
                  </div>
                </div>
                <div className="card p-4">
                  <div className="text-sm text-gray-400 mb-1">Genomsnitt (Top 10)</div>
                  <div className="font-display text-2xl font-bold">
                    {(() => {
                      const top10 = leaderboard.slice(0, 10);
                      const avg = top10.reduce((sum, p) => {
                        switch (selectedType) {
                          case 'level': return sum + p.level;
                          case 'kills': return sum + p.kills;
                          case 'kdr': return sum + p.kdr;
                          case 'winrate': return sum + p.winRate;
                          default: return sum;
                        }
                      }, 0) / top10.length;

                      if (selectedType === 'winrate') return `${avg.toFixed(1)}%`;
                      if (selectedType === 'kdr') return avg.toFixed(2);
                      return Math.round(avg).toLocaleString();
                    })()}
                  </div>
                </div>
                <div className="card p-4">
                  <div className="text-sm text-gray-400 mb-1">Totalt spelare</div>
                  <div className="font-display text-2xl font-bold text-accent-400">
                    {leaderboard.length}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
