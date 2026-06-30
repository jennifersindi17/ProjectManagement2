'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ChevronRight, ChevronDown, GitBranch, MoreVertical, Eye, Edit3, Copy, Plus,
  Trash2, AlertTriangle, Clock, User as UserIcon, GripVertical, Expand, Shrink,
  Search, Filter, X, Bookmark, BookmarkCheck,
  Paperclip, CheckCircle2, Link2, Tag, RotateCcw, ChevronsUpDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

// ─── Color indicators per level ───
const LEVEL_COLORS: Record<number, { dot: string; border: string; bg: string }> = {
  0: { dot: 'bg-orange-500', border: 'border-l-orange-500/60', bg: 'bg-orange-500/5' },
  1: { dot: 'bg-purple-500', border: 'border-l-purple-500/60', bg: 'bg-purple-500/5' },
  2: { dot: 'bg-blue-500', border: 'border-l-blue-500/60', bg: 'bg-blue-500/5' },
  3: { dot: 'bg-green-500', border: 'border-l-green-500/60', bg: 'bg-green-500/5' },
  4: { dot: 'bg-gray-500', border: 'border-l-gray-500/60', bg: 'bg-gray-500/5' },
};

const LEVEL_BAR_HEIGHT: Record<number, string> = {
  0: 'h-2',
  1: 'h-1.5',
  2: 'h-1.5',
  3: 'h-1',
  4: 'h-1',
};

// ─── Status options ───
const STATUS_OPTIONS = [
  'backlog', 'todo', 'analysis', 'development', 'sit', 'uat',
  'review', 'in_progress', 'done', 'blocked', 'cancelled', 'go_live'
];

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog', todo: 'Todo', analysis: 'Analysis', development: 'Development',
  sit: 'SIT', uat: 'UAT', review: 'Review', in_progress: 'In Progress',
  done: 'Done', blocked: 'Blocked', cancelled: 'Cancelled', go_live: 'Go Live'
};

const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'];
const PRIORITY_LABELS: Record<string, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

const TASK_TYPE_OPTIONS = ['parent', 'subtask', 'child', 'feature', 'bug', 'improvement', 'epic', 'story', 'milestone'];
const TASK_TYPE_LABELS: Record<string, string> = {
  parent: 'Parent Task', subtask: 'Subtask', child: 'Child Task',
  feature: 'Feature', bug: 'Bug', improvement: 'Improvement',
  epic: 'Epic', story: 'Story', milestone: 'Milestone'
};

const PROGRESS_RANGES = [
  { label: '0%', min: 0, max: 0 },
  { label: '1–25%', min: 1, max: 25 },
  { label: '26–50%', min: 26, max: 50 },
  { label: '51–75%', min: 51, max: 75 },
  { label: '76–99%', min: 76, max: 99 },
  { label: '100%', min: 100, max: 100 },
];

const DUE_DATE_OPTIONS = ['overdue', 'today', 'this_week', 'this_month'];
const DUE_DATE_LABELS: Record<string, string> = {
  overdue: 'Overdue', today: 'Today', this_week: 'This Week', this_month: 'This Month'
};

const SORT_FIELDS = [
  { value: 'taskName', label: 'Task Name' },
  { value: 'taskCode', label: 'Task Code' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'progress', label: 'Progress' },
  { value: 'startDate', label: 'Start Date' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'createdDate', label: 'Created Date' },
  { value: 'updatedDate', label: 'Updated Date' },
  { value: 'estimatedHours', label: 'Estimated Hours' },
  { value: 'actualHours', label: 'Actual Hours' },
  { value: 'assignee', label: 'Assignee' },
];

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<string, number> = {
  blocked: 0, critical: 1, in_progress: 2, review: 3, testing: 4,
  todo: 5, analysis: 6, development: 7, sit: 8, uat: 9,
  go_live: 10, backlog: 11, done: 12, cancelled: 13
};

// ─── Quick filter chip definitions ───
interface QuickFilterChip {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  filterFn: (task: Task, userId: string) => boolean;
}

interface Task {
  id: string;
  title: string;
  taskCode: string;
  description?: string;
  status: string;
  priority: string;
  taskType: string;
  completionPercentage: number;
  level: number;
  parentTaskId: string | null;
  assigneeId: string | null;
  reporterId: string | null;
  dueDate: string | null;
  startDate: string | null;
  estimatedHours?: number;
  actualHours?: number;
  labels?: string[];
  dependsOn?: string[];
  createdAt: string;
  updatedAt: string;
  position?: number;
  hasChildren?: boolean;
  hasAttachments?: boolean;
  hasChecklist?: boolean;
  checklistCompleted?: number;
  checklistTotal?: number;
}

interface TaskTreeProps {
  tasks: Task[];
  projectId: string;
  token: string;
  users: any[];
  onTaskUpdated: () => void;
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
}

export interface SavedFilter {
  id: string;
  name: string;
  isDefault: boolean;
  filters: FilterState;
  createdAt: string;
}

