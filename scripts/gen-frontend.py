#!/usr/bin/env python3
"""Generate Next.js frontend files for ProjectFlow 2.0"""

import os
BASE = "/Users/jenjen/projectflow2/frontend"

def write(rel_path, content):
    full = os.path.join(BASE, rel_path)
    os.path.exists(os.path.dirname(full)) or os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w') as f:
        f.write(content)
    print(f"  ✓ {rel_path}")

# ============================================
# CONFIG FILES
# ============================================
write("next.config.js", """/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
    ],
  },
};
module.exports = nextConfig;
""")

write("tsconfig.json", """{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
""")

write("tailwind.config.ts", """import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
    },
  },
};
export default config;
""")

write("postcss.config.js", """module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
""")

# ============================================
# STYLES
# ============================================
write("src/app/globals.css", """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 27.4% 14.9%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 27.4% 14.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 27.4% 14.9%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}

* { @apply border-border; }
body { @apply bg-background text-foreground; }

.sidebar-link {
  @apply flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors;
}
.sidebar-link.active {
  @apply bg-primary/10 text-primary;
}

.card {
  @apply bg-card text-card-foreground border border-border rounded-lg shadow-sm;
}

.btn {
  @apply inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50;
}
.btn-primary {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}
.btn-secondary {
  @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
}
.btn-destructive {
  @apply bg-destructive text-destructive-foreground hover:bg-destructive/90;
}
.btn-outline {
  @apply border border-border bg-background hover:bg-accent hover:text-accent-foreground;
}
.btn-ghost {
  @apply hover:bg-accent hover:text-accent-foreground;
}
.btn-sm { @apply h-8 px-3 text-xs; }
.btn-lg { @apply h-10 px-8; }

.input {
  @apply flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
}

.select {
  @apply flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
}

.table-container { @apply w-full overflow-auto; }
.table { @apply w-full caption-bottom text-sm; }
.table-header { @apply [&_tr]:border-b; }
.table-row { @apply border-b transition-colors hover:bg-muted/50; }
.table-head { @apply h-12 px-4 text-left align-middle font-medium text-muted-foreground; }
.table-cell { @apply p-4 align-middle; }

.badge {
  @apply inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors;
}
.badge-green { @apply bg-green-100 text-green-800 border-green-200; }
.badge-yellow { @apply bg-yellow-100 text-yellow-800 border-yellow-200; }
.badge-red { @apply bg-red-100 text-red-800 border-red-200; }
.badge-blue { @apply bg-blue-100 text-blue-800 border-blue-200; }
.badge-gray { @apply bg-gray-100 text-gray-800 border-gray-200; }

.dark .badge-green { @apply bg-green-900/30 text-green-400 border-green-800; }
.dark .badge-yellow { @apply bg-yellow-900/30 text-yellow-400 border-yellow-800; }
.dark .badge-red { @apply bg-red-900/30 text-red-400 border-red-800; }
.dark .badge-blue { @apply bg-blue-900/30 text-blue-400 border-blue-800; }
.dark .badge-gray { @apply bg-gray-800 text-gray-400 border-gray-700; }
""")

# ============================================
# LAYOUT
# ============================================
write("src/app/layout.tsx", """import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProjectFlow — Enterprise Project Management',
  description: 'Modern project management system for enterprise teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
""")

