'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, getHealthEmoji } from '@/lib/utils';
import { Plus, Search, Filter, X } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const { accessToken: token } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    clientName: '',
    projectType: '',
    budget: '',
    startDate: '',
    endDate: '',
    status: 'planning',
    priority: 'medium',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.projects.list({ search, status: statusFilter }, token)
      .then((res: any) => setProjects(res.data || []))
      .catch(console.error);
  }, [token, search, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nama project wajib diisi'); return; }
    if (!token) return;
    const accessToken = token;
    setSaving(true);
    setError('');
    try {
      await api.projects.create({
        name: form.name,
        description: form.description || undefined,
        clientName: form.clientName || undefined,
        projectType: form.projectType || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        status: form.status,
        priority: form.priority,
      }, accessToken);
      setShowModal(false);
      setForm({ name: '', description: '', clientName: '', projectType: '', budget: '', startDate: '', endDate: '', status: 'planning', priority: 'medium' });
      const res: any = await api.projects.list({ search, status: statusFilter }, accessToken);
      setProjects(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage all your projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
          <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
            <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
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
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No projects found</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" /> New Project</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">New Project</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg">{error}</div>}
              <div>
                <label className="label">Project Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. ERP Implementation" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Project description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Client Name</label>
                  <input className="input" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="PT ABC Tbk" />
                </div>
                <div>
                  <label className="label">Project Type</label>
                  <input className="input" value={form.projectType} onChange={e => setForm({ ...form, projectType: e.target.value })} placeholder="ERP Implementation" />
                </div>
              </div>
              <div>
                <label className="label">Budget (Rp)</label>
                <input type="number" className="input" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="500000000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
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
                <div>
                  <label className="label">Priority</label>
                  <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
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
