import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
export interface ServerStatus {
  status: 'offline' | 'starting' | 'online' | 'stopping' | 'updating' | 'error';
  isOnline: boolean;
  isInstalled?: boolean;
  serverName?: string;
  players: number;
  maxPlayers: number;
  map: string;
  mission: string;
  version?: string;
  uptime: number;
  cpu: number;
  memory: number;
  memoryUsed?: number;
  memoryTotal?: number;
  ping: number;
  lastUpdated: string;
  rconEnabled?: boolean;
}

export interface ServerConnection {
  id: string;
  name: string;
  type: 'local' | 'remote';
  host?: string;
  port?: number;
  username?: string;
  serverPath: string;
  steamCmdPath?: string;
  platform: 'linux' | 'windows';
  isDefault: boolean;
  status: string;
  lastConnected?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServerConfig {
  name: string;
  password?: string;
  adminPassword?: string;
  admins?: string[]; // Array of SteamID64
  maxPlayers: number;
  visible: boolean;
  crossPlatform?: boolean;
  supportedPlatforms?: string[];
  scenarioId: string;
  bindAddress?: string;
  bindPort: number;
  publicAddress?: string;
  publicPort?: number;
  a2sQueryEnabled: boolean;
  steamQueryPort: number;
  steamQueryAddress?: string;
  rconEnabled?: boolean;
  rconAddress?: string;
  rconPort?: number;
  rconPassword?: string;
  rconPermission?: 'admin' | 'monitor';
  rconMaxClients?: number;
  rconBlacklist?: string[];
  rconWhitelist?: string[];
  battlEye: boolean;
  disableThirdPerson: boolean;
  fastValidation: boolean;
  serverMaxViewDistance: number;
  serverMinGrassDistance: number;
  networkViewDistance: number;
  lobbyPlayerSynchronise: boolean;
  aiLimit: number;
  playerSaveTime?: number;
  vonDisableUI: boolean;
  vonDisableDirectSpeechUI: boolean;
  missionHeader?: Record<string, any>;
}

export interface ServerMod {
  modId: string;
  name: string;
  version?: string;
  enabled: boolean;
  loadOrder: number;
}

export interface SteamProfile {
  steamId: string;
  personaName: string;
  profileUrl: string;
  avatar: string;
  avatarMedium: string;
  avatarFull: string;
}

export interface Mod {
  id: string;
  workshopId: string;
  name: string;
  description?: string;
  author?: string;
  imageUrl?: string;
  enabled: boolean;
  loadOrder: number;
  size?: number;
  version?: string;
  gameVersion?: string;
  dependencies?: string[];
  rating?: number;
  subscribers?: number;
  lastSyncedAt?: string;
  installedAt: string;
  updatedAt: string;
}

export interface WorkshopMod {
  modId: string;
  name: string;
  description: string;
  author: string;
  version: string;
  gameVersion: string;
  size: number;
  imageUrl: string;
  dependencies: string[];
  rating: number;
  subscribers: number;
  isInstalled?: boolean;
}

export interface WorkshopSearchResult {
  mods: WorkshopMod[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ServerLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  category?: string;
}

export interface Player {
  name: string;
  steamId?: string;
  joinedAt: string;
  ping: number;
  score?: number;
  team?: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  action: string;
  cron: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface InstallProgress {
  status: 'idle' | 'downloading' | 'extracting' | 'configuring' | 'complete' | 'error';
  progress: number;
  message: string;
  bytesDownloaded?: number;
  bytesTotal?: number;
  speed?: number;
}

// ============================================
// Server Connections
// ============================================

export function useServerConnections() {
  return useQuery({
    queryKey: ['server', 'connections'],
    queryFn: async () => {
      const response = await api.get('/server/connections');
      return response.data.data as ServerConnection[];
    },
  });
}

export function useAddServerConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ServerConnection>) => {
      const response = await api.post('/server/connections', data);
      return response.data.data as ServerConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'connections'] });
    },
  });
}

