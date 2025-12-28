import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
interface Author {
  id: string;
  username: string;
  avatar?: string;
}

interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: string;
  category: string;
  isPinned: boolean;
  isPublished: boolean;
  author: Author;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface NewsListResponse {
  success: boolean;
  data: News[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateNewsData {
  title: string;
  excerpt: string;
  content: string;
  category?: string;
  image?: string;
  isPinned?: boolean;
  isPublished?: boolean;
}

interface UpdateNewsData extends Partial<CreateNewsData> {
  id: string;
}

// Hooks
export function useNewsList(page = 1, limit = 10, category?: string) {
  return useQuery({
    queryKey: ['news', 'list', page, limit, category],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (category) params.append('category', category);
      
      const response = await api.get<NewsListResponse>(`/news?${params}`);
      return response.data;
    },
  });
}

export function useNewsArticle(slug: string) {
  return useQuery({
    queryKey: ['news', 'article', slug],
    queryFn: async () => {
      const response = await api.get(`/news/${slug}`);
      return response.data.data as News;
    },
    enabled: !!slug,
  });
}

// Admin hooks
export function useAdminNewsList(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'news', 'list', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<NewsListResponse>(`/news/admin/all?${params}`);
      return response.data;
    },
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateNewsData) => {
      const response = await api.post('/news', data);
      return response.data.data as News;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateNewsData) => {
      const response = await api.patch(`/news/${id}`, data);
      return response.data.data as News;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      queryClient.setQueryData(['news', 'article', data.slug], data);
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
    },
  });
}

