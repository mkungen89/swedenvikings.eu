import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// ============================================
// Types
// ============================================

export interface PlayerStats {
  id: string;
  userId: string;
  totalPlaytime: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  kdr: number;
  accuracy: number;
  pointsCaptured: number;
  pointsDefended: number;
  suppliesDelivered: number;
  vehiclesDestroyed: number;
  revives: number;
  teamKills: number;
  distanceTraveled: number;
  longestKillStreak: number;
  bestScore: number;
  mostKillsInGame: number;
  experiencePoints: number;
  level: number;
  globalRank?: number;
  countryRank?: number;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface Match {
  id: string;
  map: string;
  gameMode: string;
  duration: number;
  result: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  pointsCaptured: number;
  pointsDefended: number;
  suppliesDelivered: number;
  revives: number;
  xpEarned: number;
  playedAt: string;
}

export interface MatchHistory {
  matches: Match[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================
// Hooks
// ============================================

/**
 * Get player stats for a specific user
 */
export function usePlayerStats(userId: string) {
  return useQuery({
    queryKey: ['stats', userId],
    queryFn: async () => {
      const response = await api.get<PlayerStats>(`/stats/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

/**
 * Get match history for a specific user
 */
export function useMatchHistory(
  userId: string,
  options?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: ['matches', userId, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await api.get<MatchHistory>(
        `/stats/${userId}/matches?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!userId,
  });
}

/**
 * Get leaderboard
 */
export function useLeaderboard(type: 'level' | 'kills' | 'kdr' | 'winrate' | 'xp', limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', type, limit],
    queryFn: async () => {
      const response = await api.get<PlayerStats[]>(
        `/stats/leaderboard/${type}?limit=${limit}`
      );
      return response.data;
    },
  });
}

/**
 * Record a new match
 */
export function useRecordMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      map: string;
      gameMode: string;
      duration: number;
      result: 'win' | 'loss' | 'draw';
      kills?: number;
      deaths?: number;
      assists?: number;
      score?: number;
      pointsCaptured?: number;
      pointsDefended?: number;
      suppliesDelivered?: number;
      revives?: number;
      xpEarned?: number;
    }) => {
      const { userId, ...matchData } = data;
      const response = await api.post(`/stats/${userId}/matches`, matchData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate stats and match history
      queryClient.invalidateQueries({ queryKey: ['stats', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
