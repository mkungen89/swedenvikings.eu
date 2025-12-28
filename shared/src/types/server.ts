// ============================================
// Server Types
// ============================================

export interface ServerStatus {
  isOnline: boolean;
  players: number;
  maxPlayers: number;
  map: string;
  mission: string;
  uptime: number; // seconds
  cpu: number; // percentage
  memory: number; // MB
  lastUpdated: Date;
}

export interface ServerConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: Date;
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
  installedAt: Date;
  updatedAt: Date;
}

export interface ModSearchResult {
  workshopId: string;
  name: string;
  description: string;
  author: string;
  imageUrl?: string;
  subscriberCount: number;
  size: number;
  lastUpdated: Date;
}

export interface Player {
  id: string;
  steamId: string;
  name: string;
  joinedAt: Date;
  ping?: number;
  score?: number;
}

export interface ServerLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, unknown>;
}

export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

export type LogCategory = 
  | 'server'
  | 'player'
  | 'chat'
  | 'admin'
  | 'mod'
  | 'network'
  | 'system';

export interface ScheduledTask {
  id: string;
  name: string;
  action: ServerAction;
  cron: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export type ServerAction = 
  | 'restart'
  | 'backup'
  | 'update'
  | 'message';

export interface ServerMessage {
  message: string;
  duration?: number;
}

