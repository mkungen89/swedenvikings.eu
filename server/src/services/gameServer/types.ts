// ============================================
// Game Server Types and Interfaces
// ============================================

export type ServerLocationType = 'local' | 'remote';
export type ServerStatus = 'offline' | 'starting' | 'online' | 'stopping' | 'updating' | 'error';

export interface ServerConnection {
  id: string;
  name: string;
  type: ServerLocationType;
  // Remote connection settings
  host?: string;
  port?: number;
  username?: string;
  privateKey?: string;
  password?: string;
  // Local Docker settings
  dockerContainer?: string;
  // Common settings
  serverPath: string;
  steamCmdPath?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerConfig {
  // Server Identity
  name: string;
  password?: string;
  adminPassword?: string;
  admins?: string[]; // Array of SteamID64

  // Network
  bindAddress?: string;
  bindPort: number;
  publicAddress?: string;
  publicPort?: number;
  
  // A2S Query (Steam server browser)
  a2sQueryEnabled: boolean;
  steamQueryPort: number;
  steamQueryAddress?: string;
  
  // RCON
  rconEnabled?: boolean;
  rconAddress?: string;
  rconPort?: number;
  rconPassword?: string;
  rconPermission?: 'admin' | 'monitor';
  rconMaxClients?: number;
  rconBlacklist?: string[];
  rconWhitelist?: string[];
  
  // Game Settings
  scenarioId: string;
  maxPlayers: number;
  visible: boolean;
  crossPlatform?: boolean;
  supportedPlatforms?: string[];
  
  // Performance
  serverMaxViewDistance: number;
  serverMinGrassDistance: number;
  networkViewDistance: number;
  
  // Game Mode
  disableThirdPerson: boolean;
  fastValidation: boolean;
  battlEye: boolean;
  
  // Lobby/Operating
  lobbyPlayerSynchronise: boolean;
  aiLimit: number;
  playerSaveTime?: number;
  
  // VON (Voice)
  vonDisableUI: boolean;
  vonDisableDirectSpeechUI: boolean;
  
  // Mission header
  missionHeader?: Record<string, any>;
  
  // Mods
  mods: ServerMod[];
}

export interface ServerMod {
  modId: string;
  name: string;
  version?: string;
  enabled: boolean;
  loadOrder: number;
}

export interface ServerStatusInfo {
  status: ServerStatus;
  isOnline: boolean;
  players: number;
  maxPlayers: number;
  map: string;
  mission: string;
  version: string;
  uptime: number; // seconds
  cpu: number; // percentage
  memory: number; // percentage
  memoryUsed: number; // MB
  memoryTotal: number; // MB
  ping: number;
  lastUpdated: Date;
}

export interface OnlinePlayer {
  name: string;
  steamId?: string;
  joinedAt: Date;
  ping: number;
  score?: number;
  team?: string;
}

export interface ServerLogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  category?: string;
}

export interface InstallProgress {
  status: 'idle' | 'downloading' | 'extracting' | 'configuring' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  bytesDownloaded?: number;
  bytesTotal?: number;
  speed?: number; // bytes per second
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
}

export interface ExecutorInterface {
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Command execution
  exec(command: string, options?: ExecOptions): Promise<CommandResult>;
  execStream(command: string, onData: (data: string) => void, onError?: (error: string) => void): Promise<CommandResult>;
  
  // File operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  rm(path: string, recursive?: boolean): Promise<void>;
  
  // Process management
  getProcessInfo(pid: number): Promise<ProcessInfo | null>;
  killProcess(pid: number, signal?: string): Promise<boolean>;
  
  // System info
  getSystemInfo(): Promise<SystemInfo>;
}

export interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  uptime: number;
  command: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  cpuUsage: number;
  memoryTotal: number;
  memoryUsed: number;
  memoryFree: number;
  diskTotal: number;
  diskUsed: number;
  diskFree: number;
  uptime: number;
}

