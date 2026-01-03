import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// ============================================
// Types
// ============================================

export interface Medal {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  imageUrl?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: string;
    value: number;
  };
  createdAt: string;
}

export interface UserMedal {
  id: string;
  userId: string;
  medalId: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  createdAt: string;
  medal: Medal;
}

// ============================================
// Hooks
// ============================================

/**
 * Get all available medals
 */
export function useMedals(filters?: {
  category?: string;
  tier?: string;
  rarity?: string;
}) {
  return useQuery({
    queryKey: ['medals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.tier) params.append('tier', filters.tier);
      if (filters?.rarity) params.append('rarity', filters.rarity);

      const response = await api.get<Medal[]>(`/medals?${params.toString()}`);
      return response.data;
    },
  });
}

/**
 * Get user's medals with progress
 */
export function useUserMedals(userId: string) {
  return useQuery({
    queryKey: ['userMedals', userId],
    queryFn: async () => {
      const response = await api.get<UserMedal[]>(`/medals/user/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

/**
 * Create a new medal (Admin only)
 */
export function useCreateMedal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Medal, 'id' | 'createdAt'>) => {
      const response = await api.post<Medal>('/medals', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medals'] });
    },
  });
}

/**
 * Update a medal (Admin only)
 */
export function useUpdateMedal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string } & Partial<Medal>) => {
      const { id, ...updateData } = data;
      const response = await api.put<Medal>(`/medals/${id}`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medals'] });
    },
  });
}

/**
 * Delete a medal (Admin only)
 */
export function useDeleteMedal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/medals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medals'] });
    },
  });
}

/**
 * Check medal progress for a user
 */
export function useCheckMedals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post<{
        message: string;
        newlyUnlocked: string[];
      }>(`/medals/check/${userId}`);
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['userMedals', userId] });
    },
  });
}
