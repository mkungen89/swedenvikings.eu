// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  steamId: string;
  username: string;
  email?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  isPrivate: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'sv' | 'en';
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date;
  roles: Role[];
  socialLinks: SocialLink[];
}

export interface UserProfile {
  id: string;
  steamId: string;
  username: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  isPrivate: boolean;
  createdAt: Date;
  lastSeenAt?: Date;
  roles: RoleBasic[];
  socialLinks: SocialLink[];
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'sv' | 'en';
  emailNotifications: boolean;
  discordNotifications: boolean;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
}

export type SocialPlatform = 
  | 'discord'
  | 'twitter'
  | 'youtube'
  | 'twitch'
  | 'instagram'
  | 'steam'
  | 'website';

export interface Session {
  id: string;
  userId: string;
  token: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  expiresAt: Date;
  isCurrent?: boolean;
}

export interface Ban {
  id: string;
  steamId: string;
  reason: string;
  bannedBy: UserBasic;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface UserBasic {
  id: string;
  username: string;
  avatar?: string;
}

// Import Role types
import { Role, RoleBasic } from './role';

