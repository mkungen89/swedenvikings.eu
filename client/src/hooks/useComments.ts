import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface CommentsResponse {
  success: boolean;
  data: Comment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// News Comments
// ============================================

export function useNewsComments(slug: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['comments', 'news', slug, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<CommentsResponse>(`/comments/news/${slug}?${params}`);
      return response.data;
    },
    enabled: !!slug,
  });
}

export function useCreateNewsComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, content, parentId }: { slug: string; content: string; parentId?: string }) => {
      const response = await api.post(`/comments/news/${slug}`, { content, parentId });
      return response.data.data as Comment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'news', variables.slug] });
    },
  });
}

// ============================================
// Event Comments
// ============================================

export function useEventComments(slug: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['comments', 'event', slug, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<CommentsResponse>(`/comments/events/${slug}?${params}`);
      return response.data;
    },
    enabled: !!slug,
  });
}

export function useCreateEventComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, content, parentId }: { slug: string; content: string; parentId?: string }) => {
      const response = await api.post(`/comments/events/${slug}`, { content, parentId });
      return response.data.data as Comment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'event', variables.slug] });
    },
  });
}

// ============================================
// Comment Management
// ============================================

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await api.patch(`/comments/${id}`, { content });
      return response.data.data as Comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/comments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