interface FilterState {
  search: string;
  statuses: string[];
  priorities: string[];
  assigneeIds: string[];
  reporterIds: string[];
  hasMilestone: boolean | null;
  taskTypes: string[];
  progressRanges: number[];
  dueDateOption: string | null;
  tags: string[];
  hasAttachment: boolean | null;
  hasChecklist: boolean | null;
  hasDependency: boolean | null;
}

const EMPTY_FILTER: FilterState = {
  search: '',
  statuses: [],
  priorities: [],
  assigneeIds: [],
  reporterIds: [],
  hasMilestone: null,
  taskTypes: [],
  progressRanges: [],
  dueDateOption: null,
  tags: [],
  hasAttachment: null,
  hasChecklist: null,
  hasDependency: null,
};

const INDENT_PX = 32;

export default function TaskTree({
  tasks, projectId, token, users, onTaskUpdated,
  onEditTask, onViewTask, onDuplicateTask, onAddSubtask
}: TaskTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'above' | 'below' | 'inside' | null>(null);
  const [statusMenuTaskId, setStatusMenuTaskId] = useState<string | null>(null);

  // ─── Filter state ───
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [reporterIds, setReporterIds] = useState<string[]>([]);
  const [hasMilestone, setHasMilestone] = useState<boolean | null>(null);
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const [progressRanges, setProgressRanges] = useState<number[]>([]);
  const [dueDateOption, setDueDateOption] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [hasAttachment, setHasAttachment] = useState<boolean | null>(null);
  const [hasChecklist, setHasChecklist] = useState<boolean | null>(null);
  const [hasDependency, setHasDependency] = useState<boolean | null>(null);

  // ─── Sort state ───
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ─── Quick filter chips ───
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());

  // ─── Filter UI panels ───
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // ─── Saved filters ───
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveFilterDialog, setShowSaveFilterDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSavedFiltersPanel, setShowSavedFiltersPanel] = useState(false);

  // ─── Custom date range (reserved for future) ───

  const currentFilter: FilterState = useMemo(() => ({
    search, statuses, priorities, assigneeIds, reporterIds,
    hasMilestone, taskTypes, progressRanges, dueDateOption,
    tags, hasAttachment, hasChecklist, hasDependency
  }), [search, statuses, priorities, assigneeIds, reporterIds,
    hasMilestone, taskTypes, progressRanges, dueDateOption,
    tags, hasAttachment, hasChecklist, hasDependency]);

  const hasActiveFilters = useMemo(() => {
    return search.length > 0 || statuses.length > 0 || priorities.length > 0 ||
      assigneeIds.length > 0 || reporterIds.length > 0 || hasMilestone !== null ||
      taskTypes.length > 0 || progressRanges.length > 0 || dueDateOption !== null ||
      tags.length > 0 || hasAttachment !== null || hasChecklist !== null ||
      hasDependency !== null || activeQuickFilters.size > 0;
  }, [search, statuses, priorities, assigneeIds, reporterIds,
    hasMilestone, taskTypes, progressRanges, dueDateOption,
    tags, hasAttachment, hasChecklist, hasDependency, activeQuickFilters]);

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`pf_saved_filters_${projectId}`);
      if (saved) setSavedFilters(JSON.parse(saved));
    } catch {}
  }, [projectId]);

  // Build children map
  const childrenMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      const pid = t.parentTaskId || '__root__';
      if (!map[pid]) map[pid] = [];
      map[pid].push(t);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.position || 0) - (b.position || 0));
    }
    return map;
  }, [tasks]);

  const taskMap = useMemo(() => {
    const m: Record<string, Task> = {};
    for (const t of tasks) m[t.id] = { ...t, hasChildren: (childrenMap[t.id] || []).length > 0 };
    return m;
  }, [tasks, childrenMap]);

  // Auto-expand all parents on mount
  useEffect(() => {
    const allIds = new Set<string>();
    for (const t of tasks) {
      allIds.add(t.id);
    }
    setExpandedIds(allIds);
  }, [tasks]);

  // Sorting function for siblings
  const sortTasks = useCallback((taskList: Task[]): Task[] => {
    return [...taskList].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'taskName': cmp = a.title.localeCompare(b.title); break;
        case 'taskCode': cmp = a.taskCode.localeCompare(b.taskCode); break;
        case 'priority': cmp = (PRIORITY_ORDER[a.priority] || 99) - (PRIORITY_ORDER[b.priority] || 99); break;
        case 'status': cmp = (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99); break;
        case 'progress': cmp = (a.completionPercentage || 0) - (b.completionPercentage || 0); break;
        case 'startDate': cmp = (a.startDate || '').localeCompare(b.startDate || ''); break;
        case 'dueDate': cmp = (a.dueDate || '9999').localeCompare(b.dueDate || '9999'); break;
        case 'createdDate': cmp = a.createdAt.localeCompare(b.createdAt); break;
        case 'updatedDate': cmp = b.updatedAt.localeCompare(a.updatedAt); break;
        case 'estimatedHours': cmp = (a.estimatedHours || 0) - (b.estimatedHours || 0); break;
        case 'actualHours': cmp = (a.actualHours || 0) - (b.actualHours || 0); break;
        case 'assignee': {
          const aName = users.find(u => u.id === a.assigneeId)?.firstName || '';
          const bName = users.find(u => u.id === b.assigneeId)?.firstName || '';
          cmp = aName.localeCompare(bName);
          break;
        }
        default: cmp = 0;
      }
      if (sortDirection === 'desc') cmp = -cmp;
      return cmp;
    });
  }, [sortField, sortDirection, users]);

  // Apply sorting to childrenMap
  const sortedChildrenMap = useMemo(() => {
    const sorted: Record<string, Task[]> = {};
    for (const key of Object.keys(childrenMap)) {
      sorted[key] = sortTasks(childrenMap[key]);
    }
    return sorted;
  }, [childrenMap, sortTasks]);

  // ─── Due date helpers ───
  const isOverdue = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isToday = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
  };

  const isThisWeek = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return d >= startOfWeek && d <= endOfWeek;
  };

  const isThisMonth = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  // ─── Filter logic ───
  const matchesAdvancedFilter = useCallback((task: Task, quickFilterIds: Set<string>): boolean => {
    // Search: name, code, description
    if (search) {
      const lower = search.toLowerCase();
      const matchText = task.title.toLowerCase().includes(lower) ||
        task.taskCode.toLowerCase().includes(lower) ||
        (task.description || '').toLowerCase().includes(lower);
      if (!matchText) return false;
    }

    // Status
    if (statuses.length > 0 && !statuses.includes(task.status)) return false;

    // Priority
    if (priorities.length > 0 && !priorities.includes(task.priority)) return false;

    // Assignee
    if (assigneeIds.length > 0 && !assigneeIds.includes(task.assigneeId || '')) return false;

    // Reporter
    if (reporterIds.length > 0 && !reporterIds.includes(task.reporterId || '')) return false;

    // Milestone (taskType === 'milestone')
    if (hasMilestone !== null) {
      const isMilestone = task.taskType === 'milestone';
      if (hasMilestone && !isMilestone) return false;
      if (!hasMilestone && isMilestone) return false;
    }

    // Task type
    if (taskTypes.length > 0) {
      // Map UI task type filters to entity values
      const mappedTypes: string[] = [];
      for (const tt of taskTypes) {
        if (tt === 'parent') mappedTypes.push('epic', 'story', 'feature', 'task');
        else if (tt === 'subtask') mappedTypes.push('subtask');
        else if (tt === 'child') mappedTypes.push('bug', 'improvement');
        else mappedTypes.push(tt);
      }
      if (!mappedTypes.includes(task.taskType)) return false;
    }

    // Progress
    if (progressRanges.length > 0) {
      const matches = progressRanges.some(rangeIdx => {
        const range = PROGRESS_RANGES[rangeIdx];
        const pct = task.completionPercentage || 0;
        return pct >= range.min && pct <= range.max;
      });
      if (!matches) return false;
    }

    // Due date
    if (dueDateOption) {
      if (dueDateOption === 'overdue' && !isOverdue(task.dueDate)) return false;
      else if (dueDateOption === 'today' && !isToday(task.dueDate)) return false;
      else if (dueDateOption === 'this_week' && !isThisWeek(task.dueDate)) return false;
      else if (dueDateOption === 'this_month' && !isThisMonth(task.dueDate)) return false;
    }

    // Tags
    if (tags.length > 0) {
      const taskLabels = task.labels || [];
      if (!tags.some(tag => taskLabels.includes(tag))) return false;
    }

    // Has attachment
    if (hasAttachment !== null) {
      if (hasAttachment && !task.hasAttachments) return false;
      if (!hasAttachment && task.hasAttachments) return false;
    }

    // Has checklist
    if (hasChecklist !== null) {
      if (hasChecklist && !task.hasChecklist) return false;
      if (!hasChecklist && task.hasChecklist) return false;
    }

    // Has dependency
    if (hasDependency !== null) {
      const hasDep = (task.dependsOn || []).length > 0;
      if (hasDependency && !hasDep) return false;
      if (!hasDependency && hasDep) return false;
    }

    // Quick filters
    if (quickFilterIds.size > 0) {
      // We need current user id from token or users list
      // Quick filters are applied at a higher level
      // handled separately in the filter chain
    }

    return true;
  }, [search, statuses, priorities, assigneeIds, reporterIds, hasMilestone,
    taskTypes, progressRanges, dueDateOption, tags, hasAttachment, hasChecklist,
    hasDependency]);

  const matchesQuickFilter = useCallback((task: Task, quickFilterIds: Set<string>, currentUserId: string): boolean => {
    if (quickFilterIds.size === 0) return true;
    if (quickFilterIds.has('my_tasks') && task.assigneeId !== currentUserId) return false;
    if (quickFilterIds.has('overdue') && !isOverdue(task.dueDate)) return false;
    if (quickFilterIds.has('due_today') && !isToday(task.dueDate)) return false;
    if (quickFilterIds.has('completed') && (task.completionPercentage || 0) < 100) return false;
    if (quickFilterIds.has('blocked') && task.status !== 'blocked') return false;
    if (quickFilterIds.has('high_priority') && !['critical', 'high'].includes(task.priority)) return false;
    if (quickFilterIds.has('milestones') && task.taskType !== 'milestone') return false;
    if (quickFilterIds.has('recent_updates')) {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      if (new Date(task.updatedAt) < threeDaysAgo) return false;
    }
    return true;
  }, []);

  // Get current user ID from token (simple decode)
  const currentUserId = useMemo(() => {
    if (!token) return '';
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return payload.sub || payload.id || '';
      }
    } catch {}
    return '';
  }, [token]);

  // Filter: keep matched tasks + their parent chain
  const matchedTaskIds = useMemo(() => {
    if (!hasActiveFilters) return null;

    const matched = new Set<string>();
    for (const t of tasks) {
      const advancedMatch = matchesAdvancedFilter(t, activeQuickFilters);
      const quickMatch = matchesQuickFilter(t, activeQuickFilters, currentUserId);
      if (advancedMatch && quickMatch) {
        matched.add(t.id);
        // Walk up the parent chain
        let parentId = t.parentTaskId;
        while (parentId && taskMap[parentId]) {
          matched.add(parentId);
          parentId = taskMap[parentId].parentTaskId;
        }
      }
    }
    return matched;
  }, [hasActiveFilters, tasks, matchesAdvancedFilter, matchesQuickFilter, currentUserId, taskMap, activeQuickFilters]);

  // Highlight task names that match search
  const highlightMatch = (text: string): React.ReactNode => {
    if (!search.trim()) return text;
    const lower = search.toLowerCase();
    const idx = text.toLowerCase().indexOf(lower);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">{text.slice(idx, idx + search.length)}</span>
        {text.slice(idx + search.length)}
      </>
    );
  };

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set(tasks.map(t => t.id));
    setExpandedIds(allIds);
  }, [tasks]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearch('');
    setStatuses([]);
    setPriorities([]);
    setAssigneeIds([]);
    setReporterIds([]);
    setHasMilestone(null);
    setTaskTypes([]);
    setProgressRanges([]);
    setDueDateOption(null);
    setTags([]);
    setHasAttachment(null);
    setHasChecklist(null);
    setHasDependency(null);
    setActiveQuickFilters(new Set());
  }, []);

  // Toggle quick filter chip
  const toggleQuickFilter = useCallback((chipId: string) => {
    setActiveQuickFilters(prev => {
      const next = new Set(prev);
      if (next.has(chipId)) next.delete(chipId); else next.add(chipId);
      return next;
    });
  }, []);

  // Save filter
  const saveFilter = useCallback(() => {
    if (!saveFilterName.trim()) return;
    const newFilter: SavedFilter = {
      id: Date.now().toString(36),
      name: saveFilterName.trim(),
      isDefault: false,
      filters: { ...currentFilter },
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem(`pf_saved_filters_${projectId}`, JSON.stringify(updated));
    setSaveFilterName('');
    setShowSaveFilterDialog(false);
  }, [saveFilterName, savedFilters, currentFilter, projectId]);

  // Load saved filter
  const loadSavedFilter = useCallback((sf: SavedFilter) => {
    setSearch(sf.filters.search);
    setStatuses(sf.filters.statuses);
    setPriorities(sf.filters.priorities);
    setAssigneeIds(sf.filters.assigneeIds);
    setReporterIds(sf.filters.reporterIds);
    setHasMilestone(sf.filters.hasMilestone);
    setTaskTypes(sf.filters.taskTypes);
    setProgressRanges(sf.filters.progressRanges);
    setDueDateOption(sf.filters.dueDateOption);
    setTags(sf.filters.tags);
    setHasAttachment(sf.filters.hasAttachment);
    setHasChecklist(sf.filters.hasChecklist);
    setHasDependency(sf.filters.hasDependency);
    setShowSavedFiltersPanel(false);
  }, []);

  // Delete saved filter
  const deleteSavedFilter = useCallback((filterId: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem(`pf_saved_filters_${projectId}`, JSON.stringify(updated));
  }, [savedFilters, projectId]);

  // Set default filter
  const setDefaultFilter = useCallback((filterId: string) => {
    const updated = savedFilters.map(f => ({ ...f, isDefault: f.id === filterId }));
    setSavedFilters(updated);
    localStorage.setItem(`pf_saved_filters_${projectId}`, JSON.stringify(updated));
  }, [savedFilters, projectId]);

  // Load default filter on mount
  useEffect(() => {
    const defaultFilter = savedFilters.find(f => f.isDefault);
    if (defaultFilter && tasks.length > 0) {
      loadSavedFilter(defaultFilter);
    }
  }, [savedFilters.length]); // only on initial load

  // ─── Toggle helpers ───
  const toggleArrayFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    if (arr.includes(val)) setter(arr.filter(v => v !== val));
    else setter([...arr, val]);
  };

  const toggleProgressRange = (idx: number) => {
    if (progressRanges.includes(idx)) setProgressRanges(progressRanges.filter(i => i !== idx));
    else setProgressRanges([...progressRanges, idx]);
  };

  // Collect all tags from tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const t of tasks) {
      if (t.labels) t.labels.forEach(l => tagSet.add(l));
    }
    return Array.from(tagSet).sort();
  }, [tasks]);

  // ─── Recursive render function ───
  const renderTask = (task: Task, siblingIndex: number, totalSiblings: number) => {
    const depth = (task.level || 1) - 1;
    const hasChildren = (sortedChildrenMap[task.id] || []).length > 0;
    const isExpanded = expandedIds.has(task.id);
    const children = sortedChildrenMap[task.id] || [];
    const levelColor = LEVEL_COLORS[depth] || LEVEL_COLORS[4];
    const indentPx = depth * INDENT_PX;
    const isMatched = !matchedTaskIds || matchedTaskIds.has(task.id);
    const isSearchHit = search.trim() && matchedTaskIds?.has(task.id) &&
      (task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.taskCode.toLowerCase().includes(search.toLowerCase()));

    if (!isMatched) return null;

    const isDragOver = dragOverTaskId === task.id;

    return (
      <React.Fragment key={task.id}>
        <div
          className={`group flex items-center gap-1 relative cursor-pointer transition-colors border-l-[3px] ${levelColor.border} ${isDragOver ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/30'} ${isSearchHit ? 'bg-yellow-500/5' : ''}`}
          style={{ marginLeft: `${indentPx}px` }}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', task.id);
            setDragTaskId(task.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const pos = y < rect.height / 3 ? 'above' : y > (rect.height * 2) / 3 ? 'below' : 'inside';
            setDragOverTaskId(task.id);
            setDragPosition(pos);
          }}
          onDragLeave={() => { setDragOverTaskId(null); setDragPosition(null); }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const draggedId = e.dataTransfer.getData('text/plain');
            if (draggedId === task.id) return;
            if (!draggedId) return;
            let newParentId: string | null = null;
            if (dragPosition === 'inside') {
              newParentId = task.id;
            } else {
              newParentId = task.parentTaskId || null;
            }
            try {
              await api.tasks.reparent(draggedId, newParentId, token);
              onTaskUpdated();
            } catch (err) {
              console.error('Reparent failed:', err);
            }
            setDragTaskId(null);
            setDragOverTaskId(null);
            setDragPosition(null);
          }}
          onDragEnd={() => { setDragTaskId(null); setDragOverTaskId(null); setDragPosition(null); }}
          onDoubleClick={() => onEditTask(taskMap[task.id])}
        >
          {/* Drag handle */}
          <div className="opacity-0 group-hover:opacity-50 pl-1 cursor-grab flex-shrink-0">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>

          {/* Indentation guides (connector lines) */}
          {depth > 0 && (
            <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
              {Array.from({ length: depth }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-border/50"
                  style={{ left: `${(i + 1) * INDENT_PX}px` }}
                />
              ))}
            </div>
          )}

          {/* Horizontal connector */}
          {(depth > 0) && (
            <div className="flex items-center flex-shrink-0" style={{ width: '16px' }}>
              <div className="w-3 h-px bg-border/60" />
            </div>
          )}

          {/* Expand/Collapse button */}
          <button
            className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-muted/60 transition-colors ${!hasChildren ? 'invisible pointer-events-none' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }}
          >
            {hasChildren ? (
              isExpanded
                ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                : <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : (
              <div className="w-2 h-2 rounded-full" style={{ marginLeft: '2px' }} />
            )}
          </button>

          {/* Level color indicator dot */}
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${levelColor.dot}`} />

          {/* Content */}
          <div className="flex-1 min-w-0 py-2 pr-3">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate flex-1">{highlightMatch(task.title)}</p>
              {hasChildren && (
                <span className="text-[10px] bg-foreground/5 text-foreground/60 px-1.5 py-0.5 rounded-full shrink-0 font-medium tabular-nums">
                  {children.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span>{task.taskCode}</span>
              {(() => {
                const u = users.find(u => u.id === task.assigneeId);
                if (!u) return null;
                return <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{u.firstName} {u.lastName}</span>;
              })()}
              {task.dueDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(task.dueDate)}</span>}
              {task.hasChecklist && task.checklistTotal !== undefined && task.checklistTotal > 0 && (
                <span className="flex items-center gap-1 text-blue-400">
                  <CheckCircle2 className="w-3 h-3" />{task.checklistCompleted || 0}/{task.checklistTotal}
                </span>
              )}
              {task.hasAttachments && (
                <Paperclip className="w-3 h-3 text-muted-foreground" />
              )}
              {(task.dependsOn || []).length > 0 && (
                <Link2 className="w-3 h-3 text-amber-400" />
              )}
              {(task.labels || []).length > 0 && (
                <span className="flex items-center gap-0.5">
                  <Tag className="w-3 h-3" />
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`${LEVEL_BAR_HEIGHT[depth] || 'h-1'} rounded-full transition-all ${task.completionPercentage >= 100 ? 'bg-green-500' : task.completionPercentage > 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, task.completionPercentage))}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{Math.round(task.completionPercentage)}%</span>
            </div>
          </div>

          {/* Priority badge */}
          <span className="badge badge-xs hidden sm:inline-flex">{task.priority}</span>

          {/* Action button */}
          <div className="relative flex-shrink-0 pr-2" onClick={e => e.stopPropagation()}>
            <button
              className="p-1.5 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setStatusMenuTaskId(statusMenuTaskId === task.id ? null : task.id)}
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            {statusMenuTaskId === task.id && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border rounded-lg shadow-xl z-30 py-1 text-sm">
                <button className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2" onClick={() => { onViewTask(taskMap[task.id]); setStatusMenuTaskId(null); }}>
                  <Eye className="w-4 h-4" /> View
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2" onClick={() => { onEditTask(taskMap[task.id]); setStatusMenuTaskId(null); }}>
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2" onClick={() => { onDuplicateTask(taskMap[task.id]); setStatusMenuTaskId(null); }}>
                  <Copy className="w-4 h-4" /> Duplicate
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2" onClick={() => { onAddSubtask(taskMap[task.id]); setStatusMenuTaskId(null); }}>
                  <Plus className="w-4 h-4" /> Add Subtask
                </button>
                <div className="border-t my-1" />
                <button className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-destructive" onClick={() => { setStatusMenuTaskId(null); }}>
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Render children if expanded */}
        {isExpanded && children.map((child, idx) => renderTask(child, idx, children.length))}
      </React.Fragment>
    );
  };

  const rootTasks = sortedChildrenMap['__root__'] || [];

  return (
    <div className="space-y-2">
      {/* ─── Search & Filter Bar ─── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-sm pl-9 w-full"
          />
        </div>
        <button
          className={`btn btn-sm ${showFilterPanel ? 'bg-primary/20 text-primary' : 'btn-ghost'}`}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          title="Filter"
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary ml-1" />}
        </button>
        {/* Sort dropdown */}
        <div className="relative">
          <button
            className="btn btn-ghost btn-sm flex items-center gap-1"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
          >
            <span className="text-xs text-muted-foreground">Sort:</span>
            <span className="text-xs font-medium">{SORT_FIELDS.find(f => f.value === sortField)?.label}</span>
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-card border rounded-lg shadow-xl z-40 py-1">
              {SORT_FIELDS.map(f => (
                <button
                  key={f.value}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center justify-between ${sortField === f.value ? 'text-primary' : ''}`}
                  onClick={() => { setSortField(f.value); setShowSortDropdown(false); }}
                >
                  {f.label}
                  {sortField === f.value && (
                    <span className="text-xs text-muted-foreground">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
              <div className="border-t my-1" />
              <button
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              >
                {sortDirection === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
          )}
        </div>
        {/* Saved Filters */}
        <button
          className={`btn btn-ghost btn-sm ${savedFilters.length > 0 ? 'text-yellow-400' : ''}`}
          onClick={() => setShowSavedFiltersPanel(!showSavedFiltersPanel)}
          title="Saved Filters"
        >
          {savedFilters.some(f => f.isDefault) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
        {/* Reset */}
        {hasActiveFilters && (
          <button className="btn btn-ghost btn-sm text-destructive" onClick={resetFilters} title="Reset All">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─── Advanced Filter Panel ─── */}
      {showFilterPanel && (
        <div className="border rounded-lg p-3 bg-card/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filters</span>
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowFilterPanel(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Status */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <div className="flex flex-wrap gap-1">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${statuses.includes(s) ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                    onClick={() => toggleArrayFilter(statuses, s, setStatuses)}
                  >
                    {STATUS_LABELS[s] || s}
                  </button>
                ))}
              </div>
            </div>
            {/* Priority */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <div className="flex flex-wrap gap-1">
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${priorities.includes(p) ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                    onClick={() => toggleArrayFilter(priorities, p, setPriorities)}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            {/* Task Type */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Task Type</label>
              <div className="flex flex-wrap gap-1">
                {['parent', 'subtask', 'child'].map(tt => (
                  <button
                    key={tt}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${taskTypes.includes(tt) ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                    onClick={() => toggleArrayFilter(taskTypes, tt, setTaskTypes)}
                  >
                    {TASK_TYPE_LABELS[tt]}
                  </button>
                ))}
              </div>
            </div>
            {/* Progress */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Progress</label>
              <div className="flex flex-wrap gap-1">
                {PROGRESS_RANGES.map((r, idx) => (
                  <button
                    key={idx}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${progressRanges.includes(idx) ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                    onClick={() => toggleProgressRange(idx)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Assignee */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assignee</label>
              <select
                className="input input-sm text-xs w-full"
                value=""
                onChange={(e) => { if (e.target.value) { toggleArrayFilter(assigneeIds, e.target.value, setAssigneeIds); e.target.value = ''; } }}
              >
                <option value="">All Assignees</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
              {assigneeIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {assigneeIds.map(id => {
                    const u = users.find(x => x.id === id);
                    return u ? (
                      <span key={id} className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        {u.firstName}
                        <button onClick={() => setAssigneeIds(assigneeIds.filter(a => a !== id))}><X className="w-3 h-3" /></button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            {/* Reporter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Reporter</label>
              <select
                className="input input-sm text-xs w-full"
                value=""
                onChange={(e) => { if (e.target.value) { toggleArrayFilter(reporterIds, e.target.value, setReporterIds); e.target.value = ''; } }}
              >
                <option value="">All Reporters</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
              {reporterIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {reporterIds.map(id => {
                    const u = users.find(x => x.id === id);
                    return u ? (
                      <span key={id} className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        {u.firstName}
                        <button onClick={() => setReporterIds(reporterIds.filter(a => a !== id))}><X className="w-3 h-3" /></button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            {/* Due Date */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
              <select
                className="input input-sm text-xs w-full"
                value={dueDateOption || ''}
                onChange={(e) => setDueDateOption(e.target.value || null)}
              >
                <option value="">Any</option>
                {DUE_DATE_OPTIONS.map(d => (
                  <option key={d} value={d}>{DUE_DATE_LABELS[d]}</option>
                ))}
              </select>
            </div>
            {/* Milestone */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Milestone</label>
              <div className="flex gap-1">
                <button
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${hasMilestone === true ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                  onClick={() => setHasMilestone(hasMilestone === true ? null : true)}
                >Yes</button>
                <button
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${hasMilestone === false ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                  onClick={() => setHasMilestone(hasMilestone === false ? null : false)}
                >No</button>
              </div>
            </div>
            {/* Tags */}
            {allTags.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${tags.includes(tag) ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                      onClick={() => toggleArrayFilter(tags, tag, setTags)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Has Attachment */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Attachments</label>
              <div className="flex gap-1">
                <button
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${hasAttachment === true ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                  onClick={() => setHasAttachment(hasAttachment === true ? null : true)}
                >Yes</button>
                <button
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${hasAttachment === false ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                  onClick={() => setHasAttachment(hasAttachment === false ? null : false)}
                >No</button>
              </div>
            </div>
            {/* Has Checklist */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Checklist</label>
              <div className="flex gap-1">
                <button
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${hasChecklist === true ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                  onClick={() => setHasChecklist(hasChecklist === true ? null : true)}
                >Yes</button>
                <button
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${hasChecklist === false ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                  onClick={() => setHasChecklist(hasChecklist === false ? null : false)}
                >No</button>
              </div>
            </div>
            {/* Has Dependency */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dependencies</label>
              <div className="flex gap-1">
                <button
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${hasDependency === true ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                  onClick={() => setHasDependency(hasDependency === true ? null : true)}
                >Yes</button>
                <button
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${hasDependency === false ? 'bg-primary/20 border-primary text-primary' : 'border-border hover:border-muted-foreground'}`}
                  onClick={() => setHasDependency(hasDependency === false ? null : false)}
                >No</button>
              </div>
            </div>
          </div>
          {/* Panel actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <button className="btn btn-sm btn-primary" onClick={() => setShowSaveFilterDialog(true)}>
              <Bookmark className="w-3.5 h-3.5 mr-1" /> Save Filter
            </button>
            {hasActiveFilters && (
              <button className="btn btn-sm btn-ghost text-destructive" onClick={resetFilters}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {matchedTaskIds ? `${matchedTaskIds.size} matching` : `${tasks.length} tasks`}
            </span>
          </div>
        </div>
      )}

      {/* ─── Save Filter Dialog ─── */}
      {showSaveFilterDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveFilterDialog(false)}>
          <div className="bg-card border rounded-xl p-4 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm mb-3">Save Current Filter</h3>
            <input
              type="text"
              placeholder="Filter name..."
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              className="input input-sm w-full mb-3"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') saveFilter(); }}
            />
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm btn-ghost" onClick={() => setShowSaveFilterDialog(false)}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={saveFilter}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Saved Filters Panel ─── */}
      {showSavedFiltersPanel && (
        <div className="border rounded-lg p-3 bg-card/30 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saved Filters</span>
            <button onClick={() => setShowSavedFiltersPanel(false)}><X className="w-4 h-4" /></button>
          </div>
          {savedFilters.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No saved filters yet</p>
          ) : (
            <div className="space-y-1">
              {savedFilters.map(sf => (
                <div key={sf.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 group">
                  <button
                    className="flex-1 text-left text-sm flex items-center gap-2"
                    onClick={() => loadSavedFilter(sf)}
                  >
                    {sf.isDefault ? <BookmarkCheck className="w-4 h-4 text-yellow-400" /> : <Bookmark className="w-4 h-4 text-muted-foreground" />}
                    <span>{sf.name}</span>
                  </button>
                  <button
                    className="text-xs text-muted-foreground hover:text-yellow-400 opacity-0 group-hover:opacity-100"
                    onClick={() => setDefaultFilter(sf.id)}
                    title="Set as default"
                  >
                    {sf.isDefault ? '★' : '☆'}
                  </button>
                  <button
                    className="text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                    onClick={() => deleteSavedFilter(sf.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Quick Filter Chips ─── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          className={`btn btn-xs gap-1 transition-colors ${activeQuickFilters.has('my_tasks') ? 'bg-primary/20 text-primary border-primary' : 'btn-ghost'}`}
          onClick={() => toggleQuickFilter('my_tasks')}
        >
          <UserIcon className="w-3 h-3" /> My Tasks
        </button>
        <button
          className={`btn btn-xs gap-1 transition-colors ${activeQuickFilters.has('overdue') ? 'bg-red-500/20 text-red-400 border-red-400' : 'btn-ghost'}`}
          onClick={() => toggleQuickFilter('overdue')}
        >
          <AlertTriangle className="w-3 h-3" /> Overdue
        </button>
        <button
          className={`btn btn-xs gap-1 transition-colors ${activeQuickFilters.has('due_today') ? 'bg-amber-500/20 text-amber-400 border-amber-400' : 'btn-ghost'}`}
          onClick={() => toggleQuickFilter('due_today')}
        >
          <Clock className="w-3 h-3" /> Due Today
        </button>
        <button
          className={`btn btn-xs gap-1 transition-colors ${activeQuickFilters.has('completed') ? 'bg-green-500/20 text-green-400 border-green-400' : 'btn-ghost'}`}
          onClick={() => toggleQuickFilter('completed')}
        >
          <CheckCircle2 className="w-3 h-3" /> Completed
        </button>
        <button
          className={`btn btn-xs gap-1 transition-colors ${activeQuickFilters.has('blocked') ? 'bg-red-500/20 text-red-400 border-red-400' : 'btn-ghost'}`}
          onClick={() => toggleQuickFilter('blocked')}
        >
          <AlertTriangle className="w-3 h-3" /> Blocked
        </button>
        <button
          className={`btn btn-xs gap-1 transition-colors ${activeQuickFilters.has('high_priority') ? 'bg-orange-500/20 text-orange-400 border-orange-400' : 'btn-ghost'}`}
          onClick={() => toggleQuickFilter('high_priority')}
        >
          <AlertTriangle className="w-3 h-3" /> High Priority
        </button>
        <button
          className={`btn btn-xs gap-1 transition-colors ${activeQuickFilters.has('milestones') ? 'bg-purple-500/20 text-purple-400 border-purple-400' : 'btn-ghost'}`}
          onClick={() => toggleQuickFilter('milestones')}
        >
          <GitBranch className="w-3 h-3" /> Milestones
        </button>
        <button
          className={`btn btn-xs gap-1 transition-colors ${activeQuickFilters.has('recent_updates') ? 'bg-blue-500/20 text-blue-400 border-blue-400' : 'btn-ghost'}`}
          onClick={() => toggleQuickFilter('recent_updates')}
        >
          <Clock className="w-3 h-3" /> Recent
        </button>
      </div>

      {/* ─── Expand/Collapse + Sort info ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-xs" onClick={expandAll} title="Expand All">
            <Expand className="w-3.5 h-3.5 mr-1" /> Expand All
          </button>
          <button className="btn btn-ghost btn-xs" onClick={collapseAll} title="Collapse All">
            <Shrink className="w-3.5 h-3.5 mr-1" /> Collapse All
          </button>
        </div>
        {hasActiveFilters && (
          <span className="text-[10px] text-muted-foreground">
            {rootTasks.filter(t => !matchedTaskIds || matchedTaskIds.has(t.id)).length} of {tasks.length} shown
          </span>
        )}
      </div>

      {/* ─── Active filter indicators ─── */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1 flex-wrap">
          {search && (
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
              Search: "{search}" <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {statuses.map(s => (
            <span key={s} className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
              {STATUS_LABELS[s]} <button onClick={() => setStatuses(statuses.filter(x => x !== s))}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {priorities.map(p => (
            <span key={p} className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
              {PRIORITY_LABELS[p]} <button onClick={() => setPriorities(priorities.filter(x => x !== p))}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {dueDateOption && (
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
              {DUE_DATE_LABELS[dueDateOption]} <button onClick={() => setDueDateOption(null)}><X className="w-3 h-3" /></button>
            </span>
          )}
          {progressRanges.map(idx => (
            <span key={idx} className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
              {PROGRESS_RANGES[idx].label} <button onClick={() => setProgressRanges(progressRanges.filter(i => i !== idx))}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {activeQuickFilters.has('my_tasks') && (
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
              My Tasks <button onClick={() => toggleQuickFilter('my_tasks')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {activeQuickFilters.has('overdue') && (
            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              Overdue <button onClick={() => toggleQuickFilter('overdue')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {activeQuickFilters.has('due_today') && (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              Due Today <button onClick={() => toggleQuickFilter('due_today')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {activeQuickFilters.has('completed') && (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              Completed <button onClick={() => toggleQuickFilter('completed')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {activeQuickFilters.has('blocked') && (
            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              Blocked <button onClick={() => toggleQuickFilter('blocked')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {activeQuickFilters.has('high_priority') && (
            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              High Priority <button onClick={() => toggleQuickFilter('high_priority')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {activeQuickFilters.has('milestones') && (
            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              Milestones <button onClick={() => toggleQuickFilter('milestones')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {activeQuickFilters.has('recent_updates') && (
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              Recent <button onClick={() => toggleQuickFilter('recent_updates')}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* ─── Tree ─── */}
      <div className="border rounded-lg overflow-hidden bg-card/50">
        {rootTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No tasks yet</div>
        ) : rootTasks.filter(t => !matchedTaskIds || matchedTaskIds.has(t.id)).length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No tasks match your filters</p>
            <button className="btn btn-sm btn-ghost mt-2" onClick={resetFilters}>Reset Filters</button>
          </div>
        ) : (
          rootTasks.map((task, idx) => renderTask(task, idx, rootTasks.length))
        )}
      </div>
    </div>
  );
}