# ============================================
# LIB: API Client
# ============================================
write("src/lib/api.ts", """const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions {
  method?: string;
  body?: any;
  token?: string;
  params?: Record<string, string>;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, token, params } = options;
  
  const url = new URL(`${API_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) => apiFetch('/auth/login', { method: 'POST', body: { email, password } }),
    register: (data: any, token: string) => apiFetch('/auth/register', { method: 'POST', body: data, token }),
    refresh: (refreshToken: string) => apiFetch('/auth/refresh', { method: 'POST', body: { refreshToken } }),
    logout: (token: string) => apiFetch('/auth/logout', { method: 'POST', token }),
    me: (token: string) => apiFetch('/auth/me', { token }),
  },
  users: {
    list: (params?: any, token?: string) => apiFetch('/users', { token, params }),
    get: (id: string, token: string) => apiFetch(`/users/${id}`, { token }),
    create: (data: any, token: string) => apiFetch('/users', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/users/${id}`, { method: 'PATCH', body: data, token }),
    delete: (id: string, token: string) => apiFetch(`/users/${id}`, { method: 'DELETE', token }),
  },
  projects: {
    list: (params?: any, token?: string) => apiFetch('/projects', { token, params }),
    get: (id: string, token: string) => apiFetch(`/projects/${id}`, { token }),
    create: (data: any, token: string) => apiFetch('/projects', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/projects/${id}`, { method: 'PATCH', body: data, token }),
    delete: (id: string, token: string) => apiFetch(`/projects/${id}`, { method: 'DELETE', token }),
  },
  tasks: {
    list: (params?: any, token?: string) => apiFetch('/tasks', { token, params }),
    get: (id: string, token: string) => apiFetch(`/tasks/${id}`, { token }),
    create: (data: any, token: string) => apiFetch('/tasks', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/tasks/${id}`, { method: 'PATCH', body: data, token }),
    delete: (id: string, token: string) => apiFetch(`/tasks/${id}`, { method: 'DELETE', token }),
  },
  sprints: {
    list: (projectId: string, token: string) => apiFetch(`/sprints?projectId=${projectId}`, { token }),
    create: (data: any, token: string) => apiFetch('/sprints', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/sprints/${id}`, { method: 'PATCH', body: data, token }),
  },
  timesheets: {
    list: (params?: any, token?: string) => apiFetch('/timesheets', { token, params }),
    create: (data: any, token: string) => apiFetch('/timesheets', { method: 'POST', body: data, token }),
    approve: (id: string, token: string) => apiFetch(`/timesheets/${id}/approve`, { method: 'PATCH', token }),
    reject: (id: string, reason: string, token: string) => apiFetch(`/timesheets/${id}/reject`, { method: 'PATCH', body: { reason }, token }),
  },
  issues: {
    list: (params?: any, token?: string) => apiFetch('/issues', { token, params }),
    create: (data: any, token: string) => apiFetch('/issues', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/issues/${id}`, { method: 'PATCH', body: data, token }),
  },
  risks: {
    list: (projectId: string, token: string) => apiFetch(`/risks?projectId=${projectId}`, { token }),
    create: (data: any, token: string) => apiFetch('/risks', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/risks/${id}`, { method: 'PATCH', body: data, token }),
  },
  changeRequests: {
    list: (params?: any, token?: string) => apiFetch('/change-requests', { token, params }),
    create: (data: any, token: string) => apiFetch('/change-requests', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/change-requests/${id}`, { method: 'PATCH', body: data, token }),
  },
  documents: {
    list: (params?: any, token?: string) => apiFetch('/documents', { token, params }),
    create: (data: any, token: string) => apiFetch('/documents', { method: 'POST', body: data, token }),
  },
  meetings: {
    list: (params?: any, token?: string) => apiFetch('/meetings', { token, params }),
    create: (data: any, token: string) => apiFetch('/meetings', { method: 'POST', body: data, token }),
  },
  notifications: {
    list: (token: string, params?: any) => apiFetch('/notifications', { token, params }),
    markRead: (id: string, token: string) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH', token }),
    markAllRead: (token: string) => apiFetch('/notifications/read-all', { method: 'PATCH', token }),
    unreadCount: (token: string) => apiFetch('/notifications/unread-count', { token }),
  },
  dashboard: {
    stats: (token: string) => apiFetch('/dashboard/stats', { token }),
    projects: (token: string) => apiFetch('/dashboard/projects', { token }),
    activities: (token: string) => apiFetch('/dashboard/activities', { token }),
  },
  budget: {
    list: (projectId: string, token: string) => apiFetch(`/budget?projectId=${projectId}`, { token }),
    summary: (projectId: string, token: string) => apiFetch(`/budget/summary?projectId=${projectId}`, { token }),
    create: (data: any, token: string) => apiFetch('/budget', { method: 'POST', body: data, token }),
  },
  audit: {
    list: (params: any, token: string) => apiFetch('/audit', { token, params }),
  },
};
""")

# ============================================
# LIB: Utils
# ============================================
write("src/lib/utils.ts", """import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Project status
    planning: 'badge-blue', analysis: 'badge-blue', development: 'badge-yellow',
    sit: 'badge-yellow', uat: 'badge-yellow', go_live: 'badge-green',
    support: 'badge-green', closed: 'badge-gray', on_hold: 'badge-yellow', cancelled: 'badge-red',
    // Task status
    backlog: 'badge-gray', todo: 'badge-blue', in_progress: 'badge-yellow',
    review: 'badge-yellow', testing: 'badge-yellow', done: 'badge-green',
    blocked: 'badge-red', cancelled: 'badge-red',
    // Health
    green: 'badge-green', yellow: 'badge-yellow', red: 'badge-red',
    // Priority
    critical: 'badge-red', high: 'badge-yellow', medium: 'badge-blue', low: 'badge-gray',
    // Timesheet
    draft: 'badge-gray', submitted: 'badge-blue', approved: 'badge-green', rejected: 'badge-red',
    // Issue
    open: 'badge-red', investigation: 'badge-yellow', fixed: 'badge-green', reopened: 'badge-red',
    // Risk
    identified: 'badge-blue', assessed: 'badge-yellow', mitigated: 'badge-green', monitoring: 'badge-green',
    occurred: 'badge-red',
    // Change request
    review: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red',
    in_development: 'badge-blue', deployed: 'badge-green',
  };
  return colors[status] || 'badge-gray';
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getHealthEmoji(health: string): string {
  return health === 'green' ? '🟢' : health === 'yellow' ? '🟡' : '🔴';
}

export function getPriorityEmoji(priority: string): string {
  return priority === 'critical' ? '🔴' : priority === 'high' ? '🟠' : priority === 'medium' ? '🟡' : '🟢';
}
""")

