'use client';

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
