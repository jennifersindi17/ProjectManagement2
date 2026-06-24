'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import {
  Plus, Search, Filter, Calendar, LayoutGrid, List, ChevronDown,
  Clock, AlertTriangle, CheckCircle2, Circle, Users, Tag,
  MoreHorizontal, Edit, Trash2, Eye, ArrowUpDown, X,
  ChevronLeft, ChevronRight, MessageSquare, Paperclip, Activity,
  GripVertical, UserPlus, CalendarDays, BarChart3, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============ TYPES ============
interface Task {
  id: string;
  taskCode: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  taskType?: string;
  projectName?: string;
  projectCode?: string;
  assignee?: { firstName: string; lastName: string; avatar?: string } | null;
  dueDate?: string;
  startDate?: string;
  completionPercentage?: number;
  labels?: string[];
  createdAt?: string;
}

interface TaskStats {
  total: number;
  myTasks: number;
  overdue: number;
  dueToday: number;
  inProgress: number;
  completed: number;
  priorityBreakdown: { priority: string; count: string }[];
  statusBreakdown: { status: string; count: string }[];
}

interface MyTasksGroup {
  assigned: Task[];
  dueToday: Task[];
  upcoming: Task[];
  overdue: Task[];
  completed: Task[];
}

type ViewMode = 'list' | 'kanban' | 'calendar' | 'my-tasks';
type CalendarView = 'day' | 'week' | 'month';

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-gray-500/20 text-gray-400',
  todo: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-yellow-500/20 text-yellow-400',
  review: 'bg-purple-500/20 text-purple-400',
  testing: 'bg-orange-500/20 text-orange-400',
  done: 'bg-green-500/20 text-green-400',
  blocked: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-600/20 text-gray-500',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress',
  review: 'Review', testing: 'Testing', done: 'Done',
  blocked: 'Blocked', cancelled: 'Cancelled',
};

const KANBAN_COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'border-gray-500' },
  { id: 'todo', label: 'To Do', color: 'border-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'border-yellow-500' },
  { id: 'review', label: 'Review', color: 'border-purple-500' },
  { id: 'testing', label: 'Testing', color: 'border-orange-500' },
  { id: 'done', label: 'Done', color: 'border-green-500' },
  { id: 'blocked', label: 'Blocked', color: 'border-red-500' },
];