# ============================================
# STORE: Auth
# ============================================
write("src/store/auth.ts", """import { create } from 'zustand';
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
""")

# ============================================
# COMPONENTS: Layout
# ============================================
write("src/components/layout/Sidebar.tsx", """'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, ListTodo, Columns3, BarChart3,
  Clock, Users, Calendar, AlertTriangle, Shield, FileText,
  FolderOpen, Bell, BarChart2, Settings, Bot, Building2,
  ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderKanban, label: 'Projects', href: '/dashboard/projects' },
  { icon: ListTodo, label: 'Tasks', href: '/dashboard/tasks' },
  { icon: Columns3, label: 'Kanban', href: '/dashboard/kanban' },
  { icon: BarChart3, label: 'Gantt', href: '/dashboard/gantt' },
  { icon: Clock, label: 'Timesheet', href: '/dashboard/timesheet' },
  { icon: Users, label: 'Resources', href: '/dashboard/resources' },
  { icon: Calendar, label: 'Meetings', href: '/dashboard/meetings' },
  { icon: AlertTriangle, label: 'Issues', href: '/dashboard/issues' },
  { icon: Shield, label: 'Risks', href: '/dashboard/risks' },
  { icon: FileText, label: 'Change Requests', href: '/dashboard/change-requests' },
  { icon: FolderOpen, label: 'Documents', href: '/dashboard/documents' },
  { icon: Building2, label: 'Client Portal', href: '/dashboard/client-portal' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
  { icon: BarChart2, label: 'Reports', href: '/dashboard/reports' },
  { icon: Bot, label: 'AI Assistant', href: '/dashboard/ai' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed top-0 left-0 z-50 h-screen w-[260px] bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">ProjectFlow</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-link', isActive && 'active')}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-primary">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user ? `${user.firstName} ${user.lastName}` : 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="p-1 rounded hover:bg-accent" title="Logout">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}
""")

write("src/components/layout/Header.tsx", """'use client';

import { useState } from 'react';
import { Search, Moon, Sun, Bell } from 'lucide-react';
import { useAuth } from '@/store/auth';

export default function Header() {
  const [dark, setDark] = useState(false);
  const { user } = useAuth();

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects, tasks, meetings..."
            className="input pl-10 w-full"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggleDark} className="btn btn-ghost btn-sm">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="btn btn-ghost btn-sm relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">3</span>
        </button>
      </div>
    </header>
  );
}
""")

# ============================================
# DASHBOARD LAYOUT
# ============================================
write("src/app/(dashboard)/layout.tsx", """'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/store/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, loadUser } = useAuth();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading ProjectFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
""")

# ============================================
# LOGIN PAGE
# ============================================
write("src/app/login/page.tsx", """'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban } from 'lucide-react';
import { useAuth } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@projectflow.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="card p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FolderKanban className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl">ProjectFlow</span>
        </div>
        <h1 className="text-xl font-semibold text-center mb-6">Sign in to your account</h1>
        {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" required />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Default: admin@projectflow.com / admin123
        </p>
      </div>
    </div>
  );
}
""")

# ============================================
# DASHBOARD PAGE
# ============================================
write("src/app/(dashboard)/dashboard/page.tsx", """'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, getHealthEmoji } from '@/lib/utils';
import { FolderKanban, ListTodo, Users, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      api.dashboard.stats(accessToken),
      api.dashboard.projects(accessToken),
      api.dashboard.activities(accessToken),
    ]).then(([s, p, a]) => {
      setStats(s);
      setProjects(p);
      setActivities(a);
    }).catch(console.error);
  }, [accessToken]);

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const statCards = [
    { label: 'Total Projects', value: stats.totalProjects, icon: FolderKanban, color: 'text-blue-500' },
    { label: 'Active Tasks', value: stats.totalTasks - stats.completedTasks, icon: ListTodo, color: 'text-yellow-500' },
    { label: 'Team Members', value: stats.totalUsers, icon: Users, color: 'text-green-500' },
    { label: 'Open Issues', value: stats.openIssues, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Task Completion', value: `${stats.taskCompletionRate}%`, icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Open Risks', value: stats.openRisks, icon: Clock, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your project overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Projects Table */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Recent Projects</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr className="table-row">
                <th className="table-head">Project</th>
                <th className="table-head">Client</th>
                <th className="table-head">Status</th>
                <th className="table-head">Health</th>
                <th className="table-head">Progress</th>
                <th className="table-head">Budget</th>
                <th className="table-head">End Date</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p: any) => (
                <tr key={p.id} className="table-row">
                  <td className="table-cell">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.code}</p>
                    </div>
                  </td>
                  <td className="table-cell">{p.clientName}</td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span></td>
                  <td className="table-cell">{getHealthEmoji(p.health)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.completionPercentage}%` }} />
                      </div>
                      <span className="text-xs">{p.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="table-cell">{formatCurrency(p.budget)}</td>
                  <td className="table-cell">{formatDate(p.endDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Recent Activities</h2>
        </div>
        <div className="divide-y divide-border">
          {activities.slice(0, 10).map((a: any) => (
            <div key={a.id} className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-primary">{a.taskCode?.slice(0, 2) || 'TS'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.taskCode} · {a.status}</p>
              </div>
              <span className={`badge ${getStatusColor(a.status)}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
""")

