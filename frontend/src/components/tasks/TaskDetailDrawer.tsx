'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Hash,
  FileText,
  Target,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Paperclip,
  MessageSquare,
  Activity,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Plus,
  User as UserIcon,
  File as FileIcon,
  Image as ImageIcon,
  FileSpreadsheet,
  FileText as PdfIcon,
  GitBranch,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import AddSubtaskModal from '@/components/tasks/AddSubtaskModal';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface TaskDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: any) => void;
  onDuplicate?: (task: any) => void;
  onAddSubtask?: (task: any) => void;
  onOpenTaskCenter: (taskId: string) => void;
  onTaskUpdated?: () => void;
  taskId: string;
  token: string;
  users?: any[];
  breadcrumb?: any[];
}

interface TaskDetail {
  id: string;
  taskCode: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  taskType?: string;
  assigneeId?: string;
  reporterId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  completionPercentage?: number;
  parentTaskId?: string;
  labels?: string[];
  dependsOn?: string[];
  storyPoints?: number;
  projectId?: string;
  projectName?: string;
  projectCode?: string;
  assignee?: { firstName: string; lastName: string; avatar?: string; id?: string } | null;
  reporter?: { firstName: string; lastName: string; avatar?: string; id?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { first_name: string; last_name: string; avatar_url?: string };
}

interface ActivityItem {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  metadata?: any;
  created_at: string;
  user?: { first_name: string; last_name: string; avatar_url?: string };
}

interface Subtask {
  id: string;
  title: string;
  taskCode?: string;
  status: string;
  completionPercentage?: number;
  dueDate?: string;
  assignee?: { firstName: string; lastName: string; avatar?: string } | null;
}

interface Attachment {
  id: string;
  name: string;
  fileType?: string;
  fileSize?: number;
  createdAt?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-gray-500/20 text-gray-400',
  todo: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  review: 'bg-purple-500/20 text-purple-400',
  testing: 'bg-orange-500/20 text-orange-400',
  done: 'bg-green-500/20 text-green-400',
  blocked: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  testing: 'Testing',
  done: 'Done',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-blue-500/20 text-blue-400',
  low: 'bg-gray-500/20 text-gray-400',
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeIcon(fileType?: string) {
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf')) return <PdfIcon className="h-5 w-5 text-red-400" />;
  if (type.includes('image') || type.includes('img')) return <ImageIcon className="h-5 w-5 text-blue-400" />;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv') || type.includes('xls'))
    return <FileSpreadsheet className="h-5 w-5 text-green-400" />;
  if (type.includes('word') || type.includes('doc'))
    return <FileText className="h-5 w-5 text-blue-500" />;
  return <FileIcon className="h-5 w-5 text-muted-foreground" />;
}

function getStatusBadge(status?: string) {
  const s = status || 'backlog';
  const colorClass = STATUS_COLORS[s] || STATUS_COLORS.backlog;
  const label = STATUS_LABELS[s] || s;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function getPriorityBadge(priority?: string) {
  const p = priority || 'medium';
  const colorClass = PRIORITY_COLORS[p] || PRIORITY_COLORS.medium;
  const label = PRIORITY_LABELS[p] || p;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ user, size = 'sm' }: { user?: { firstName?: string; lastName?: string; avatar?: string; first_name?: string; last_name?: string; avatar_url?: string } | null; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';
  const firstName = user?.firstName || user?.first_name;
  const lastName = user?.lastName || user?.last_name;
  const avatar = user?.avatar || user?.avatar_url;
  const name = `${firstName || ''} ${lastName || ''}`.trim();

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name || 'User'}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium`}
    >
      {getInitials(name) || <UserIcon className="h-3.5 w-3.5" />}
    </div>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
      <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
        {percentage}%
      </span>
    </div>
  );
}

// ─── Descendant Tree (recursive) ───────────────────────────────────────────

interface DescendantTreeProps {
  descendants: any[];
  users: any[];
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onAddSubtask: (parentTask: any) => void;
}

function DescendantTree({ descendants, users, expandedIds, onToggle, onAddSubtask }: DescendantTreeProps) {
  // Build children map from flat descendant list
  const childrenMap = new Map<string, any[]>();
  const allIds = new Set<string>();

  for (const d of descendants) {
    allIds.add(d.id);
    const parentId = d.parent_task_id;
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
    childrenMap.get(parentId)!.push(d);
  }

  // Sort children by position then created_at
  for (const [, children] of childrenMap) {
    children.sort((a, b) => (a.position || 0) - (b.position || 0) || (a.created_at || '').localeCompare(b.created_at || ''));
  }

  // Level colors matching TaskTree
  const LEVEL_COLORS: Record<number, string> = {
    0: 'text-purple-400',
    1: 'text-blue-400',
    2: 'text-green-400',
    3: 'text-orange-400',
    4: 'text-gray-400',
  };

  // Recursive render
  const renderNode = (node: any, depth: number) => {
    const children = childrenMap.get(node.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const indentPx = depth * 20;
    const colorClass = LEVEL_COLORS[depth] || LEVEL_COLORS[4];

    const assigneeName = node.assignee_first_name
      ? `${node.assignee_first_name} ${node.assignee_last_name || ''}`.trim()
      : null;

    return (
      <div key={node.id} style={{ marginLeft: `${indentPx}px` }}>
        <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/30 border border-border/40 hover:border-primary/30 transition-colors group mb-1">
          {/* Expand/Collapse */}
          <button
            className={`w-5 h-5 flex items-center justify-center rounded hover:bg-muted/50 flex-shrink-0 ${!hasChildren ? 'invisible' : ''}`}
            onClick={() => onToggle(node.id)}
          >
            {hasChildren ? (
              isExpanded
                ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            )}
          </button>

          {/* Level indicator */}
          <div className={`w-1 h-4 rounded-full flex-shrink-0 ${colorClass.replace('text-', 'bg-')}`} />

          {/* Task info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {node.task_code && (
                <span className="text-[10px] text-muted-50 font-mono">{node.task_code}</span>
              )}
              <span className="text-sm font-medium truncate">{node.title}</span>
              {hasChildren && (
                <span className="text-[9px] bg-muted/50 text-muted-foreground px-1 py-0.5 rounded-full tabular-nums">
                  {children.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {getStatusBadge(node.status)}
              <span className="text-[10px] text-muted-foreground">{Math.round(node.completion_percentage || 0)}%</span>
              {assigneeName && (
                <div className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{assigneeName}</span>
                </div>
              )}
              {node.due_date && (
                <span className="text-[10px] text-muted-foreground">{formatDate(node.due_date)}</span>
              )}
            </div>
            {/* Mini progress bar */}
            <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden w-32">
              <div
                className={`h-full rounded-full ${(node.completion_percentage || 0) >= 100 ? 'bg-green-500' : (node.completion_percentage || 0) > 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, node.completion_percentage || 0))}%` }}
              />
            </div>
          </div>

          {/* Inline actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
            <button
              className="p-1 hover:bg-muted rounded"
              title="Add Subtask"
              onClick={(e) => { e.stopPropagation(); onAddSubtask(node); }}
            >
              <Plus className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Render children if expanded */}
        {isExpanded && children.length > 0 && (
          <div className="border-l-2 border-border/30 ml-[18px] pl-1">
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Root-level descendants (those whose parent is the main task, not in the descendants list)
  // The "root" of the subtree = tasks whose parent_task_id is the opened task ID
  // Since we don't have the parent ID here, we find nodes that are depth=1 or whose parent is NOT in the descendants
  const rootNodes = descendants.filter(d => {
    // Root nodes: their parent is not in the descendants list (i.e., parent is the opened task itself)
    return !allIds.has(d.parent_task_id || '');
  });

  if (rootNodes.length === 0) {
    // Fallback: treat all as flat
    return <>{descendants.map(d => renderNode(d, 0))}</>;
  }

  return (
    <div className="space-y-0.5">
      {rootNodes.map(node => renderNode(node, 0))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TaskDetailDrawer({
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onAddSubtask,
  onOpenTaskCenter,
  onTaskUpdated,
  taskId,
  token,
  users: usersProp,
  breadcrumb,
}: TaskDetailDrawerProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [descTreeExpanded, setDescTreeExpanded] = useState<Set<string>>(new Set());
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [parentTaskName, setParentTaskName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [addSubtaskParent, setAddSubtaskParent] = useState<any>(null);
  const [users, setUsers] = useState<any[]>(usersProp || []);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Fetch users if not provided via prop
  useEffect(() => {
    if (users.length === 0 && token && isOpen) {
      api.users.list({}, token).then((res: any) => {
        const userData = Array.isArray(res) ? res : res?.data || [];
        setUsers(userData);
      }).catch(() => {});
    }
  }, [token, isOpen, users.length]);

  // Fetch all data
  const fetchTaskData = useCallback(async () => {
    if (!taskId || !token || !isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const [taskData, checklistData, commentsData, activitiesData, subtasksData] =
        await Promise.all([
          api.tasks.get(taskId, token),
          api.tasks.checklist(taskId, token).catch(() => []),
          api.tasks.comments(taskId, token).catch(() => []),
          api.tasks.activity(taskId, token).catch(() => []),
          api.tasks.descendants(taskId, token).catch(() => []),
        ]);

      setTask(taskData as TaskDetail);
      setChecklist(Array.isArray(checklistData) ? checklistData : []);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      // Store ALL descendants as a flat list — tree is built in render
      const descResult = subtasksData as any;
      setSubtasks(Array.isArray(descResult) ? descResult : []);

      // Set parent task name if applicable
      const taskDetail = taskData as TaskDetail;
      if (taskDetail?.parentTaskId) {
        try {
          const parent = await api.tasks.get(taskDetail.parentTaskId, token);
          setParentTaskName((parent as TaskDetail)?.title || '');
        } catch {
          setParentTaskName('');
        }
      } else {
        setParentTaskName('');
      }

      // Fetch attachments from documents API if project exists
      if (taskDetail?.projectId) {
        try {
          const docsData = (await api.documents.list(
            { projectId: taskDetail.projectId, taskId },
            token
          )) as any;
          const docsList = Array.isArray(docsData) ? docsData : docsData?.data || [];
          setAttachments(
            docsList.map((doc: any) => ({
              id: doc.id,
              name: doc.name || doc.fileName || 'Unknown',
              fileType: doc.fileType || doc.mimeType,
              fileSize: doc.fileSize || doc.size,
              createdAt: doc.createdAt || doc.created_at,
            }))
          );
        } catch {
          setAttachments([]);
        }
      } else {
        setAttachments([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  }, [taskId, token, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchTaskData();
    } else {
      // Reset state when closed
      setTask(null);
      setChecklist([]);
      setComments([]);
      setActivities([]);
      setSubtasks([]);
      setAttachments([]);
      setParentTaskName('');
      setError(null);
    }
  }, [isOpen, fetchTaskData]);

  // Auto-expand all descendant nodes when data loads
  useEffect(() => {
    if (subtasks.length > 0) {
      const allIds = new Set(subtasks.map((s: any) => s.id));
      setDescTreeExpanded(allIds);
    }
  }, [subtasks.length]);

  // Animation visibility
  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation after mount
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-refresh task data every 3 seconds while drawer is open (to catch subtask changes)
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetchTaskData();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, fetchTaskData]);

  // Copy task ID
  const handleCopyId = async () => {
    if (!task?.taskCode) return;
    try {
      await navigator.clipboard.writeText(task.taskCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = task.taskCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Format activity description
  const formatActivityDescription = (activity: ActivityItem): string => {
    const action = activity.action || '';
    const field = activity.field_changed || '';
    const oldVal = activity.old_value || '';
    const newVal = activity.new_value || '';

    switch (action) {
      case 'status_changed':
      case 'Status Changed':
        return `Status Changed: from ${STATUS_LABELS[oldVal] || oldVal} to ${STATUS_LABELS[newVal] || newVal}`;
      case 'assignee_changed':
      case 'Assignee Changed':
        return 'Assignee Changed';
      case 'priority_changed':
      case 'Priority Updated':
        return `Priority Updated: from ${PRIORITY_LABELS[oldVal] || oldVal} to ${PRIORITY_LABELS[newVal] || newVal}`;
      case 'due_date_updated':
      case 'Due Date Updated':
        return `Due Date Updated${newVal ? ` to ${formatDate(newVal)}` : ''}`;
      case 'progress_updated':
      case 'Progress Updated':
        return `Progress Updated: ${newVal}%`;
      case 'Task Created':
      case 'created':
        return 'Task Created';
      case 'title_updated':
      case 'Title Updated':
        return 'Title Updated';
      case 'description_updated':
      case 'Description Updated':
        return 'Description Updated';
      case 'start_date_updated':
      case 'Start Date Updated':
        return `Start Date Updated${newVal ? ` to ${formatDate(newVal)}` : ''}`;
      case 'estimated_hours_updated':
      return `Estimated Hours Updated: ${newVal}h`;
      case 'actual_hours_updated':
      return `Actual Hours Updated: ${newVal}h`;
      case 'checklist_completed':
        return `Checklist item completed: ${activity.metadata?.title || ''}`;
      case 'checklist_added':
        return `Checklist item added: ${activity.metadata?.title || ''}`;
      case 'comment_added':
        return 'Comment added';
      case 'attachment_added':
        return 'Attachment added';
      default:
        if (field && oldVal && newVal) {
          return `${action}: from ${oldVal} to ${newVal}`;
        }
        return action || 'Activity';
    }
  };

  const getActivityIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('status')) return <Target className="h-4 w-4" />;
    if (a.includes('assignee')) return <Users className="h-4 w-4" />;
    if (a.includes('priority')) return <AlertCircle className="h-4 w-4" />;
    if (a.includes('due date') || a.includes('start date')) return <Calendar className="h-4 w-4" />;
    if (a.includes('progress')) return <Activity className="h-4 w-4" />;
    if (a.includes('checklist')) return <CheckCircle2 className="h-4 w-4" />;
    if (a.includes('comment')) return <MessageSquare className="h-4 w-4" />;
    if (a.includes('attachment')) return <Paperclip className="h-4 w-4" />;
    if (a.includes('created')) return <Plus className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (!isOpen) return null;

  const completedChecklist = checklist.filter((item) => item.completed).length;
  const totalChecklist = checklist.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Task Details"
      >
        {/* Header (sticky) */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Hash className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              {breadcrumb && breadcrumb.length > 1 && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                  {breadcrumb.map((b: any, i: number) => (
                    <span key={b.id} className="flex items-center gap-1">
                      {i > 0 && <span className="text-muted-foreground/40">›</span>}
                      <span className={i === breadcrumb.length - 1 ? 'text-foreground font-medium' : 'hover:underline cursor-pointer'}>
                        {b.title}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              <span className="font-semibold text-lg truncate block">
                {task?.taskCode || taskId}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost p-2 rounded-lg flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading task details...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={fetchTaskData}
                className="ml-auto text-sm text-red-400 hover:text-red-300 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && task && (
            <>
              {/* ─── GENERATION INFORMATION ─────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Generation Information
                </h3>
                <div className="space-y-3">
                  {/* Task ID (copyable) */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Task ID</span>
                    <button
                      onClick={handleCopyId}
                      className="flex items-center gap-1.5 text-sm font-mono hover:text-primary transition-colors"
                      title="Copy task code"
                    >
                      {task.taskCode}
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Task Name */}
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-muted-foreground flex-shrink-0">Task Name</span>
                    <span className="text-sm font-medium text-right">{task.title}</span>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted-foreground flex-shrink-0">Description</span>
                      <span className="text-sm text-right max-w-[60%] whitespace-pre-wrap">
                        {task.description}
                      </span>
                    </div>
                  )}

                  {/* Project Name */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Project</span>
                    <span className="text-sm">{task.projectName || '—'}</span>
                  </div>

                  {/* Parent Task */}
                  {task.parentTaskId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Parent Task</span>
                      <span className="text-sm">{parentTaskName || task.parentTaskId}</span>
                    </div>
                  )}

                  {/* Milestone */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Milestone</span>
                    <span className="text-sm">
                      {task.taskType === 'milestone' ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </section>

              {/* ─── STATUS ─────────────────────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getStatusBadge(task.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Priority</span>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                    </div>
                    <ProgressBar percentage={task.completionPercentage || 0} />
                  </div>
                </div>
              </section>

              {/* ─── ASSIGNMENT ─────────────────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Assignment
                </h3>
                <div className="space-y-3">
                  {/* Assignee */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assignee</span>
                    <div className="flex items-center gap-2">
                      <Avatar user={task.assignee} />
                      <span className="text-sm">
                        {task.assignee
                          ? `${task.assignee.firstName} ${task.assignee.lastName}`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Reporter */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reporter</span>
                    <div className="flex items-center gap-2">
                      <Avatar user={task.reporter} />
                      <span className="text-sm">
                        {task.reporter
                          ? `${task.reporter.firstName} ${task.reporter.lastName}`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">Team Members</span>
                    <div className="flex flex-wrap gap-2">
                      {task.assignee && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-full">
                          <Avatar user={task.assignee} size="sm" />
                          <span className="text-xs">
                            {task.assignee.firstName} {task.assignee.lastName}
                          </span>
                        </div>
                      )}
                      {task.reporter &&
                        task.reporter.id !== task.assignee?.id && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-full">
                            <Avatar user={task.reporter} size="sm" />
                            <span className="text-xs">
                              {task.reporter.firstName} {task.reporter.lastName}
                            </span>
                          </div>
                        )}
                      {!task.assignee && !task.reporter && (
                        <span className="text-sm text-muted-foreground">No team members assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* ─── PLANNING ───────────────────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Planning
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Start Date
                    </span>
                    <span className="text-sm">{formatDate(task.startDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Due Date
                    </span>
                    <span className="text-sm">{formatDate(task.dueDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Estimated Hours
                    </span>
                    <span className="text-sm">
                      {task.estimatedHours != null ? `${task.estimatedHours}h` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Actual Hours
                    </span>
                    <span className="text-sm">
                      {task.actualHours != null ? `${task.actualHours}h` : '—'}
                    </span>
                  </div>
                </div>
              </section>

              {/* ─── CHECKLIST ──────────────────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Checklist
                </h3>
                {totalChecklist === 0 ? (
                  <p className="text-sm text-muted-foreground">No checklist items</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      {completedChecklist}/{totalChecklist} completed
                    </p>
                    <div className="space-y-2">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 py-1.5"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm ${
                              item.completed
                                ? 'line-through text-muted-foreground'
                                : ''
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* ─── DESCENDANT TREE (recursive) ──────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Subtasks ({subtasks.length})
                  </h3>
                  <button
                    onClick={() => { setAddSubtaskParent(null); setShowAddSubtask(true); }}
                    className="btn btn-ghost text-xs h-7 px-2 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Subtask
                  </button>
                </div>

                {subtasks.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg">
                    <GitBranch className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No subtasks yet</p>
                    <button
                      onClick={() => setShowAddSubtask(true)}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      + Add first subtask
                    </button>
                  </div>
                ) : (
                  <DescendantTree
                    descendants={subtasks}
                    users={users}
                    expandedIds={descTreeExpanded}
                    onToggle={(id) => {
                      setDescTreeExpanded(prev => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id); else next.add(id);
                        return next;
                      });
                    }}
                    onAddSubtask={(parentNode) => {
                      setAddSubtaskParent(parentNode);
                      setShowAddSubtask(true);
                    }}
                  />
                )}
              </section>

              {/* ─── ATTACHMENTS ───────────────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Attachments
                </h3>
                {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attachments</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                      >
                        {getFileTypeIcon(file.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)} · {formatDate(file.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ─── COMMENTS ──────────────────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Comments
                </h3>
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar
                          user={{
                            firstName: comment.user?.first_name,
                            lastName: comment.user?.last_name,
                            avatar: comment.user?.avatar_url,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {comment.user?.first_name} {comment.user?.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ─── ACTIVITY LOG ──────────────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Activity Log
                </h3>
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded</p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                          {getActivityIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{formatActivityDescription(activity)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {activity.user && (
                              <span className="text-xs text-muted-foreground">
                                by {activity.user.first_name} {activity.user.last_name}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              · {formatDateTime(activity.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer (sticky) */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn btn-ghost">
            Close
          </button>
          {task && (
            <>
              <button
                onClick={() => { setAddSubtaskParent(null); setShowAddSubtask(true); }}
                className="btn btn-ghost flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Subtask
              </button>
              {onDuplicate && (
                <button
                  onClick={() => onDuplicate(task)}
                  className="btn btn-ghost flex items-center gap-1.5"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
              )}
              <button
                onClick={() => onEdit(task)}
                className="btn btn-primary flex items-center gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                Edit Task
              </button>
            </>
          )}
          <button
            onClick={() => onOpenTaskCenter(taskId)}
            className="btn btn-ghost flex items-center gap-1.5"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Task Center
          </button>
        </div>
      </div>

      {/* Add Subtask Modal */}
      {showAddSubtask && task && (() => {
        // Determine which task is the parent for the new subtask
        const parentForNewTask = addSubtaskParent
          ? {
              id: addSubtaskParent.id,
              title: addSubtaskParent.title,
              taskCode: addSubtaskParent.task_code || '',
              projectId: task.projectId || '',
              projectName: task.projectName,
            }
          : {
              id: task.id,
              title: task.title,
              taskCode: task.taskCode || '',
              projectId: task.projectId || '',
              projectName: task.projectName,
            };
        return (
          <AddSubtaskModal
            isOpen={showAddSubtask}
            onClose={() => { setShowAddSubtask(false); setAddSubtaskParent(null); }}
            onSuccess={() => {
              setShowAddSubtask(false);
              setAddSubtaskParent(null);
              fetchTaskData();
              onTaskUpdated?.();
            }}
            parentTask={parentForNewTask}
            token={token}
            users={users}
          />
        );
      })()}
    </>
  );
}
