// ============================================
// Content Types
// ============================================

import { UserBasic } from './user';

// News
export interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: string;
  category: NewsCategory;
  isPinned: boolean;
  isPublished: boolean;
  author: UserBasic;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export type NewsCategory = 
  | 'update'
  | 'event'
  | 'announcement'
  | 'changelog'
  | 'community';

// Pages
export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  showInNav: boolean;
  navOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Events
export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  image?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  maxParticipants?: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizer: UserBasic;
  participants: EventParticipant[];
}

export interface EventParticipant {
  userId: string;
  user: UserBasic;
  status: ParticipantStatus;
  joinedAt: Date;
}

export type ParticipantStatus = 'going' | 'maybe' | 'not_going';

// Gallery
export interface GalleryItem {
  id: string;
  title?: string;
  description?: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  category?: string;
  uploadedBy: UserBasic;
  createdAt: Date;
}

export type MediaType = 'image' | 'video';

// Rules
export interface Rule {
  id: string;
  title: string;
  content: string;
  category: RuleCategory;
  order: number;
  isActive: boolean;
}

export type RuleCategory = 
  | 'general'
  | 'gameplay'
  | 'communication'
  | 'admin'
  | 'clan';

// Navigation
export interface NavItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  order: number;
  isExternal: boolean;
  isVisible: boolean;
  requiredPermission?: string;
}

// Site Settings
export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  maintenance: boolean;
  maintenanceMessage?: string;
  theme: ThemeSettings;
  social: SocialSettings;
  seo: SeoSettings;
}

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  darkMode: boolean;
}

export interface SocialSettings {
  discord?: string;
  twitter?: string;
  youtube?: string;
  instagram?: string;
}

export interface SeoSettings {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