# ============================================
# PROJECTS PAGE
# ============================================
write("src/app/(dashboard)/projects/page.tsx", """'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, getHealthEmoji } from '@/lib/utils';
import { Plus, Search, Filter } from 'lucide-react';

export default function ProjectsPage() {
  const { accessToken } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    api.projects.list({ search, status: statusFilter }, accessToken)
      .then((res: any) => setProjects(res.data || []))
      .catch(console.error);
  }, [accessToken, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage all your projects</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select w-40">
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="analysis">Analysis</option>
          <option value="development">Development</option>
          <option value="sit">SIT</option>
          <option value="uat">UAT</option>
          <option value="go_live">Go Live</option>
          <option value="support">Support</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p: any) => (
          <div key={p.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-mono">{p.code}</p>
                <h3 className="font-semibold">{p.name}</h3>
              </div>
              <span className={`badge ${getStatusColor(p.health)}`}>{getHealthEmoji(p.health)}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{p.clientName}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span>{p.completionPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${p.completionPercentage}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{formatCurrency(p.budget)}</span>
                <span>{formatDate(p.endDate)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span>
              <span className={`badge ${getStatusColor(p.priority)}`}>{p.priority}</span>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No projects found</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first project to get started</p>
          <button className="btn btn-primary"><Plus className="w-4 h-4 mr-2" /> New Project</button>
        </div>
      )}
    </div>
  );
}

function FolderKanban(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M8 6h8"/><path d="M8 12h8"/><path d="M8 18h8"/>
    </svg>
  );
}
""")

# ============================================
# GENERIC PAGE TEMPLATE
# ============================================
def make_page(name, title, description):
  return f"""'use client';

import {{ useEffect, useState }} from 'react';
import {{ useAuth }} from '@/store/auth';
import {{ api }} from '@/lib/api';
import {{ Plus, Search }} from 'lucide-react';

export default function {name}Page() {{
  const {{ accessToken }} = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {{
    if (!accessToken) return;
    // Fetch data from API
    console.log('Fetching {title}...');
  }}, [accessToken]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" /> New
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search..." value={{search}} onChange={{e => setSearch(e.target.value)}} className="input pl-10" />
      </div>

      <div className="card p-12 text-center">
        <h3 className="font-semibold mb-2">{title} Module</h3>
        <p className="text-sm text-muted-foreground">This module is under development.</p>
      </div>
    </div>
  );
}}
"""

# Generate all remaining pages
pages = [
  ("Tasks", "Tasks", "Manage all tasks across projects"),
  ("Kanban", "Kanban Board", "Drag and drop tasks between columns"),
  ("Gantt", "Gantt Chart", "Visualize project timeline"),
  ("Timesheet", "Timesheet", "Track your work hours"),
  ("Resources", "Resource Management", "Manage team resources and allocation"),
  ("Meetings", "Meetings & MOM", "Schedule meetings and record minutes"),
  ("Issues", "Issue Management", "Track and resolve project issues"),
  ("Risks", "Risk Management", "Identify and mitigate project risks"),
  ("ChangeRequests", "Change Requests", "Manage change requests"),
  ("Documents", "Document Management", "Upload and manage project documents"),
  ("ClientPortal", "Client Portal", "Client-facing project view"),
  ("Notifications", "Notifications", "View all notifications"),
  ("Reports", "Reports", "Generate and export reports"),
  ("AIAssistant", "AI Assistant", "AI-powered project insights"),
  ("Settings", "Settings", "Manage your account and preferences"),
]

for name, title, desc in pages:
  write(f"src/app/(dashboard)/{name.lower()}/page.tsx", make_page(name, title, desc))

print("✅ All frontend files created!")
