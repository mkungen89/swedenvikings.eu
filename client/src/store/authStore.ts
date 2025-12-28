import { create } from 'zustand';
import api from '@/services/api';

interface User {
  id: string;
  steamId: string;
  username: string;
  email?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  theme: string;
  language: string;
  roles: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  }[];
  permissions: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/auth/me');
      set({
        user: response.data.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: () => {
    window.location.href = '/api/auth/steam';
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({
        user: null,
        isAuthenticated: false,
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } });
    }
  },

  hasPermission: (permission) => {
    const user = get().user;
    if (!user) return false;
    return user.permissions.includes(permission) || user.permissions.includes('admin.access');
  },
}));

