'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ChevronRight, ChevronDown, Plus, Eye, Edit3, Copy, Trash2,
  MoreVertical, Calendar, GitBranch, Clock, User as UserIcon,
  AlertTriangle
} from 'lucide-react';
import TaskModal from '@/components/tasks/TaskModal';
import TaskDetailDrawer from '@/components/tasks/TaskDetailDrawer';
import DuplicateTaskModal from '@/components/tasks/DuplicateTaskModal';
import AddSubtaskModal from '@/components/tasks/AddSubtaskModal';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  taskType?: string;
  taskCode?: string;
  assigneeId?: string;
  dueDate?: string;
  completionPercentage?: number;
  parentTaskId?: string;
  position?: number;
  level?: number;
  [key: string]: any;
}

interface TaskTreeProps {
  tasks: Task[];
  projectId: string;
  token: string;
  users?: any[];
  onTaskUpdated?: () => void;
}

interface TreeNode extends Task {
  children: TreeNode[];
  depth: number;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-gray-500',
  todo: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  review: 'bg-purple-500',
  testing: 'bg-orange-500',
  done: 'bg-green-500',
  blocked: 'bg-red-500',
  cancelled: 'bg-gray-400',
};

const STATUS_OPTIONS = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'];

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function countDescendants(node: TreeNode): number {
  let n = node.children.length;
  for (const c of node.children) n += countDescendants(c);
  return n;
}

function countAll(nodes: TreeNode[]): number {
  let n = 0;
  for (const node of nodes) { n++; n += countAll(node.children); }
  return n;
}

function buildTree(tasks: Task[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const t of tasks) map.set(t.id, { ...t, children: [], depth: 0 });

  const roots: TreeNode[] = [];
  for (const t of tasks) {
    const node = map.get(t.id)!;
    if (t.parentTaskId && map.has(t.parentTaskId)) {
      map.get(t.parentTaskId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.taskCode ?? '').localeCompare(b.taskCode ?? ''));
    for (const n of nodes) sort(n.children);
  };
  sort(roots);

  const setDepth = (nodes: TreeNode[], d: number) => {
    for (const n of nodes) { n.depth = d; setDepth(n.children, d + 1); }
  };
  setDepth(roots, 0);

  return roots;
}

function flatten(nodes: TreeNode[], expanded: Set<string>): TreeNode[] {
  const out: TreeNode[] = [];
  for (const n of nodes) {
    out.push(n);
    if (expanded.has(n.id) && n.children.length) out.push(...flatten(n.children, expanded));
  }
  return out;
}

function getAssigneeName(id?: string, users?: any[]) {
  if (!id || !users) return null;
  const u = users.find(x => x.id === id);
  if (!u) return null;
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || null;
}

