'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
}

const TOKEN_KEY = 'pf_access_token';
const REFRESH_KEY = 'pf_refresh_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Try localStorage first, then cookie
  try {
    const ls = localStorage.getItem(TOKEN_KEY);
    if (ls) return ls;
  } catch {}
  // Fallback to cookie
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${TOKEN_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getStoredRefresh(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const ls = localStorage.getItem(REFRESH_KEY);
    if (ls) return ls;
  } catch {}
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${REFRESH_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function storeToken(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
  // Also set cookie as fallback (30 days)
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
}

function removeToken(key: string) {
  try { localStorage.removeItem(key); } catch {}
  document.cookie = `${key}=; path=/; max-age=0`;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  accessToken: getStoredToken(),
  refreshToken: getStoredRefresh(),
  isLoading: true,

  login: async (email, password) => {
    const res: any = await api.auth.login(email, password);
    storeToken(TOKEN_KEY, res.accessToken);
    storeToken(REFRESH_KEY, res.refreshToken);
    set({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken, isLoading: false });
  },

  logout: async () => {
    const { accessToken } = get();
    if (accessToken) {
      try { await api.auth.logout(accessToken); } catch {}
    }
    removeToken(TOKEN_KEY);
    removeToken(REFRESH_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
  },

  loadUser: async () => {
    const token = getStoredToken();
    if (!token) { set({ isLoading: false }); return; }
    try {
      const user = await api.auth.me(token) as any;
      set({ user, accessToken: token, isLoading: false });
    } catch {
      removeToken(TOKEN_KEY);
      removeToken(REFRESH_KEY);
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    }
  },

  setTokens: (access, refresh) => {
    storeToken(TOKEN_KEY, access);
    storeToken(REFRESH_KEY, refresh);
    set({ accessToken: access, refreshToken: refresh });
  },
}));
