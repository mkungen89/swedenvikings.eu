import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
export interface User {
  id: string;
  username: string;
  avatar?: string;
  lastSeenAt?: string;
}

export interface Friend extends User {
  friendshipId: string;
  friendsSince: string;
}

export interface FriendRequest {
  requestId: string;
  from?: User;
  to?: User;
  sentAt: string;
}

export interface FriendshipStatus {
  status: 'none' | 'pending' | 'friends' | 'blocked' | 'self';
  direction?: 'sent' | 'received';
  requestId?: string;
  friendshipId?: string;
  since?: string;
}

interface FriendsListResponse {
  success: boolean;
  data: Friend[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RequestsListResponse {
  success: boolean;
  data: FriendRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Friend List Hooks
// ============================================

export function useFriends(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['friends', 'list', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<FriendsListResponse>(`/friends?${params}`);
      return response.data;
    },
  });
}

export function useFriendRequests(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['friends', 'requests', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<RequestsListResponse>(`/friends/requests?${params}`);
      return response.data;
    },
  });
}

export function useSentFriendRequests(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['friends', 'requests', 'sent', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<RequestsListResponse>(`/friends/requests/sent?${params}`);
      return response.data;
    },
  });
}

export function useFriendshipStatus(userId: string) {
  return useQuery({
    queryKey: ['friends', 'status', userId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: FriendshipStatus }>(`/friends/status/${userId}`);
      return response.data.data;
    },
    enabled: !!userId,
  });
}

export function useBlockedUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['friends', 'blocked', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<FriendsListResponse>(`/friends/blocked?${params}`);
      return response.data;
    },
  });
}

// ============================================
// Friend Action Hooks
// ============================================

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/friends/${userId}`);
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends', 'status', userId] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.patch(`/friends/${requestId}/accept`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.delete(`/friends/requests/${requestId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/friends/${userId}`);
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends', 'status', userId] });
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/friends/${userId}/block`);
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends', 'status', userId] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/friends/${userId}/block`);
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends', 'status', userId] });
    },
  });
}
