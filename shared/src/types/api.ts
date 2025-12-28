// ============================================
// API Types
// ============================================

// Standard API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth
export interface LoginResponse {
  user: import('./user').User;
  token?: string;
}

export interface SteamAuthUrl {
  url: string;
}

// Tickets
export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: import('./user').UserBasic;
  assignedTo?: import('./user').UserBasic;
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface TicketMessage {
  id: string;
  content: string;
  isStaff: boolean;
  author: import('./user').UserBasic;
  attachments: string[];
  createdAt: Date;
}

export type TicketCategory = 'bug' | 'question' | 'report' | 'appeal' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

// Applications
export interface Application {
  id: string;
  type: ApplicationType;
  applicant: import('./user').UserBasic;
  status: ApplicationStatus;
  answers: ApplicationAnswer[];
  reviewedBy?: import('./user').UserBasic;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
}

export interface ApplicationAnswer {
  questionId: string;
  question: string;
  answer: string;
}

export type ApplicationType = 'admin' | 'moderator' | 'whitelist' | 'clan';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

// Clans
export interface Clan {
  id: string;
  name: string;
  tag: string;
  description?: string;
  logo?: string;
  banner?: string;
  color: string;
  isRecruiting: boolean;
  createdAt: Date;
  leader: import('./user').UserBasic;
  members: ClanMember[];
  memberCount: number;
}

export interface ClanMember {
  user: import('./user').UserBasic;
  role: ClanRole;
  joinedAt: Date;
}

export type ClanRole = 'leader' | 'officer' | 'member';

// Notifications
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType = 
  | 'system'
  | 'ticket'
  | 'application'
  | 'event'
  | 'clan'
  | 'mention'
  | 'server';

// Activity Log
export interface ActivityLog {
  id: string;
  action: string;
  category: ActivityCategory;
  details?: Record<string, unknown>;
  user?: import('./user').UserBasic;
  ip?: string;
  createdAt: Date;
}

export type ActivityCategory = 
  | 'auth'
  | 'user'
  | 'admin'
  | 'server'
  | 'content'
  | 'moderation';

// WebSocket Events
export interface WsServerStatus {
  type: 'server_status';
  data: import('./server').ServerStatus;
}

export interface WsServerLog {
  type: 'server_log';
  data: import('./server').ServerLog;
}

export interface WsPlayerUpdate {
  type: 'player_update';
  data: {
    action: 'join' | 'leave';
    player: import('./server').Player;
    totalPlayers: number;
  };
}

export interface WsNotification {
  type: 'notification';
  data: Notification;
}

export type WsMessage = 
  | WsServerStatus 
  | WsServerLog 
  | WsPlayerUpdate 
  | WsNotification;