// ============ MAIN COMPONENT ============
export default function TaskCenterPage() {
  const { accessToken } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<MyTasksGroup | null>(null);
  const [kanbanData, setKanbanData] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [sortBy, setSortBy] = useState('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await api.tasks.stats(accessToken);
      setStats(data);
    } catch (e) { console.error('Stats error:', e); }
  }, [accessToken]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (selectedProject) params.projectId = selectedProject;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;
      if (selectedAssignee) params.assigneeId = selectedAssignee;
      params.sort = sortBy;
      params.order = sortOrder;
      const result = await api.tasks.list(params, accessToken);
      setTasks(result.data || []);
      setTotalPages(result.meta?.totalPages || 1);
    } catch (e) { console.error('Tasks error:', e); }
    setLoading(false);
  }, [accessToken, page, search, selectedProject, selectedStatus, selectedPriority, selectedAssignee, sortBy, sortOrder]);

  // Fetch my tasks
  const fetchMyTasks = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await api.tasks.myTasks(accessToken);
      setMyTasks(data);
    } catch (e) { console.error('My tasks error:', e); }
  }, [accessToken]);

  // Fetch kanban
  const fetchKanban = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await api.tasks.kanban(accessToken, selectedProject || undefined);
      setKanbanData(data.columns || {});
    } catch (e) { console.error('Kanban error:', e); }
  }, [accessToken, selectedProject]);

  // Fetch projects & users for filters
  const fetchMeta = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [projRes, userRes, tagRes] = await Promise.all([
        api.projects.list({}, accessToken),
        api.users.list({}, accessToken),
        api.tasks.tags(accessToken),
      ]);
      setProjects(projRes.data || []);
      setUsers(userRes.data || []);
      setTags(tagRes || []);
    } catch (e) { console.error('Meta error:', e); }
  }, [accessToken]);

  useEffect(() => { fetchStats(); fetchMeta(); }, [fetchStats, fetchMeta]);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { if (viewMode === 'my-tasks') fetchMyTasks(); }, [viewMode, fetchMyTasks]);
  useEffect(() => { if (viewMode === 'kanban') fetchKanban(); }, [viewMode, fetchKanban]);

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Task Center
          </h1>
          <p className="text-muted-foreground">Kelola semua task dari seluruh project</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewModeTabs viewMode={viewMode} setViewMode={setViewMode} />
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <StatsCards stats={stats} />}

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Cari task..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-10"
          />
        </div>
        <button
          className={cn('btn btn-ghost', showFilters && 'bg-accent')}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" /> Filters
          <ChevronDown className={cn('w-4 h-4 ml-1 transition-transform', showFilters && 'rotate-180')} />
        </button>
        {viewMode === 'list' && (
          <button className="btn btn-ghost" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortBy === 'position' ? 'Position' : sortBy === 'dueDate' ? 'Due Date' : sortBy === 'priority' ? 'Priority' : sortBy} {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          projects={projects} users={users} tags={tags}
          selectedProject={selectedProject} setSelectedProject={v => { setSelectedProject(v); setPage(1); }}
          selectedStatus={selectedStatus} setSelectedStatus={v => { setSelectedStatus(v); setPage(1); }}
          selectedPriority={selectedPriority} setSelectedPriority={v => { setSelectedPriority(v); setPage(1); }}
          selectedAssignee={selectedAssignee} setSelectedAssignee={v => { setSelectedAssignee(v); setPage(1); }}
          sortBy={sortBy} setSortBy={v => { setSortBy(v); setPage(1); }}
        />
      )}

      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <BulkActionsBar
          count={selectedTasks.size}
          onClear={() => setSelectedTasks(new Set())}
          onDelete={async () => {
            if (!accessToken) return;
            await api.tasks.bulkDelete(Array.from(selectedTasks), accessToken);
            setSelectedTasks(new Set());
            fetchTasks();
            fetchStats();
          }}
          onStatusChange={async (status: string) => {
            if (!accessToken) return;
            await api.tasks.bulkStatus(Array.from(selectedTasks), status, accessToken);
            setSelectedTasks(new Set());
            fetchTasks();
            fetchStats();
          }}
        />
      )}

      {/* Main Content */}
      {viewMode === 'list' && (
        <TaskList
          tasks={tasks} loading={loading}
          selectedTasks={selectedTasks} setSelectedTasks={setSelectedTasks}
          onTaskClick={task => { setDetailTask(task); setShowDetailDrawer(true); }}
          onSort={(field) => {
            if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
            else { setSortBy(field); setSortOrder('asc'); }
          }}
          sortBy={sortBy} sortOrder={sortOrder}
        />
      )}
      {viewMode === 'kanban' && (
        <KanbanView
          columns={kanbanData}
          onTaskClick={task => { setDetailTask(task); setShowDetailDrawer(true); }}
          onStatusChange={async (taskId, newStatus) => {
            if (!accessToken) return;
            await api.tasks.update(taskId, { status: newStatus }, accessToken);
            fetchKanban();
            fetchStats();
          }}
        />
      )}
      {viewMode === 'calendar' && (
        <CalendarView
          view={calendarView} setView={setCalendarView}
          date={calendarDate} setDate={setCalendarDate}
          accessToken={accessToken} onTaskClick={task => { setDetailTask(task); setShowDetailDrawer(true); }}
        />
      )}
      {viewMode === 'my-tasks' && (
        <MyTasksView
          data={myTasks} loading={loading}
          onTaskClick={task => { setDetailTask(task); setShowDetailDrawer(true); }}
        />
      )}

      {/* Pagination */}
      {viewMode === 'list' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Drawer */}
      {showDetailDrawer && detailTask && (
        <TaskDetailDrawer
          task={detailTask}
          onClose={() => setShowDetailDrawer(false)}
          accessToken={accessToken}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          accessToken={accessToken}
          projects={projects}
          users={users}
          onCreated={() => { fetchTasks(); fetchStats(); fetchKanban(); }}
        />
      )}
    </div>
  );
}

