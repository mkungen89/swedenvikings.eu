import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// ============================================
// Types
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  requirement: {
    type: string;
    value: number;
  };
  xpReward: number;
  isHidden: boolean;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  achievement: Achievement;
}

// ============================================
// Hooks
// ============================================

/**
 * Get all achievements
 */
export function useAchievements(filters?: {
  category?: string;
  includeHidden?: boolean;
}) {
  return useQuery({
    queryKey: ['achievements', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.includeHidden) params.append('includeHidden', 'true');

      const response = await api.get<Achievement[]>(
        `/achievements?${params.toString()}`
      );
      return response.data;
    },
  });
}

/**
 * Get user's achievements with progress
 */
export function useUserAchievements(userId: string) {
  return useQuery({
    queryKey: ['userAchievements', userId],
    queryFn: async () => {
      const response = await api.get<UserAchievement[]>(
        `/achievements/user/${userId}`
      );
      return response.data;
    },
    enabled: !!userId,
  });
}

/**
 * Create a new achievement (Admin only)
 */
export function useCreateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Achievement, 'id' | 'createdAt'>) => {
      const response = await api.post<Achievement>('/achievements', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

/**
 * Update an achievement (Admin only)
 */
export function useUpdateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string } & Partial<Achievement>) => {
      const { id, ...updateData } = data;
      const response = await api.put<Achievement>(
        `/achievements/${id}`,
        updateData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

/**
 * Delete an achievement (Admin only)
 */
export function useDeleteAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/achievements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

/**
 * Check achievement progress for a user
 */
export function useCheckAchievements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post<{
        message: string;
        newlyCompleted: { id: string; xpReward: number }[];
      }>(`/achievements/check/${userId}`);
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['userAchievements', userId] });
      queryClient.invalidateQueries({ queryKey: ['stats', userId] });
    },
  });
}
