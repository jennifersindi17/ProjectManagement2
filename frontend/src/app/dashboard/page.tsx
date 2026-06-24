'use client';

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
    ]).then((results: any) => {
      setStats(results[0]);
      setProjects(results[1]);
      setActivities(results[2]);
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
        <p className="text-muted-foreground">Welcome back! Here is your project overview.</p>
      </div>

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
