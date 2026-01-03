import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface DirectMessage {
  id: string;
  content: string;
  sender: User;
  conversationId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: DirectMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationDetail {
  conversation: {
    id: string;
    participants: User[];
  };
  messages: DirectMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Conversation Hooks
// ============================================

export function useConversations(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['messages', 'conversations', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<ConversationsResponse>(`/messages/conversations?${params}`);
      return response.data;
    },
  });
}

export function useConversation(id: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['messages', 'conversation', id, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<{ success: boolean; data: ConversationDetail }>(`/messages/conversations/${id}?${params}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post<{ success: boolean; data: { id: string; participants: User[]; isNew: boolean } }>('/messages/conversations', { userId });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
  });
}

// ============================================
// Message Hooks
// ============================================

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const response = await api.post(`/messages/conversations/${conversationId}`, { content });
      return response.data.data as DirectMessage;
    },
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', message.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await api.patch(`/messages/conversations/${conversationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    },
  });
}

// ============================================
// Unread Count
// ============================================

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { count: number } }>('/messages/unread-count');
      return response.data.data.count;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
