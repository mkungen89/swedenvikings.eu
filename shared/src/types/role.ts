// ============================================
// Role and Permission Types
// ============================================

export interface Role {
  id: string;
  name: string;
  color: string;
  icon?: string;
  priority: number;
  permissions: Permission[];
  createdAt: Date;
}

export interface RoleBasic {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: PermissionCategory;
}

export type PermissionCategory =
  | 'admin'
  | 'users'
  | 'roles'
  | 'content'
  | 'server'
  | 'moderation'
  | 'tickets'
  | 'clans';

// Permission keys for type safety
export const PERMISSIONS = {
  // Admin
  ADMIN_ACCESS: 'admin.access',
  ADMIN_DASHBOARD: 'admin.dashboard',
  ADMIN_SETTINGS: 'admin.settings',
  
  // Users
  USERS_VIEW: 'users.view',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_BAN: 'users.ban',
  
  // Roles
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN: 'roles.assign',
  
  // Content
  CONTENT_NEWS_VIEW: 'content.news.view',
  CONTENT_NEWS_CREATE: 'content.news.create',
  CONTENT_NEWS_EDIT: 'content.news.edit',
  CONTENT_NEWS_DELETE: 'content.news.delete',
  CONTENT_PAGES_VIEW: 'content.pages.view',
  CONTENT_PAGES_CREATE: 'content.pages.create',
  CONTENT_PAGES_EDIT: 'content.pages.edit',
  CONTENT_PAGES_DELETE: 'content.pages.delete',
  CONTENT_EVENTS_VIEW: 'content.events.view',
  CONTENT_EVENTS_CREATE: 'content.events.create',
  CONTENT_EVENTS_EDIT: 'content.events.edit',
  CONTENT_EVENTS_DELETE: 'content.events.delete',
  CONTENT_GALLERY_VIEW: 'content.gallery.view',
  CONTENT_GALLERY_CREATE: 'content.gallery.create',
  CONTENT_GALLERY_DELETE: 'content.gallery.delete',
  
  // Server
  SERVER_VIEW: 'server.view',
  SERVER_START: 'server.start',
  SERVER_STOP: 'server.stop',
  SERVER_RESTART: 'server.restart',
  SERVER_CONFIG: 'server.config',
  SERVER_MODS: 'server.mods',
  SERVER_LOGS: 'server.logs',
  SERVER_PLAYERS: 'server.players',
  
  // Moderation
  MOD_KICK: 'moderation.kick',
  MOD_BAN: 'moderation.ban',
  MOD_MUTE: 'moderation.mute',
  MOD_WHITELIST: 'moderation.whitelist',
  
  // Tickets
  TICKETS_VIEW: 'tickets.view',
  TICKETS_RESPOND: 'tickets.respond',
  TICKETS_ASSIGN: 'tickets.assign',
  TICKETS_CLOSE: 'tickets.close',
  
  // Clans
  CLANS_MANAGE: 'clans.manage',
  CLANS_DELETE: 'clans.delete',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

