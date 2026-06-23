'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { Plus, Search } from 'lucide-react';

export default function SettingsPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    // Fetch data from API
    console.log('Fetching Settings...');
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" /> New
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <div className="card p-12 text-center">
        <h3 className="font-semibold mb-2">Settings Module</h3>
        <p className="text-sm text-muted-foreground">This module is under development.</p>
      </div>
    </div>
  );
}
