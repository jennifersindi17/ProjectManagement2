'use client';

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
