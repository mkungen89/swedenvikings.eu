import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
interface Role {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface UserProfile {
  id: string;
  steamId: string;
  username: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  isPrivate: boolean;
  createdAt: string;
  lastSeenAt?: string;
  roles: Role[];
  socialLinks: SocialLink[];
}

interface UpdateProfileData {
  username?: string;
  bio?: string;
  isPrivate?: boolean;
}

interface UpdateSettingsData {
  theme?: 'light' | 'dark' | 'system';
  language?: 'sv' | 'en';
  emailNotifications?: boolean;
  discordNotifications?: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Hooks
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['users', 'profile', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}`);
      return response.data.data as UserProfile;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await api.patch('/users/me', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateSettingsData) => {
      const response = await api.patch('/users/me/settings', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useAddSocialLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ platform, url }: { platform: string; url: string }) => {
      const response = await api.post('/users/me/social', { platform, url });
      return response.data.data as SocialLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
}

export function useDeleteSocialLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (linkId: string) => {
      await api.delete(`/users/me/social/${linkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
}

export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get(`/users/me/notifications?${params}`);
      return response.data;
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/users/me/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await api.patch('/users/me/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// File upload hooks
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data as { url: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
}

export function useUploadBanner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data as { url: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
}

