'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, Layers, Columns, BarChart3,
  Clock, Users, Calendar, AlertTriangle, Shield, FileText,
  FolderOpen, Bell, BarChart2, Settings, Bot, Building2,
  ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderKanban, label: 'Projects', href: '/dashboard/projects' },
  { icon: Layers, label: 'Task Center', href: '/dashboard/tasks' },
  { icon: Columns, label: 'Kanban', href: '/dashboard/kanban' },
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
