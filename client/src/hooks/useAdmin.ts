import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalBans: number;
  activeBans: number;
  openTickets: number;
  pendingApplications: number;
}

interface ActivityLog {
  id: string;
  action: string;
  category: string;
  details?: Record<string, unknown>;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
  ip?: string;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityLog[];
}

interface AdminUser {
  id: string;
  steamId: string;
  username: string;
  email?: string;
  avatar?: string;
  createdAt: string;
  lastSeenAt?: string;
  roles: { id: string; name: string; color: string }[];
  isBanned: boolean;
}

interface Role {
  id: string;
  name: string;
  color: string;
  icon?: string;
  priority: number;
  isDefault: boolean;
  userCount: number;
  permissions: string[];
}

interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
}

interface SiteSettings {
  id: string;
  siteName: string;
  siteDescription?: string;
  logo?: string;
  favicon?: string;
  maintenance: boolean;
  maintenanceMessage?: string;
  primaryColor: string;
  accentColor: string;
  discordInvite?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

// Dashboard
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard');
      return response.data.data as DashboardData;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

// Users
export function useAdminUsers(page = 1, limit = 20, search?: string, roleId?: string) {
  return useQuery({
    queryKey: ['admin', 'users', page, limit, search, roleId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (roleId) params.append('role', roleId);
      
      const response = await api.get(`/admin/users?${params}`);
      return response.data;
    },
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: async () => {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data.data as AdminUser;
    },
    enabled: !!userId,
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, ...data }: { userId: string; username?: string; email?: string; roles?: string[] }) => {
      const response = await api.patch(`/admin/users/${userId}`, data);
      return response.data.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'detail', userId] });
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, reason, expiresAt }: { userId: string; reason: string; expiresAt?: string }) => {
      const response = await api.post(`/admin/users/${userId}/ban`, { reason, expiresAt });
      return response.data.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/unban`);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

// Roles
export function useAdminRoles() {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const response = await api.get('/admin/roles');
      return response.data.data as Role[];
    },
  });
}

export function useAdminPermissions() {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: async () => {
      const response = await api.get('/admin/permissions');
      return response.data.data as Record<string, Permission[]>;
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; color: string; icon?: string; priority?: number; permissions?: string[] }) => {
      const response = await api.post('/admin/roles', data);
      return response.data.data as Role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
}

// Settings
export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const response = await api.get('/admin/settings');
      return response.data.data as SiteSettings;
    },
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<SiteSettings>) => {
      const response = await api.patch('/admin/settings', data);
      return response.data.data as SiteSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
}

// Activity Logs
export function useAdminLogs(page = 1, limit = 50, category?: string, userId?: string) {
  return useQuery({
    queryKey: ['admin', 'logs', page, limit, category, userId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (category) params.append('category', category);
      if (userId) params.append('userId', userId);
      
      const response = await api.get(`/admin/logs?${params}`);
      return response.data;
    },
  });
}

