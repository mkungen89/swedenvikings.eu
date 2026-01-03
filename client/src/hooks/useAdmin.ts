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

  // SEO Settings
  seoKeywords?: string;
  seoCanonicalUrl?: string;
  seoRobotsIndex?: boolean;
  seoRobotsFollow?: boolean;
  seoGoogleSiteVerification?: string;
  seoBingSiteVerification?: string;
  seoGoogleAnalyticsId?: string;
  seoFacebookAppId?: string;
  seoTwitterCard?: string;
  seoTwitterSite?: string;
  seoTwitterCreator?: string;
  seoOgType?: string;
  seoOgLocale?: string;

  // Security Settings
  requireEmailVerification?: boolean;
  enableTwoFactor?: boolean;
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  loginLockoutDuration?: number;
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireNumbers?: boolean;
  passwordRequireSpecialChars?: boolean;
  enableRateLimiting?: boolean;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
  enableCORS?: boolean;
  allowedOrigins?: string;
  enableCSRF?: boolean;
  ipWhitelist?: string;
  ipBlacklist?: string;

  // Notification Settings
  enableEmailNotifications?: boolean;
  enableDiscordNotifications?: boolean;
  enablePushNotifications?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  emailFromAddress?: string;
  emailFromName?: string;
  discordWebhookUrl?: string;
  discordBotToken?: string;
  notifyOnNewUser?: boolean;
  notifyOnNewTicket?: boolean;
  notifyOnNewNews?: boolean;
  notifyOnNewEvent?: boolean;
  notifyOnServerDown?: boolean;
  adminEmailAddresses?: string;

  // Database Settings
  enableAutoBackup?: boolean;
  backupFrequency?: string;
  backupRetentionDays?: number;
  backupLocation?: string;
  enableDatabaseOptimization?: boolean;
  optimizationSchedule?: string;
  maxDatabaseSize?: number;
  enableQueryLogging?: boolean;
  slowQueryThreshold?: number;
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

// ============================================
// Settings - Manual Actions
// ============================================

// Test Email
export function useTestEmail() {
  return useMutation({
    mutationFn: async (email?: string) => {
      const response = await api.post('/admin/settings/test-email', { email });
      return response.data;
    },
  });
}

// Test Discord
export function useTestDiscord() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/settings/test-discord');
      return response.data;
    },
  });
}

// Create Backup
export function useCreateBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/settings/backup');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
    },
  });
}

// List Backups
export function useBackups() {
  return useQuery({
    queryKey: ['admin', 'backups'],
    queryFn: async () => {
      const response = await api.get('/admin/settings/backups');
      return response.data.data;
    },
  });
}

// Restore Backup
export function useRestoreBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filename: string) => {
      const response = await api.post('/admin/settings/restore', { filename });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
    },
  });
}

// Optimize Database
export function useOptimizeDatabase() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/settings/optimize');
      return response.data;
    },
  });
}

// Clean Old Data
export function useCleanOldData() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/settings/clean');
      return response.data;
    },
  });
}

// Get Database Stats
export function useDatabaseStats() {
  return useQuery({
    queryKey: ['admin', 'database-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/settings/database-stats');
      return response.data.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