export function useTestServerConnection() {
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await api.post(`/server/connections/${connectionId}/test`);
      return response.data.data as { success: boolean; message: string; systemInfo?: any };
    },
  });
}

export function useDeleteServerConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId: string) => {
      await api.delete(`/server/connections/${connectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'connections'] });
    },
  });
}

// ============================================
// Server Status
// ============================================

export function useServerStatus(connectionId?: string) {
  return useQuery({
    queryKey: ['server', 'status', connectionId],
    queryFn: async () => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.get(`/server/status${params}`);
      return response.data.data as ServerStatus;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

// ============================================
// Server Controls
// ============================================

export function useInstallServer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId?: string) => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.post(`/server/install${params}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'status'] });
    },
  });
}

export function useStartServer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId?: string) => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.post(`/server/start${params}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'status'] });
    },
  });
}

export function useStopServer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId?: string) => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.post(`/server/stop${params}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'status'] });
    },
  });
}

export function useRestartServer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId?: string) => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.post(`/server/restart${params}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'status'] });
    },
  });
}

// ============================================
// Server Config
// ============================================

export function useServerConfig(connectionId?: string) {
  return useQuery({
    queryKey: ['server', 'config', connectionId],
    queryFn: async () => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.get(`/server/config${params}`);
      return response.data.data as ServerConfig;
    },
  });
}

export function useUpdateServerConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ config, connectionId }: { config: Partial<ServerConfig>; connectionId?: string }) => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.patch(`/server/config${params}`, config);
      return response.data.data as ServerConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'config'] });
    },
  });
}

// ============================================
// Mods
// ============================================

export function useServerMods() {
  return useQuery({
    queryKey: ['server', 'mods'],
    queryFn: async () => {
      const response = await api.get('/server/mods');
      return response.data.data as Mod[];
    },
  });
}

export function useAddMod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workshopId: string) => {
      const response = await api.post('/server/mods', { workshopId });
      return response.data; // Return full response including dependenciesInstalled
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'mods'] });
    },
  });
}

export function useUpdateMod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ modId, ...data }: { modId: string; enabled?: boolean; loadOrder?: number }) => {
      const response = await api.patch(`/server/mods/${modId}`, data);
      return response.data.data as Mod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'mods'] });
    },
  });
}

export function useDeleteMod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (modId: string) => {
      await api.delete(`/server/mods/${modId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'mods'] });
    },
  });
}

export function useReorderMods() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: string[]) => {
      const response = await api.post('/server/mods/reorder', { order });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'mods'] });
    },
  });
}

export function useSyncMod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modId: string) => {
      const response = await api.post(`/server/mods/${modId}/sync`);
      return response.data.data as Mod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'mods'] });
    },
  });
}

export function useSyncAllMods() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/server/mods/sync-all');
      return response.data.data as { synced: number; failed: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'mods'] });
    },
  });
}

// Preview mod and dependencies before installing
export interface ModDependency {
  workshopId: string;
  name: string;
  version: string;
  alreadyInstalled: boolean;
}

export interface ModPreview {
  alreadyInstalled: boolean;
  mod: {
    workshopId: string;
    name: string;
    version: string;
    description: string;
    author: string;
    size: number;
    imageUrl: string;
  };
  dependencies: ModDependency[];
  needsInstall: number;
}

export function usePreviewMod(workshopId: string) {
  return useQuery({
    queryKey: ['server', 'mods', 'preview', workshopId],
    queryFn: async () => {
      const response = await api.get(`/server/mods/preview/${workshopId}`);
      return response.data.data as ModPreview;
    },
    enabled: !!workshopId && workshopId.length > 0,
  });
}

// ============================================
// Workshop Search
// ============================================