export default function TaskTree({ tasks, projectId, token, users = [], onTaskUpdated }: TaskTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [taskModal, setTaskModal] = useState<{ mode: string; task?: any } | null>(null);
  const [viewTaskId, setViewTaskId] = useState<string | null>(null);
  const [duplicateTask, setDuplicateTask] = useState<any>(null);
  const [addSubtaskParent, setAddSubtaskParent] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (onTaskUpdated) await onTaskUpdated();
  }, [onTaskUpdated]);

  const treeRoots = useMemo(() => buildTree(tasks), [tasks]);

  // Auto-expand all nodes that have children when tasks change
  useMemo(() => {
    const ids = new Set<string>();
    const walk = (ns: TreeNode[]) => { for (const n of ns) { if (n.children.length) { ids.add(n.id); walk(n.children); } } };
    walk(treeRoots);
    setExpanded(ids);
  }, [tasks]);

  const flatList = useMemo(() => flatten(treeRoots, expanded), [treeRoots, expanded]);

  const toggle = useCallback((id: string) => {
    setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const handleStatusChange = async (taskId: string, status: string) => {
    if (!token || saving) return;
    setSaving(true);
    try {
      const { api } = await import('@/lib/api');
      await api.tasks.update(taskId, { status }, token);
      setOpenMenuId(null);
      await refresh();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (taskId: string) => {
    if (!token || saving) return;
    setSaving(true);
    try {
      const { api } = await import('@/lib/api');
      await api.tasks.delete(taskId, token);
      setConfirmDeleteId(null);
      await refresh();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleModalSave = async (data: any): Promise<boolean> => {
    if (!token) return false;
    setSaving(true);
    try {
      const { api } = await import('@/lib/api');
      if (taskModal?.mode === 'add') {
        await api.tasks.create({ ...data, projectId }, token);
      } else if (taskModal?.mode === 'edit' && taskModal.task) {
        const { projectId: _p, reporterId, checklist, ...rest } = data;
        await api.tasks.update(taskModal.task.id, rest, token);
        if (checklist?.length) {
          for (const item of checklist) {
            try {
              if (!item.id) await api.tasks.addChecklist(taskModal.task.id, item.title, token);
              else await api.tasks.toggleChecklist(taskModal.task.id, item.id, item.completed, token);
            } catch {}
          }
        }
      }
      setTaskModal(null);
      await refresh();
      return true;
    } catch (e) { console.error(e); return false; }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Tasks ({countAll(treeRoots)})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setTaskModal({ mode: 'add' })}>
            <Plus className="w-4 h-4 mr-1" /> Add Task
          </button>
        </div>

        <div className="border border-border rounded-lg divide-y divide-border">
          {flatList.map(task => (
            <div
              key={task.id}
              className="relative"
              onDoubleClick={() => setTaskModal({ mode: 'edit', task })}
            >
              {/* Indentation + Connector lines */}
              <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-muted/30 transition-colors group">
                {/* Ind spacers */}
                {Array.from({ length: task.depth }).map((_, i) => (
                  <span key={i} className="w-5 flex-shrink-0" />
                ))}

                {/* Expand/Collapse */}
                <button
                  className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-muted/60 ${!task.children.length ? 'invisible' : ''}`}
                  onClick={() => task.children.length && toggle(task.id)}
                >
                  {task.children.length > 0 && (
                    expanded.has(task.id)
                      ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>

                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[task.status] ?? 'bg-gray-500'}`} />

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate cursor-pointer">{task.title}</span>
                    {task.children.length > 0 && (
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                        <GitBranch className="w-2.5 h-2.5" />
                        {countDescendants(task)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono text-[11px]">{task.taskCode}</span>
                    {getAssigneeName(task.assigneeId, users) && (
                      <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {getAssigneeName(task.assigneeId, users)}</span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(task.dueDate)}</span>
                    )}
                  </div>
                  {task.completionPercentage != null && task.completionPercentage > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-20">
                        <div className="h-full bg-foreground/60 rounded-full" style={{ width: `${Math.min(100, task.completionPercentage)}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{Math.round(task.completionPercentage)}%</span>
                    </div>
                  )}
                </div>

                {/* Badges + Menu */}
                <span className="badge badge-sm capitalize hidden sm:inline-flex">{task.priority}</span>
                <span className="badge badge-sm hidden sm:inline-flex">{task.status?.replace('_', ' ')}</span>

                <div className="relative flex-shrink-0">
                  <button
                    className="p-1.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {openMenuId === task.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-xl z-50 py-1" onClick={e => e.stopPropagation()}>
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2" onClick={() => { setViewTaskId(task.id); setOpenMenuId(null); }}><Eye className="w-4 h-4" /> View</button>
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2" onClick={() => { setTaskModal({ mode: 'edit', task }); setOpenMenuId(null); }}><Edit3 className="w-4 h-4" /> Edit</button>
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2" onClick={() => { setDuplicateTask(task); setOpenMenuId(null); }}><Copy className="w-4 h-4" /> Duplicate</button>
                      {(task.level ?? 0) < 3 && (
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2" onClick={() => { setAddSubtaskParent(task); setOpenMenuId(null); }}><Plus className="w-4 h-4" /> Add Subtask</button>
                      )}
                      <div className="border-t border-border my-1" />
                      {STATUS_OPTIONS.map(s => (
                        <button key={s} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2" onClick={() => handleStatusChange(task.id, s)}>
                          <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]}`} />
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                      <div className="border-t border-border my-1" />
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 text-red-400" onClick={() => { setConfirmDeleteId(task.id); setOpenMenuId(null); }}><Trash2 className="w-4 h-4" /> Delete</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Delete confirmation */}
              {confirmDeleteId === task.id && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h3 className="font-semibold">Delete Task</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">Are you sure? This cannot be undone.</p>
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                      <button className="btn btn-primary bg-red-500 hover:bg-red-600" onClick={() => handleDelete(task.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {tasks.length === 0 && <p className="text-center text-muted-foreground py-8">No tasks yet</p>}
        </div>
      </div>

      {/* Modals */}
      {taskModal && taskModal.mode !== 'view' && (
        <TaskModal
          isOpen={!!taskModal}
          mode={taskModal.mode as any}
          task={taskModal.task}
          users={users}
          token={token}
          projectId={projectId}
          parentTasks={tasks}
          onClose={() => setTaskModal(null)}
          onSave={handleModalSave}
        />
      )}
      {viewTaskId && (
        <TaskDetailDrawer
          isOpen={!!viewTaskId}
          onClose={() => setViewTaskId(null)}
          onEdit={(t: any) => { setViewTaskId(null); setTaskModal({ mode: 'edit', task: t }); }}
          onDuplicate={(t: any) => { setViewTaskId(null); setDuplicateTask(t); }}
          onOpenTaskCenter={(id: string) => window.open(`/dashboard/tasks?taskId=${id}`, '_blank')}
          taskId={viewTaskId}
          token={token}
        />
      )}
      {duplicateTask && (
        <DuplicateTaskModal
          isOpen={!!duplicateTask}
          onClose={() => setDuplicateTask(null)}
          onSuccess={refresh}
          task={duplicateTask}
          projectId={projectId}
          token={token}
          users={users}
        />
      )}
      {addSubtaskParent && (
        <AddSubtaskModal
          isOpen={!!addSubtaskParent}
          onClose={() => setAddSubtaskParent(null)}
          onSuccess={refresh}
          parentTask={{ id: addSubtaskParent.id, title: addSubtaskParent.title, taskCode: addSubtaskParent.taskCode ?? '', projectId }}
          token={token}
          users={users}
        />
      )}
    </>
  );
}
