import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
interface User {
  id: string;
  username: string;
  avatar?: string;
}

interface ClanMember {
  id: string;
  user: User;
  role: 'leader' | 'officer' | 'member';
  joinedAt: string;
}

interface Clan {
  id: string;
  name: string;
  tag: string;
  description?: string;
  logo?: string;
  banner?: string;
  color: string;
  isRecruiting: boolean;
  memberCount?: number;
  leader?: User;
  members?: ClanMember[];
  createdAt: string;
  updatedAt: string;
}

interface ClansListResponse {
  success: boolean;
  data: Clan[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateClanData {
  name: string;
  tag: string;
  description?: string;
  color?: string;
}

interface UpdateClanData {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  isRecruiting?: boolean;
}

// Hooks
export function useClansList(page = 1, limit = 20, recruiting?: boolean) {
  return useQuery({
    queryKey: ['clans', 'list', page, limit, recruiting],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (recruiting !== undefined) params.append('recruiting', recruiting.toString());
      
      const response = await api.get<ClansListResponse>(`/clans?${params}`);
      return response.data;
    },
  });
}

export function useClan(id: string) {
  return useQuery({
    queryKey: ['clans', 'detail', id],
    queryFn: async () => {
      const response = await api.get(`/clans/${id}`);
      return response.data.data as Clan;
    },
    enabled: !!id,
  });
}

export function useCreateClan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateClanData) => {
      const response = await api.post('/clans', data);
      return response.data.data as Clan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
    },
  });
}

export function useUpdateClan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateClanData) => {
      const response = await api.patch(`/clans/${id}`, data);
      return response.data.data as Clan;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
      queryClient.setQueryData(['clans', 'detail', data.id], data);
    },
  });
}

export function useJoinClan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clanId: string) => {
      const response = await api.post(`/clans/${clanId}/join`);
      return response.data.data;
    },
    onSuccess: (_, clanId) => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
      queryClient.invalidateQueries({ queryKey: ['clans', 'detail', clanId] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useLeaveClan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clanId: string) => {
      const response = await api.delete(`/clans/${clanId}/leave`);
      return response.data;
    },
    onSuccess: (_, clanId) => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
      queryClient.invalidateQueries({ queryKey: ['clans', 'detail', clanId] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clanId, memberId, role }: { clanId: string; memberId: string; role: 'officer' | 'member' }) => {
      const response = await api.patch(`/clans/${clanId}/members/${memberId}/role`, { role });
      return response.data.data;
    },
    onSuccess: (_, { clanId }) => {
      queryClient.invalidateQueries({ queryKey: ['clans', 'detail', clanId] });
    },
  });
}

export function useKickMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clanId, memberId }: { clanId: string; memberId: string }) => {
      await api.delete(`/clans/${clanId}/members/${memberId}`);
    },
    onSuccess: (_, { clanId }) => {
      queryClient.invalidateQueries({ queryKey: ['clans', 'detail', clanId] });
    },
  });
}