export function useWorkshopSearch(query: string, page = 1) {
  return useQuery({
    queryKey: ['workshop', 'search', query, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (page > 1) params.set('page', page.toString());

      const response = await api.get(`/server/workshop/search?${params}`);
      return response.data.data as WorkshopSearchResult;
    },
    enabled: query.length >= 2, // Only search with at least 2 characters
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useWorkshopMod(modId: string) {
  return useQuery({
    queryKey: ['workshop', 'mod', modId],
    queryFn: async () => {
      const response = await api.get(`/server/workshop/${modId}`);
      return response.data.data as WorkshopMod & { isInstalled: boolean; installedId?: string };
    },
    enabled: !!modId,
  });
}

export function useServerVersion(connectionId?: string) {
  return useQuery({
    queryKey: ['server', 'version', connectionId],
    queryFn: async () => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.get(`/server/version${params}`);
      return response.data.data as { version: string; isOnline: boolean };
    },
  });
}

// ============================================
// Server Logs
// ============================================

export function useServerLogs(lines = 100, connectionId?: string) {
  return useQuery({
    queryKey: ['server', 'logs', lines, connectionId],
    queryFn: async () => {
      const params = new URLSearchParams({ lines: lines.toString() });
      if (connectionId) params.append('connectionId', connectionId);
      
      const response = await api.get(`/server/logs?${params}`);
      return response.data.data as ServerLog[];
    },
    refetchInterval: 3000, // Refresh every 3 seconds for real-time feel
  });
}

// Log directories
export function useLogDirs(connectionId?: string) {
  return useQuery({
    queryKey: ['server', 'logs', 'dirs', connectionId],
    queryFn: async () => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.get(`/server/logs/dirs${params}`);
      return response.data.data as string[];
    },
  });
}

// Log files in a directory
export function useLogFiles(dir: string, connectionId?: string) {
  return useQuery({
    queryKey: ['server', 'logs', 'files', dir, connectionId],
    queryFn: async () => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.get(`/server/logs/files/${encodeURIComponent(dir)}${params}`);
      return response.data.data as string[];
    },
    enabled: !!dir,
  });
}

// Read log file content
export function useLogFileContent(dir: string, file: string, lines = 500, connectionId?: string) {
  return useQuery({
    queryKey: ['server', 'logs', 'file', dir, file, lines, connectionId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (connectionId) params.append('connectionId', connectionId);
      params.append('lines', lines.toString());
      
      const response = await api.get(`/server/logs/file/${encodeURIComponent(dir)}/${encodeURIComponent(file)}?${params}`);
      return response.data.data as { content: string; dir: string; file: string };
    },
    enabled: !!dir && !!file,
  });
}

export function useSendCommand() {
  return useMutation({
    mutationFn: async ({ command, connectionId }: { command: string; connectionId?: string }) => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.post(`/server/command${params}`, { command });
      return response.data.data as { result: string };
    },
  });
}

// ============================================
// Steam Profile Lookup
// ============================================

export function useSteamProfile(steamId: string | null) {
  return useQuery({
    queryKey: ['steam', 'profile', steamId],
    queryFn: async () => {
      if (!steamId) return null;
      const response = await api.get(`/server/steam-profile/${steamId}`);
      return response.data.data as SteamProfile;
    },
    enabled: !!steamId && steamId.length === 17, // SteamID64 is 17 digits
    retry: false,
  });
}

// ============================================
// Players
// ============================================

export function useOnlinePlayers(connectionId?: string) {
  return useQuery({
    queryKey: ['server', 'players', connectionId],
    queryFn: async () => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.get(`/server/players${params}`);
      return response.data.data as Player[];
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

export function useKickPlayer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ steamId, reason, connectionId }: { steamId: string; reason?: string; connectionId?: string }) => {
      const params = connectionId ? `?connectionId=${connectionId}` : '';
      const response = await api.post(`/server/players/${steamId}/kick${params}`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'players'] });
    },
  });
}

// ============================================
// Scheduled Tasks
// ============================================

export function useScheduledTasks() {
  return useQuery({
    queryKey: ['server', 'tasks'],
    queryFn: async () => {
      const response = await api.get('/server/tasks');
      return response.data.data as ScheduledTask[];
    },
  });
}

// ============================================
// Utility - Format uptime
// ============================================

export function formatUptime(seconds: number): string {
  if (seconds <= 0) return '0s';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  
  return parts.join(' ');
}