// ============ VIEW MODE TABS ============
function ViewModeTabs({ viewMode, setViewMode }: { viewMode: ViewMode; setViewMode: (v: ViewMode) => void }) {
  const tabs: { id: ViewMode; label: string; icon: any }[] = [
    { id: 'list', label: 'List', icon: List },
    { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'my-tasks', label: 'My Tasks', icon: Users },
  ];
  return (
    <div className="flex bg-card rounded-lg border border-border p-1">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setViewMode(t.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            viewMode === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <t.icon className="w-4 h-4" />
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============ STATS CARDS ============
function StatsCards({ stats }: { stats: TaskStats }) {
  const cards = [
    { label: 'Total Tasks', value: stats.total, icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'My Tasks', value: stats.myTasks, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Due Today', value: stats.dueToday, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => (
        <div key={c.label} className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', c.bg)}>
              <c.icon className={cn('w-4 h-4', c.color)} />
            </div>
          </div>
          <p className="text-2xl font-bold">{c.value}</p>
          <p className="text-xs text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ============ FILTER PANEL ============
function FilterPanel({ projects, users, tags, selectedProject, setSelectedProject, selectedStatus, setSelectedStatus, selectedPriority, setSelectedPriority, selectedAssignee, setSelectedAssignee, sortBy, setSortBy }: {
  projects: { id: string; name: string }[];
  users: { id: string; firstName: string; lastName: string }[];
  tags: string[];
  selectedProject: string;
  setSelectedProject: (v: string) => void;
  selectedStatus: string;
  setSelectedStatus: (v: string) => void;
  selectedPriority: string;
  setSelectedPriority: (v: string) => void;
  selectedAssignee: string;
  setSelectedAssignee: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
}) {
  return (
    <div className="card p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Project</label>
        <select className="input text-sm" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Status</label>
        <select className="input text-sm" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
        <select className="input text-sm" value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Assignee</label>
        <select className="input text-sm" value={selectedAssignee} onChange={e => setSelectedAssignee(e.target.value)}>
          <option value="">All Assignees</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Sort By</label>
        <select className="input text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="position">Position</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
          <option value="createdAt">Created</option>
        </select>
      </div>
    </div>
  );
}

// ============ BULK ACTIONS ============
function BulkActionsBar({ count, onClear, onDelete, onStatusChange }: { count: number; onClear: () => void; onDelete: () => void; onStatusChange: (status: string) => void }) {
  return (
    <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="flex-1" />
      <button className="btn btn-ghost btn-sm" onClick={() => onStatusChange('in_progress')}>Set In Progress</button>
      <button className="btn btn-ghost btn-sm" onClick={() => onStatusChange('done')}>Set Done</button>
      <button className="btn btn-ghost btn-sm text-red-400" onClick={onDelete}><Trash2 className="w-4 h-4" /></button>
      <button className="btn btn-ghost btn-sm" onClick={onClear}><X className="w-4 h-4" /></button>
    </div>
  );
}

// ============ TASK LIST ============
function TaskList({ tasks, loading, selectedTasks, setSelectedTasks, onTaskClick, onSort, sortBy, sortOrder }: {
  tasks: Task[]; loading: boolean; selectedTasks: Set<string>; setSelectedTasks: (s: Set<string>) => void;
  onTaskClick: (t: Task) => void; onSort: (field: string) => void; sortBy: string; sortOrder: 'asc' | 'desc';
}) {
  const toggleSelect = (id: string) => {
    const next = new Set(selectedTasks);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedTasks(next);
  };
  const toggleAll = () => {
    if (selectedTasks.size === tasks.length) setSelectedTasks(new Set());
    else setSelectedTasks(new Set(tasks.map((t: Task) => t.id)));
  };

  if (loading) return <div className="card p-12 text-center text-muted-foreground">Loading tasks...</div>;
  if (tasks.length === 0) return <div className="card p-12 text-center text-muted-foreground">Tidak ada task ditemukan.</div>;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="p-3 text-left w-10">
                <input type="checkbox" checked={selectedTasks.size === tasks.length && tasks.length > 0} onChange={toggleAll} className="rounded" />
              </th>
              <th className="p-3 text-left cursor-pointer hover:text-foreground" onClick={() => onSort('title')}>
                Task {sortBy === 'title' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 text-left">Project</th>
              <th className="p-3 text-left">Assignee</th>
              <th className="p-3 text-left cursor-pointer hover:text-foreground" onClick={() => onSort('priority')}>
                Priority {sortBy === 'priority' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left cursor-pointer hover:text-foreground" onClick={() => onSort('dueDate')}>
                Due Date {sortBy === 'dueDate' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className="p-3 text-left">Progress</th>
              <th className="p-3 text-left w-10"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task: Task) => (
              <tr
                key={task.id}
                className={cn(
                  'border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors',
                  selectedTasks.has(task.id) && 'bg-primary/5'
                )}
                onClick={() => onTaskClick(task)}
              >
                <td className="p-3" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onChange={() => toggleSelect(task.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-3">
                  <div>
                    <span className="text-xs text-muted-foreground font-mono">{task.taskCode}</span>
                    <p className="font-medium">{task.title}</p>
                    {task.labels && task.labels.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {task.labels.slice(0, 3).map(l => (
                          <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{l}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{task.projectName || '-'}</td>
                <td className="p-3">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-primary">
                          {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                        </span>
                      </div>
                      <span className="text-xs">{task.assignee.firstName} {task.assignee.lastName}</span>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">Unassigned</span>}
                </td>
                <td className="p-3">
                  <span className={cn('text-xs px-2 py-1 rounded-full border', PRIORITY_COLORS[task.priority] || '')}>
                    {task.priority}
                  </span>
                </td>
                <td className="p-3">
                  <span className={cn('text-xs px-2 py-1 rounded-full', STATUS_COLORS[task.status] || '')}>
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${task.completionPercentage || 0}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{task.completionPercentage || 0}%</span>
                  </div>
                </td>
                <td className="p-3" onClick={e => e.stopPropagation()}>
                  <button className="p-1 rounded hover:bg-muted"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ KANBAN VIEW ============
function KanbanView({ columns, onTaskClick, onStatusChange }: { columns: Record<string, Task[]>; onTaskClick: (t: Task) => void; onStatusChange: (id: string, s: string) => void; }) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleDragStart = (task: Task) => { setDraggedTask(task); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (status: string) => {
    if (draggedTask && draggedTask.status !== status) {
      onStatusChange(draggedTask.id, status);
    }
    setDraggedTask(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(col => (
        <div
          key={col.id}
          className="flex-shrink-0 w-72"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(col.id)}
        >
          <div className={cn('flex items-center justify-between mb-3 px-1 border-l-2 pl-3', col.color)}>
            <h3 className="text-sm font-semibold">{col.label}</h3>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{columns[col.id]?.length || 0}</span>
          </div>
          <div className="space-y-2 min-h-[200px]">
            {(columns[col.id] || []).map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task)}
                onClick={() => onTaskClick(task)}
                className="card p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-mono">{task.taskCode}</p>
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', PRIORITY_COLORS[task.priority] || '')}>
                        {task.priority}
                      </span>
                      {task.assignee && (
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-[8px] font-medium text-primary">
                            {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    {task.dueDate && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ CALENDAR VIEW ============
function CalendarView({ view, setView, date, setDate, accessToken, onTaskClick }: {
  view: CalendarView; setView: (v: CalendarView) => void; date: Date; setDate: (d: Date) => void;
  accessToken: string | null; onTaskClick: (t: Task) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    const start = new Date(date);
    const end = new Date(date);
    if (view === 'week') { start.setDate(start.getDate() - start.getDay()); end.setDate(start.getDate() + 6); }
    if (view === 'month') { start.setDate(1); end.setMonth(end.getMonth() + 1); end.setDate(0); }

    api.tasks.calendar(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0],
      undefined, accessToken
    ).then(data => { setTasks(data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [accessToken, view, date]);

  const getDays = () => {
    const days: Date[] = [];
    const start = new Date(date);
    if (view === 'week') { start.setDate(start.getDate() - start.getDay()); for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); days.push(d); } }
    else if (view === 'month') { start.setDate(1); const end = new Date(start); end.setMonth(end.getMonth() + 1); while (start < end) { days.push(new Date(start)); start.setDate(start.getDate() + 1); } }
    else { days.push(new Date(start)); }
    return days;
  };

  const getTasksForDay = (day: Date) => {
    const dayStr = day.toISOString().split('T')[0];
    return tasks.filter(t => t.dueDate === dayStr || t.startDate === dayStr);
  };

  const navigate = (dir: number) => {
    const d = new Date(date);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setDate(d);
  };

  const days = getDays();
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className="card">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></button>
          <h3 className="font-semibold">
            {view === 'month' ? date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) :
             view === 'week' ? `Week of ${days[0]?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` :
             date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex bg-muted rounded-lg p-1">
          {(['day', 'week', 'month'] as CalendarView[]).map(v => (
            <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1 rounded text-xs font-medium', view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
              {v === 'day' ? 'Day' : v === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading calendar...</div>
      ) : view === 'day' ? (
        <div className="p-4 space-y-2">
          {getTasksForDay(days[0]).map(task => (
            <div key={task.id} onClick={() => onTaskClick(task)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
              <span className={cn('text-xs px-2 py-1 rounded-full', STATUS_COLORS[task.status])}>{STATUS_LABELS[task.status]}</span>
              <span className="font-medium">{task.title}</span>
              <span className="text-xs text-muted-foreground">{task.projectName}</span>
            </div>
          ))}
          {getTasksForDay(days[0]).length === 0 && <p className="text-center text-muted-foreground py-8">Tidak ada task pada hari ini.</p>}
        </div>
      ) : (
        <div className={cn('grid', view === 'week' ? 'grid-cols-7' : 'grid-cols-7')}>
          {dayNames.map(d => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-border">{d}</div>
          ))}
          {days.map((day, i) => {
            const dayTasks = getTasksForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={cn('min-h-[100px] p-1 border-b border-border/50', view === 'month' && 'border-r border-border/50')}>
                <div className={cn('text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full', isToday && 'bg-primary text-primary-foreground font-bold')}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, view === 'month' ? 3 : 10).map(task => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={cn('text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer', STATUS_COLORS[task.status])}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > (view === 'month' ? 3 : 10) && (
                    <p className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - (view === 'month' ? 3 : 10)} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ MY TASKS VIEW ============
function MyTasksView({ data, loading, onTaskClick }: { data: MyTasksGroup | null; loading: boolean; onTaskClick: (t: Task) => void }) {
  if (loading || !data) return <div className="card p-12 text-center text-muted-foreground">Loading...</div>;

  const sections = [
    { label: 'Overdue', tasks: data.overdue, icon: AlertTriangle, color: 'text-red-400', emptyMsg: 'Tidak ada task overdue. 🎉' },
    { label: 'Due Today', tasks: data.dueToday, icon: Clock, color: 'text-orange-400', emptyMsg: 'Tidak ada task jatuh tempo hari ini.' },
    { label: 'Upcoming (7 days)', tasks: data.upcoming, icon: CalendarDays, color: 'text-blue-400', emptyMsg: 'Tidak ada task dalam 7 hari ke depan.' },
    { label: 'All Assigned', tasks: data.assigned, icon: List, color: 'text-purple-400', emptyMsg: 'Tidak ada task yang ditugaskan ke Anda.' },
    { label: 'Completed', tasks: data.completed, icon: CheckCircle2, color: 'text-green-400', emptyMsg: 'Belum ada task yang selesai.' },
  ];

  return (
    <div className="space-y-6">
      {sections.map(section => (
        <div key={section.label}>
          <div className="flex items-center gap-2 mb-3">
            <section.icon className={cn('w-5 h-5', section.color)} />
            <h3 className="font-semibold">{section.label}</h3>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{section.tasks.length}</span>
          </div>
          {section.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-7">{section.emptyMsg}</p>
          ) : (
            <div className="grid gap-2">
              {section.tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="card p-3 flex items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{task.taskCode}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', PRIORITY_COLORS[task.priority] || '')}>{task.priority}</span>
                    </div>
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.projectName}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-1 rounded-full', STATUS_COLORS[task.status] || '')}>
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ TASK DETAIL DRAWER ============
function TaskDetailDrawer({ task, onClose, accessToken }: { task: Task; onClose: () => void; accessToken: string | null }) {
  const [comments, setComments] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'checklist' | 'activity'>('info');

  useEffect(() => {
    if (!accessToken) return;
    api.tasks.comments(task.id, accessToken).then(setComments).catch(() => {});
    api.tasks.checklist(task.id, accessToken).then(setChecklist).catch(() => {});
    api.tasks.activity(task.id, accessToken).then(setActivity).catch(() => {});
  }, [task.id, accessToken]);

  const addComment = async () => {
    if (!newComment.trim() || !accessToken) return;
    try {
      await api.tasks.addComment(task.id, newComment, accessToken);
      const updated = await api.tasks.comments(task.id, accessToken);
      setComments(updated);
      setNewComment('');
    } catch (e) { console.error(e); }
  };

  const addCheckItem = async () => {
    if (!newCheckItem.trim() || !accessToken) return;
    try {
      await api.tasks.addChecklist(task.id, newCheckItem, accessToken);
      const updated = await api.tasks.checklist(task.id, accessToken);
      setChecklist(updated);
      setNewCheckItem('');
    } catch (e) { console.error(e); }
  };

  const toggleCheckItem = async (itemId: string, completed: boolean) => {
    if (!accessToken) return;
    try {
      await api.tasks.toggleChecklist(task.id, itemId, completed, accessToken);
      const updated = await api.tasks.checklist(task.id, accessToken);
      setChecklist(updated);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l border-border flex flex-col overflow-hidden animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <span className="text-xs text-muted-foreground font-mono">{task.taskCode}</span>
            <h2 className="font-semibold">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: 'info', label: 'Info', icon: Eye },
            { id: 'comments', label: `Comments (${comments.length})`, icon: MessageSquare },
            { id: 'checklist', label: `Checklist (${checklist.length})`, icon: CheckCircle2 },
            { id: 'activity', label: 'Activity', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Project</label>
                <p className="font-medium">{task.projectName || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <p><span className={cn('text-xs px-2 py-1 rounded-full', STATUS_COLORS[task.status])}>{STATUS_LABELS[task.status]}</span></p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Priority</label>
                <p><span className={cn('text-xs px-2 py-1 rounded-full border', PRIORITY_COLORS[task.priority])}>{task.priority}</span></p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Assignee</label>
                <p>{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Due Date</label>
                <p>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Progress</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${task.completionPercentage || 0}%` }} />
                  </div>
                  <span className="text-sm">{task.completionPercentage || 0}%</span>
                </div>
              </div>
              {task.description && (
                <div>
                  <label className="text-xs text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{task.description}</p>
                </div>
              )}
              {task.labels && task.labels.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">Labels</label>
                  <div className="flex gap-1 mt-1">
                    {task.labels.map(l => <span key={l} className="text-xs px-2 py-0.5 rounded bg-muted">{l}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-medium text-primary">{c.first_name[0]}{c.last_name[0]}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.first_name} {c.last_name}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Belum ada komentar.</p>}
              <div className="flex gap-2 pt-2">
                <input
                  type="text" placeholder="Tulis komentar..." value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                  className="input flex-1 text-sm"
                />
                <button onClick={addComment} className="btn btn-primary btn-sm">Send</button>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                  <input
                    type="checkbox" checked={item.completed}
                    onChange={() => toggleCheckItem(item.id, !item.completed)}
                    className="rounded"
                  />
                  <span className={cn('text-sm', item.completed && 'line-through text-muted-foreground')}>{item.title}</span>
                </div>
              ))}
              {checklist.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Belum ada checklist item.</p>}
              <div className="flex gap-2 pt-2">
                <input
                  type="text" placeholder="Tambah item..." value={newCheckItem}
                  onChange={e => setNewCheckItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCheckItem()}
                  className="input flex-1 text-sm"
                />
                <button onClick={addCheckItem} className="btn btn-primary btn-sm">Add</button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activity.map(a => (
                <div key={a.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm"><span className="font-medium">{a.first_name} {a.last_name}</span> — {a.action}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Belum ada activity.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ CREATE TASK MODAL ============
function CreateTaskModal({ onClose, accessToken, projects, users, onCreated }: {
  onClose: () => void; accessToken: string | null;
  projects: { id: string; name: string }[]; users: { id: string; firstName: string; lastName: string }[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: '', description: '', projectId: '', sprintId: '', parentTaskId: '',
    status: 'todo', priority: 'medium', taskType: 'task', assigneeId: '',
    storyPoints: '', estimatedHours: '', dueDate: '', startDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!accessToken || !form.title || !form.projectId) return;
    setSaving(true);
    setError('');
    try {
      const body: any = {
        title: form.title,
        projectId: form.projectId,
        status: form.status,
        priority: form.priority,
        taskType: form.taskType,
      };
      if (form.description) body.description = form.description;
      if (form.assigneeId) body.assigneeId = form.assigneeId;
      if (form.sprintId) body.sprintId = form.sprintId;
      if (form.parentTaskId) body.parentTaskId = form.parentTaskId;
      if (form.storyPoints) body.storyPoints = parseFloat(form.storyPoints);
      if (form.estimatedHours) body.estimatedHours = parseFloat(form.estimatedHours);
      if (form.dueDate) body.dueDate = form.dueDate;
      if (form.startDate) body.startDate = form.startDate;

      await api.tasks.create(body, accessToken);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Gagal membuat task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold">New Task</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <input type="text" value={form.title} onChange={e => handleChange('title', e.target.value)} className="input" placeholder="Task title..." />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} className="input min-h-[80px]" placeholder="Task description..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Project *</label>
              <select value={form.projectId} onChange={e => handleChange('projectId', e.target.value)} className="input">
                <option value="">Select Project</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Assignee</label>
              <select value={form.assigneeId} onChange={e => handleChange('assigneeId', e.target.value)} className="input">
                <option value="">Unassigned</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <select value={form.status} onChange={e => handleChange('status', e.target.value)} className="input">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => handleChange('priority', e.target.value)} className="input">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Task Type</label>
              <select value={form.taskType} onChange={e => handleChange('taskType', e.target.value)} className="input">
                <option value="task">Task</option>
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="improvement">Improvement</option>
                <option value="epic">Epic</option>
                <option value="story">Story</option>
                <option value="subtask">Subtask</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => handleChange('dueDate', e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => handleChange('startDate', e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Estimated Hours</label>
              <input type="number" value={form.estimatedHours} onChange={e => handleChange('estimatedHours', e.target.value)} className="input" placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Story Points</label>
              <input type="number" value={form.storyPoints} onChange={e => handleChange('storyPoints', e.target.value)} className="input" placeholder="0" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border sticky bottom-0 bg-card">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={saving || !form.title || !form.projectId}>
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
