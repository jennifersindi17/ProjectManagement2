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
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredRefresh(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  accessToken: getStoredToken(),
  refreshToken: getStoredRefresh(),
  isLoading: true,

  login: async (email, password) => {
    const res: any = await api.auth.login(email, password);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    set({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken, isLoading: false });
  },

  logout: async () => {
    const { accessToken } = get();
    if (accessToken) {
      try { await api.auth.logout(accessToken); } catch {}
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
  },

  loadUser: async () => {
    const token = getStoredToken();
    if (!token) { set({ isLoading: false }); return; }
    try {
      const user = await api.auth.me(token) as any;
      set({ user, accessToken: token, isLoading: false });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    }
  },

  setTokens: (access, refresh) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    set({ accessToken: access, refreshToken: refresh });
  },
}));
