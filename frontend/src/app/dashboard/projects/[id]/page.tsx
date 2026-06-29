'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Plus, Calendar, Users, AlertTriangle, FileText, DollarSign, Activity, Clock, Target, TrendingUp, BarChart3, MoreVertical, Edit3, Copy, Trash2, Eye, GitBranch, User as UserIcon } from 'lucide-react';
import TaskModal from '@/components/tasks/TaskModal';
import TaskDetailDrawer from '@/components/tasks/TaskDetailDrawer';
import DuplicateTaskModal from '@/components/tasks/DuplicateTaskModal';
import AddSubtaskModal from '@/components/tasks/AddSubtaskModal';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'tasks', label: 'Tasks', icon: Target },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'resources', label: 'Resources', icon: Users },
  { id: 'meetings', label: 'Meetings', icon: Clock },
  { id: 'issues', label: 'Issues', icon: AlertTriangle },
  { id: 'risks', label: 'Risks', icon: AlertTriangle },
  { id: 'change-requests', label: 'Change Requests', icon: FileText },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'reports', label: 'Reports', icon: TrendingUp },
  { id: 'activity', label: 'Activity Log', icon: Activity },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { accessToken: token } = useAuth();
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [budget, setBudget] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [proj, ov, tsk, iss, rsk, mtg, cr, doc, bud, usr] = await Promise.all([
        api.projects.get(id, token),
        api.projects.overview(id, token).catch(() => null),
        api.tasks.list({ projectId: id }, token).catch((e: any) => ({ data: [] })),
        api.issues.list({ projectId: id }, token).catch((e: any) => ({ data: [] })),
        api.risks.list(id, token).catch((e: any) => ({ data: [] })),
        api.meetings.list({ projectId: id }, token).catch((e: any) => ({ data: [] })),
        api.changeRequests.list({ projectId: id }, token).catch((e: any) => ({ data: [] })),
        api.documents.list({ projectId: id }, token).catch((e: any) => ({ data: [] })),
        api.budget.list(id, token).catch((e: any) => ({ data: [] })),
        api.users.list({}, token).catch(() => ({ data: [] })),
      ]);
      setProject(proj);
      setOverview(ov);
      setTasks((tsk as any).data || []);
      setIssues((iss as any).data || []);
      setRisks((rsk as any).data || []);
      setMeetings((mtg as any).data || []);
      setChangeRequests((cr as any).data || []);
      setDocuments((doc as any).data || []);
      setBudget((bud as any).data || []);
      setUsers((usr as any).data || []);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12 text-muted-foreground">Project not found</div>;
  }

  const stats = overview || {};
  const totalTasks = Number(stats.total_tasks) || tasks.length;
  const completedTasks = Number(stats.completed_tasks) || tasks.filter((t: any) => t.status === 'done').length;
  const inProgressTasks = Number(stats.in_progress_tasks) || tasks.filter((t: any) => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter((t: any) => ['backlog', 'todo'].includes(t.status)).length;
  const blockedTasks = tasks.filter((t: any) => t.status === 'blocked').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects" className="p-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <span className="badge badge-blue">{project.code}</span>
          </div>
          <p className="text-muted-foreground">{project.clientName}</p>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="font-semibold capitalize">{project.status?.replace('_', ' ')}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted-foreground">Progress</p>
          <p className="font-semibold">{project.completionPercentage}%</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted-foreground">Priority</p>
          <p className="font-semibold capitalize">{project.priority}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted-foreground">Start Date</p>
          <p className="font-semibold">{formatDate(project.startDate)}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted-foreground">Target Go Live</p>
          <p className="font-semibold">{formatDate(project.endDate)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          project={project}
          overview={overview}
          stats={{ totalTasks, completedTasks, inProgressTasks, pendingTasks, blockedTasks }}
          issues={issues}
          risks={risks}
          tasks={tasks}
        />
      )}
      {activeTab === 'tasks' && <TasksTab tasks={tasks} projectId={id} token={token || ''} onTaskCreated={() => loadData()} project={project} users={users} />}
      {activeTab === 'timeline' && <TimelineTab project={project} tasks={tasks} />}
      {activeTab === 'resources' && <ResourcesTab overview={overview} />}
      {activeTab === 'meetings' && <MeetingsTab meetings={meetings} />}
      {activeTab === 'issues' && <IssuesTab issues={issues} />}
      {activeTab === 'risks' && <RisksTab risks={risks} />}
      {activeTab === 'change-requests' && <ChangeRequestsTab changeRequests={changeRequests} />}
      {activeTab === 'documents' && <DocumentsTab documents={documents} />}
      {activeTab === 'financial' && <FinancialTab project={project} budget={budget} />}
      {activeTab === 'reports' && <ReportsTab project={project} overview={overview} />}
      {activeTab === 'activity' && <ActivityTab projectId={id} />}
    </div>
  );
}

