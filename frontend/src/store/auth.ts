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

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,

  login: async (email, password) => {
    const res: any = await api.auth.login(email, password);
    set({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken, isLoading: false });
  },

  logout: async () => {
    const { accessToken } = get();
    if (accessToken) {
      try { await api.auth.logout(accessToken); } catch {}
    }
    set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
  },

  loadUser: async () => {
    const { accessToken } = get();
    if (!accessToken) { set({ isLoading: false }); return; }
    try {
      const user = await api.auth.me(accessToken);
      set({ user, isLoading: false });
    } catch {
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    }
  },

  setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
}));
