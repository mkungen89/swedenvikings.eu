import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isLocked: boolean;
  threadCount: number;
  latestThread?: ForumThread;
  createdAt: string;
}

export interface ForumThread {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  postCount?: number;
  categoryId: string;
  category?: ForumCategory;
  author: User;
  lastPostAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPost {
  id: string;
  content: string;
  threadId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesResponse {
  success: boolean;
  data: ForumCategory[];
}

interface CategoryResponse {
  success: boolean;
  data: {
    category: ForumCategory;
    threads: ForumThread[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface ThreadResponse {
  success: boolean;
  data: {
    thread: ForumThread;
    posts: ForumPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ============================================
// Category Hooks
// ============================================

export function useForumCategories() {
  return useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: async () => {
      const response = await api.get<CategoriesResponse>('/forum/categories');
      return response.data.data;
    },
  });
}

export function useForumCategory(slug: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['forum', 'category', slug, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<CategoryResponse>(`/forum/categories/${slug}?${params}`);
      return response.data.data;
    },
    enabled: !!slug,
  });
}

// ============================================
// Thread Hooks
// ============================================

export function useForumThread(id: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['forum', 'thread', id, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<ThreadResponse>(`/forum/threads/${id}?${params}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { categoryId: string; title: string; content: string }) => {
      const response = await api.post('/forum/threads', data);
      return response.data.data as ForumThread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'category'] });
    },
  });
}

export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; content?: string } }) => {
      const response = await api.patch(`/forum/threads/${id}`, data);
      return response.data.data as ForumThread;
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'thread', thread.id] });
    },
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/forum/threads/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] });
    },
  });
}

export function usePinThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/forum/threads/${id}/pin`);
      return response.data.data as ForumThread;
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'thread', thread.id] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'category'] });
    },
  });
}

export function useLockThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/forum/threads/${id}/lock`);
      return response.data.data as ForumThread;
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'thread', thread.id] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'category'] });
    },
  });
}

// ============================================
// Post Hooks
// ============================================

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      const response = await api.post(`/forum/threads/${threadId}/posts`, { content });
      return response.data.data as ForumPost;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'thread', post.threadId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'category'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await api.patch(`/forum/posts/${id}`, { content });
      return response.data.data as ForumPost;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'thread', post.threadId] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/forum/posts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] });
    },
  });
}

// ============================================
// Admin Hooks
// ============================================

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; icon?: string; sortOrder?: number }) => {
      const response = await api.post('/forum/categories', data);
      return response.data.data as ForumCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ForumCategory> }) => {
      const response = await api.patch(`/forum/categories/${id}`, data);
      return response.data.data as ForumCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/forum/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
    },
  });
}