/* ============ OVERVIEW TAB ============ */
function OverviewTab({ project, overview, stats, issues, risks, tasks }: any) {
  const healthColor = (h: string) => {
    if (h === 'green' || h === 'On Track' || h === 'Good') return '🟢';
    if (h === 'yellow' || h === 'Warning') return '🟡';
    return '🔴';
  };

  const getHealthStatus = (type: string) => {
    if (type === 'schedule') return { label: 'On Track', color: 'green' };
    if (type === 'budget') {
      const pct = project.actualCost && project.budget ? (Number(project.actualCost) / Number(project.budget)) * 100 : 0;
      if (pct > 90) return { label: 'Over Budget', color: 'red' };
      if (pct > 70) return { label: 'Warning', color: 'yellow' };
      return { label: 'On Track', color: 'green' };
    }
    if (type === 'resource') return { label: 'Good', color: 'green' };
    if (type === 'risk') {
      const highRisks = risks.filter((r: any) => r.severity === 'high' || r.severity === 'critical').length;
      if (highRisks > 0) return { label: 'High', color: 'red' };
      return { label: 'Low', color: 'green' };
    }
    return { label: 'N/A', color: 'green' };
  };

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Project Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Project Manager</span><span>{overview?.project_manager_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Client PIC</span><span>{project.clientContact || '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Project Type</span><span>{project.projectType || '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Contract Value</span><span>{formatCurrency(project.contractValue)}</span></div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Project Health</h3>
            <div className="grid grid-cols-2 gap-3">
              {['schedule', 'budget', 'resource', 'risk'].map((type) => {
                const h = getHealthStatus(type);
                return (
                  <div key={type} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground capitalize">{type} Health</p>
                    <p className="font-semibold mt-1">{healthColor(h.label)} {h.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold">{stats.totalTasks}</p>
          <p className="text-xs text-muted-foreground">Total Tasks</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{stats.completedTasks}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">{stats.inProgressTasks}</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">{stats.pendingTasks}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{stats.blockedTasks}</p>
          <p className="text-xs text-muted-foreground">Blocked</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Task Completion */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Task Completion</h3>
          <div className="space-y-2">
            {['done', 'in_progress', 'todo', 'blocked'].map((status) => {
              const count = status === 'done' ? stats.completedTasks : status === 'in_progress' ? stats.inProgressTasks : status === 'blocked' ? stats.blockedTasks : stats.pendingTasks;
              const pct = stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;
              const colors: any = { done: 'bg-green-500', in_progress: 'bg-blue-500', todo: 'bg-yellow-500', blocked: 'bg-red-500' };
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${colors[status]} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Distribution */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Task Distribution</h3>
          <div className="space-y-2">
            {['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'].map((status) => {
              const count = tasks.filter((t: any) => t.status === status).length;
              const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
              const colors: any = { backlog: 'bg-gray-500', todo: 'bg-yellow-500', in_progress: 'bg-blue-500', review: 'bg-purple-500', testing: 'bg-orange-500', done: 'bg-green-500', blocked: 'bg-red-500' };
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span>{count}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${colors[status]} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Issues & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Open Issues ({issues.length})</h3>
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open issues</p>
          ) : (
            <div className="space-y-2">
              {issues.slice(0, 5).map((issue: any) => (
                <div key={issue.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{issue.title}</span>
                  <span className={`badge badge-${issue.severity === 'critical' ? 'red' : issue.severity === 'high' ? 'orange' : 'blue'}`}>{issue.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Open Risks ({risks.length})</h3>
          {risks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open risks</p>
          ) : (
            <div className="space-y-2">
              {risks.slice(0, 5).map((risk: any) => (
                <div key={risk.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{risk.title}</span>
                  <span className={`badge badge-${risk.severity === 'critical' ? 'red' : risk.severity === 'high' ? 'orange' : 'blue'}`}>{risk.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ TASKS TAB ============ */
const statusColors: any = {
  backlog: 'bg-gray-500', todo: 'bg-yellow-500', in_progress: 'bg-blue-500',
  review: 'bg-purple-500', testing: 'bg-orange-500', done: 'bg-green-500', blocked: 'bg-red-500',
};

const STATUS_OPTIONS = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'];

function TasksTab({ tasks, projectId, token, onTaskCreated, users, project }: any) {
  const [taskModal, setTaskModal] = useState<{ mode: string; task?: any } | null>(null);
  const [viewTaskId, setViewTaskId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [duplicateTask, setDuplicateTask] = useState<any>(null);

  const refresh = useCallback(async () => {
    if (onTaskCreated) await onTaskCreated();
  }, [onTaskCreated]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!token) return;
    setSaving(true);
    try {
      await api.tasks.update(taskId, { status: newStatus }, token);
      setOpenStatusId(null);
      setOpenMenuId(null);
      await refresh();
    } catch (err: any) {
      console.error('Failed to update status:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = (task: any) => {
    setOpenMenuId(null);
    setDuplicateTask(task);
  };

  const handleDelete = async (taskId: string) => {
    if (!token) return;
    setSaving(true);
    try {
      await api.tasks.delete(taskId, token);
      setConfirmDeleteId(null);
      setOpenMenuId(null);
      await refresh();
    } catch (err: any) {
      console.error('Failed to delete task:', err);
    } finally {
      setSaving(false);
    }
  };

  const openViewModal = (task: any) => {
    setViewTaskId(task.id);
    setOpenMenuId(null);
  };

  const handleEditFromDrawer = (task: any) => {
    setViewTaskId(null);
    setTaskModal({ mode: 'edit', task });
  };

  const handleOpenTaskCenter = (taskId: string) => {
    setViewTaskId(null);
    window.open(`/dashboard/tasks?taskId=${taskId}`, '_blank');
  };

  const openEditModal = (task: any) => {
    setTaskModal({ mode: 'edit', task });
    setOpenMenuId(null);
  };

  const [addSubtaskParent, setAddSubtaskParent] = useState<any>(null);

  const openAddSubtask = (task: any) => {
    setAddSubtaskParent(task);
    setOpenMenuId(null);
  };

  const handleModalSave = async (data: any): Promise<boolean> => {
    if (!token) return false;
    setSaving(true);
    try {
      if (taskModal?.mode === 'add') {
        console.log('Parent: creating task');
        await api.tasks.create({ ...data, projectId }, token);
      } else if (taskModal?.mode === 'edit' && taskModal.task) {
        console.log('Parent: updating task', taskModal.task.id);
        // Strip fields not in UpdateTaskDto (backend ValidationPipe forbids non-whitelisted)
        const { projectId, reporterId, checklist, ...updatePayload } = data;
        await api.tasks.update(taskModal.task.id, updatePayload, token);
        // Sync checklist items for edited task
        if (data.checklist && data.checklist.length > 0) {
          for (const item of data.checklist) {
            try {
              if (!item.id) {
                await api.tasks.addChecklist(taskModal.task.id, item.title, token);
              } else {
                await api.tasks.toggleChecklist(taskModal.task.id, item.id, item.completed, token);
              }
            } catch {}
          }
        }
      }
      console.log('Parent: save successful, refreshing...');
      setTaskModal(null);
      await refresh();
      return true;
    } catch (err: any) {
      console.error('Parent: Failed to save task:', err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getAssigneeName = (assigneeId: string) => {
    if (!assigneeId || !users) return null;
    const user = users.find((u: any) => u.id === assigneeId);
    if (!user) return null;
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Tasks ({tasks.length})</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setTaskModal({ mode: 'add', task: { projectId } })}>
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </button>
      </div>

      <div className="space-y-2">
        {(() => {
          // Sort: parents first, interleaved with subtasks
          const sorted = [...tasks].sort((a, b) => {
            const aParent = a.parentTaskId || '';
            const bParent = b.parentTaskId || '';
            // Root tasks by position, subtasks grouped under parent
            if (!aParent && !bParent) return (a.position || 0) - (b.position || 0);
            if (!aParent && bParent) {
              // a is root, b is subtask — if b's parent is a, b goes after a
              if (b.parentTaskId === a.id) return -1;
              return (a.position || 0) - (tasks.find((t: any) => t.id === b.parentTaskId)?.position || 0);
            }
            if (aParent && !bParent) {
              if (a.parentTaskId === b.id) return 1;
              return (tasks.find((t: any) => t.id === aParent)?.position || 0) - (b.position || 0);
            }
            // Both subtasks — sort by parent position, then own position
            const aRoot = tasks.find((t: any) => t.id === aParent);
            const bRoot = tasks.find((t: any) => t.id === bParent);
            if (aRoot && bRoot && aRoot.id !== bRoot.id) return (aRoot.position || 0) - (bRoot.position || 0);
            return (a.position || 0) - (b.position || 0);
          });
          return sorted.map((task: any) => (
          <div
            key={task.id}
            className={`card p-3 flex items-center gap-3 relative cursor-pointer hover:bg-muted/50 transition-colors ${task.parentTaskId ? 'ml-8 bg-secondary/30 border-l-2 border-l-purple-500/40' : ''}`}
            onDoubleClick={() => openEditModal(task)}
          >
            {task.parentTaskId && (
              <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-2 h-[1px] bg-purple-500/40" />
            )}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.parentTaskId ? 'bg-purple-500/60' : statusColors[task.status] || 'bg-gray-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{task.title}</p>
                {tasks.filter((t: any) => t.parentTaskId === task.id).length > 0 && (
                  <span className="text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                    <GitBranch className="w-2.5 h-2.5" />
                    {tasks.filter((t: any) => t.parentTaskId === task.id).length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{task.taskCode}</span>
                {getAssigneeName(task.assigneeId) && (
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" /> {getAssigneeName(task.assigneeId)}
                  </span>
                )}
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
              {task.completionPercentage !== undefined && task.completionPercentage !== null && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, task.completionPercentage))}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{task.completionPercentage}%</span>
                </div>
              )}
            </div>
            <span className="badge badge-sm">{task.priority}</span>
            <span className={`badge badge-sm ${statusColors[task.status]?.replace('bg-', 'badge-') || ''}`}>{task.status?.replace('_', ' ')}</span>

            {/* Three-dot menu */}
            <div className="relative flex-shrink-0">
              <button
                className="p-1 hover:bg-muted rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === task.id ? null : task.id);
                  setOpenStatusId(null);
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {openMenuId === task.id && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border rounded-lg shadow-lg z-10 py-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => openViewModal(task)}
                  >
                    <Eye className="w-4 h-4" /> View Task
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => openEditModal(task)}
                  >
                    <Edit3 className="w-4 h-4" /> Edit Task
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => handleDuplicate(task)}
                  >
                    <Copy className="w-4 h-4" /> Duplicate Task
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => openAddSubtask(task)}
                  >
                    <Plus className="w-4 h-4" /> Add Subtask
                  </button>

                  {/* Change Status submenu */}
                  <div className="relative">
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 justify-between"
                      onClick={() => setOpenStatusId(openStatusId === task.id ? null : task.id)}
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Change Status
                      </span>
                    </button>
                    {openStatusId === task.id && (
                      <div className="absolute right-full top-0 mr-1 w-40 bg-card border rounded-lg shadow-lg z-10 py-1">
                        {STATUS_OPTIONS.map((status: string) => (
                          <button
                            key={status}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={saving}
                            onClick={() => handleStatusChange(task.id, status)}
                          >
                            <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                            {status.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t my-1" />
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 text-red-500"
                    onClick={() => {
                      setOpenMenuId(null);
                      setConfirmDeleteId(task.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" /> Delete Task
                  </button>
                </div>
              )}
            </div>

            {/* Delete confirmation dialog */}
            {confirmDeleteId === task.id && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold">Delete Task</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
                  <div className="flex justify-end gap-2">
                    <button className="btn btn-ghost" disabled={saving} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                    <button className="btn btn-primary bg-red-500 hover:bg-red-600" disabled={saving} onClick={() => handleDelete(task.id)}>
                      {saving ? 'Deleting...' : 'OK'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))})()}
        {tasks.length === 0 && <p className="text-center text-muted-foreground py-8">No tasks yet</p>}
      </div>

      {/* TaskModal - only for add/edit modes */}
      {taskModal && taskModal.mode !== 'view' && (
        <TaskModal
          isOpen={!!taskModal}
          mode={taskModal.mode as 'add' | 'edit' | 'view'}
          task={taskModal.task}
          users={users}
          token={token}
          projectId={projectId}
          parentTasks={tasks}
          onClose={() => setTaskModal(null)}
          onSave={handleModalSave}
        />
      )}

      {/* TaskDetailDrawer for view mode */}
      {viewTaskId && (
        <TaskDetailDrawer
          isOpen={!!viewTaskId}
          onClose={() => setViewTaskId(null)}
          onEdit={handleEditFromDrawer}
          onDuplicate={(task) => {
            setViewTaskId(null);
            setDuplicateTask(task);
          }}
          onOpenTaskCenter={handleOpenTaskCenter}
          taskId={viewTaskId}
          token={token}
        />
      )}

      {/* Duplicate Task Modal */}
      {duplicateTask && (
        <DuplicateTaskModal
          isOpen={!!duplicateTask}
          onClose={() => setDuplicateTask(null)}
          onSuccess={async () => {
            await refresh();
          }}
          task={duplicateTask}
          projectId={projectId}
          token={token}
          users={users}
        />
      )}

      {/* Add Subtask Modal */}
      {addSubtaskParent && (
        <AddSubtaskModal
          isOpen={!!addSubtaskParent}
          onClose={() => setAddSubtaskParent(null)}
          onSuccess={async () => {
            await refresh();
          }}
          parentTask={{
            id: addSubtaskParent.id,
            title: addSubtaskParent.title,
            taskCode: addSubtaskParent.taskCode || '',
            projectId: projectId || '',
            projectName: project?.name,
          }}
          token={token}
          users={users}
        />
      )}

      {/* Click-away handler for menus */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setOpenMenuId(null);
            setOpenStatusId(null);
          }}
        />
      )}
    </div>
  );
}

/* ============ TIMELINE TAB ============ */
function TimelineTab({ project, tasks }: any) {
  const events = [
    { date: project?.startDate, title: 'Project Start', type: 'start' },
    ...tasks.map((t: any) => ({ date: t.dueDate || t.createdAt, title: t.title, type: 'task', status: t.status })),
    { date: project?.endDate, title: 'Target Go Live', type: 'end' },
  ].filter((e: any) => e.date).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Project Timeline</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {events.map((event: any, i: number) => (
            <div key={i} className="flex items-start gap-4 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                event.type === 'start' ? 'bg-green-500 text-white' :
                event.type === 'end' ? 'bg-red-500 text-white' :
                event.status === 'done' ? 'bg-blue-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {event.type === 'start' ? '▶' : event.type === 'end' ? '🏁' : '📋'}
              </div>
              <div className="card p-3 flex-1">
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ RESOURCES TAB ============ */
function ResourcesTab({ overview }: any) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Project Resources</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{overview?.team_size || 0}</p>
          <p className="text-xs text-muted-foreground">Team Members</p>
        </div>
        <div className="card p-4 text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{overview?.completed_tasks || 0}</p>
          <p className="text-xs text-muted-foreground">Tasks Completed</p>
        </div>
        <div className="card p-4 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{overview?.in_progress_tasks || 0}</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
      </div>
      <div className="card p-4">
        <p className="text-sm text-muted-foreground">Resource allocation details will be available here.</p>
      </div>
    </div>
  );
}

/* ============ MEETINGS TAB ============ */
function MeetingsTab({ meetings }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Meetings ({meetings.length})</h3>
        <button className="btn btn-primary btn-sm"><Plus className="w-4 h-4 mr-1" /> Schedule</button>
      </div>
      {meetings.length === 0 ? (
        <div className="card p-8 text-center text-muted-foreground">No meetings scheduled</div>
      ) : (
        <div className="space-y-2">
          {meetings.map((m: any) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(m.meetingDate || m.date)} • {m.status}</p>
                </div>
                <span className="badge">{m.meetingType || m.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ ISSUES TAB ============ */
function IssuesTab({ issues }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Issues ({issues.length})</h3>
        <button className="btn btn-primary btn-sm"><Plus className="w-4 h-4 mr-1" /> Report Issue</button>
      </div>
      {issues.length === 0 ? (
        <div className="card p-8 text-center text-muted-foreground">No issues reported</div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue: any) => (
            <div key={issue.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{issue.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{issue.description?.substring(0, 100)}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`badge badge-${issue.severity === 'critical' ? 'red' : issue.severity === 'high' ? 'orange' : 'blue'}`}>{issue.severity}</span>
                  <span className="badge">{issue.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ RISKS TAB ============ */
function RisksTab({ risks }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Risks ({risks.length})</h3>
        <button className="btn btn-primary btn-sm"><Plus className="w-4 h-4 mr-1" /> Add Risk</button>
      </div>
      {risks.length === 0 ? (
        <div className="card p-8 text-center text-muted-foreground">No risks identified</div>
      ) : (
        <div className="space-y-2">
          {risks.map((risk: any) => (
            <div key={risk.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{risk.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{risk.description?.substring(0, 100)}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`badge badge-${risk.severity === 'critical' ? 'red' : risk.severity === 'high' ? 'orange' : 'blue'}`}>{risk.severity}</span>
                  <span className="badge">{risk.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ CHANGE REQUESTS TAB ============ */
function ChangeRequestsTab({ changeRequests }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Change Requests ({changeRequests.length})</h3>
        <button className="btn btn-primary btn-sm"><Plus className="w-4 h-4 mr-1" /> New Request</button>
      </div>
      {changeRequests.length === 0 ? (
        <div className="card p-8 text-center text-muted-foreground">No change requests</div>
      ) : (
        <div className="space-y-2">
          {changeRequests.map((cr: any) => (
            <div key={cr.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{cr.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{cr.description?.substring(0, 100)}</p>
                </div>
                <span className="badge">{cr.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ DOCUMENTS TAB ============ */
function DocumentsTab({ documents }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Documents ({documents.length})</h3>
        <button className="btn btn-primary btn-sm"><Plus className="w-4 h-4 mr-1" /> Upload</button>
      </div>
      {documents.length === 0 ? (
        <div className="card p-8 text-center text-muted-foreground">No documents uploaded</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc: any) => (
            <div key={doc.id} className="card p-4 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.title || doc.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ FINANCIAL TAB ============ */
function FinancialTab({ project, budget }: any) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Financial Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Contract Value</p>
          <p className="text-xl font-bold">{formatCurrency(project.contractValue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Budget</p>
          <p className="text-xl font-bold">{formatCurrency(project.budget)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Actual Cost</p>
          <p className="text-xl font-bold">{formatCurrency(project.actualCost)}</p>
        </div>
      </div>
      <div className="card p-4">
        <h4 className="font-semibold mb-3">Budget Entries ({budget.length})</h4>
        {budget.length === 0 ? (
          <p className="text-sm text-muted-foreground">No budget entries</p>
        ) : (
          <div className="space-y-2">
            {budget.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{entry.description || entry.category}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                </div>
                <span className="font-semibold">{formatCurrency(entry.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ REPORTS TAB ============ */
function ReportsTab({ project, overview }: any) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Project Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h4 className="font-semibold mb-2">Executive Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span>{project.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="capitalize">{project.status?.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Health</span><span className="capitalize">{project.health}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Progress</span><span>{project.completionPercentage}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Budget Usage</span>
              <span>{project.budget > 0 ? ((Number(project.actualCost) / Number(project.budget)) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <h4 className="font-semibold mb-2">Key Metrics</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Tasks</span><span>{overview?.total_tasks || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span>{overview?.completed_tasks || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Open Issues</span><span>{overview?.open_issues || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Open Risks</span><span>{overview?.open_risks || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Team Size</span><span>{overview?.team_size || 0}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ ACTIVITY LOG TAB ============ */
function ActivityTab({ projectId }: any) {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    // Load activity logs
    api.audit.list({ projectId, limit: 50 }, '').then((res: any) => {
      setActivities(res.data || res || []);
    }).catch(() => {
      setActivities([]);
    });
  }, [projectId]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Activity Log</h3>
      {activities.length === 0 ? (
        <div className="card p-8 text-center text-muted-foreground">No activity recorded</div>
      ) : (
        <div className="space-y-2">
          {activities.map((log: any, i: number) => (
            <div key={log.id || i} className="card p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {(log.userName || log.user_id || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm">{log.action || log.description || log.message}</p>
                <p className="text-xs text-muted-foreground">{formatDate(log.createdAt || log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
