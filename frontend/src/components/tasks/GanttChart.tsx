'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface GanttTask {
  id: string;
  taskCode: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  taskType: string;
  projectName: string;
  projectCode: string;
  projectCompletion: number;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  reporterName?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  completionPercentage: number;
  storyPoints?: number;
  parentTaskId?: string;
  sprintId?: string;
  projectId: string;
  dependsOn: string[];
  labels: string[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';

interface GanttChartProps {
  projectId?: string;
  onTaskClick?: (task: GanttTask) => void;
  onTaskCreate?: (startDate?: string, projectId?: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: '#6b7280',
  blocked: '#dc2626',
  cancelled: '#374151',
  done: '#22c55e',
  in_progress: '#3b82f6',
  review: '#a855f7',
  testing: '#f59e0b',
  todo: '#94a3b8',
  analysis: '#8b5cf6',
  development: '#0ea5e9',
  sit: '#eab308',
  uat: '#f97316',
  go_live: '#10b981',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#3b82f6',
  low: '#22c55e',
};

const ZOOM_CONFIG: Record<ZoomLevel, { dayWidth: number; label: string }> = {
  day: { dayWidth: 40, label: 'Day' },
  week: { dayWidth: 14, label: 'Week' },
  month: { dayWidth: 4, label: 'Month' },
  quarter: { dayWidth: 2, label: 'Quarter' },
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function GanttChart({ projectId, onTaskClick }: GanttChartProps) {
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [allTasks, setAllTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState<ZoomLevel>('month');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [dragState, setDragState] = useState<{
    taskId: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStart: string;
    originalEnd: string;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterState, setFilterState] = useState({
    projectFilter: '',
    assigneeFilter: '',
    statusFilter: '',
    priorityFilter: '',
  });
  const [criticalPathEnabled, setCriticalPathEnabled] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);

  const chartRef = useRef<HTMLDivElement>(null);

  // ─── Data Loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!accessToken) return;
    api.tasks.list({ limit: 500, projectId }, accessToken)
      .then((res: any) => {
        const data = res.data || [];
        setAllTasks(data);
        setTasks(data);

        const projMap = new Map<string, string>();
        const assigneeMap = new Map<string, string>();
        data.forEach((t: GanttTask) => {
          if (t.projectName) projMap.set(t.projectId, t.projectName);
          if (t.assigneeName) assigneeMap.set(t.assigneeId || '', t.assigneeName);
        });
        setProjects(Array.from(projMap.entries()).map(([id, name]) => ({ id, name })));
        setAssignees(Array.from(assigneeMap.entries()).map(([id, name]) => ({ id, name })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, projectId]);

  // ─── Filtering ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let filtered = allTasks;
    if (filterState.projectFilter) filtered = filtered.filter(t => t.projectId === filterState.projectFilter);
    if (filterState.assigneeFilter) filtered = filtered.filter(t => t.assigneeId === filterState.assigneeFilter);
    if (filterState.statusFilter) filtered = filtered.filter(t => t.status === filterState.statusFilter);
    if (filterState.priorityFilter) filtered = filtered.filter(t => t.priority === filterState.priorityFilter);
    setTasks(filtered);
  }, [filterState, allTasks]);

  // ─── Hierarchy Building ────────────────────────────────────────────────────

  const hierarchy = useMemo(() => {
    const taskMap = new Map<string, GanttTask & { children: any[] }>();
    tasks.forEach(t => taskMap.set(t.id, { ...t, children: [] }));
    const roots: (GanttTask & { children: any[] })[] = [];
    taskMap.forEach(task => {
      if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
        taskMap.get(task.parentTaskId)!.children.push(task);
      } else {
        roots.push(task);
      }
    });
    roots.sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return a.startDate.localeCompare(b.startDate);
    });
    return roots;
  }, [tasks]);

  // ─── Date Range ────────────────────────────────────────────────────────────

  const dateRange = useMemo(() => {
    const tasksWithDates = tasks.filter(t => t.startDate || t.dueDate);
    if (tasksWithDates.length === 0) {
      const today = new Date();
      return { minDate: addDays(today, -7), maxDate: addDays(today, 30) };
    }
    let minDate = new Date();
    let maxDate = new Date();
    tasksWithDates.forEach(t => {
      const start = t.startDate ? new Date(t.startDate) : null;
      const end = t.dueDate ? new Date(t.dueDate) : null;
      if (start && start < minDate) minDate = start;
      if (end && end > maxDate) maxDate = end;
    });
    minDate = addDays(startOfMonth(minDate), -7);
    maxDate = addDays(endOfMonth(maxDate), 7);
    return { minDate, maxDate };
  }, [tasks]);

  const totalDays = useMemo(() => daysBetween(dateRange.minDate, dateRange.maxDate) + 1, [dateRange]);
  const zoomConfig = ZOOM_CONFIG[zoom];
  const chartWidth = totalDays * zoomConfig.dayWidth;

  // ─── Timeline Header ───────────────────────────────────────────────────────

  const timelineHeaders = useMemo(() => {
    const headers: { label: string; offset: number; width: number; sub?: string }[] = [];
    const cursor = new Date(dateRange.minDate);

    if (zoom === 'day') {
      while (cursor <= dateRange.maxDate) {
        const offset = daysBetween(dateRange.minDate, cursor);
        headers.push({
          label: String(cursor.getDate()),
          offset: offset * zoomConfig.dayWidth,
          width: zoomConfig.dayWidth,
          sub: cursor.toLocaleDateString('en-US', { weekday: 'short' }),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else if (zoom === 'week') {
      while (cursor <= dateRange.maxDate) {
        const offset = daysBetween(dateRange.minDate, cursor);
        headers.push({
          label: `W${Math.ceil(cursor.getDate() / 7)}`,
          offset: offset * zoomConfig.dayWidth,
          width: 7 * zoomConfig.dayWidth,
          sub: cursor.toLocaleDateString('en-US', { month: 'short' }),
        });
        cursor.setDate(cursor.getDate() + 7);
      }
    } else if (zoom === 'month') {
      while (cursor <= dateRange.maxDate) {
        const offset = daysBetween(dateRange.minDate, startOfMonth(cursor));
        const daysInMonth = endOfMonth(cursor).getDate();
        headers.push({ label: formatMonth(cursor), offset: offset * zoomConfig.dayWidth, width: daysInMonth * zoomConfig.dayWidth });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else {
      const cursor2 = new Date(dateRange.minDate);
      cursor2.setMonth(Math.floor(cursor2.getMonth() / 3) * 3);
      cursor2.setDate(1);
      while (cursor2 <= dateRange.maxDate) {
        const offset = daysBetween(dateRange.minDate, cursor2);
        headers.push({ label: `Q${Math.floor(cursor2.getMonth() / 3) + 1}`, offset: offset * zoomConfig.dayWidth, width: 90 * zoomConfig.dayWidth });
        cursor2.setMonth(cursor2.getMonth() + 3);
      }
    }
    return headers;
  }, [dateRange, zoom]);

  // ─── Critical Path ─────────────────────────────────────────────────────────

  const criticalPathIds = useMemo(() => {
    if (!criticalPathEnabled) return new Set<string>();
    const taskMap = new Map<string, GanttTask>();
    tasks.forEach(t => taskMap.set(t.id, t));
    const visited = new Set<string>();
    const pathLengths = new Map<string, number>();

    function getLongestPath(taskId: string): number {
      if (pathLengths.has(taskId)) return pathLengths.get(taskId)!;
      if (visited.has(taskId)) return 0;
      visited.add(taskId);
      const task = taskMap.get(taskId);
      if (!task) return 0;
      let maxDep = 0;
      tasks.forEach(t => {
        if (t.dependsOn?.includes(taskId)) {
          maxDep = Math.max(maxDep, getLongestPath(t.id));
        }
      });
      const duration = task.startDate && task.dueDate
        ? Math.max(daysBetween(new Date(task.startDate), new Date(task.dueDate)), 1) : 1;
      const total = duration + maxDep;
      pathLengths.set(taskId, total);
      return total;
    }

    tasks.forEach(t => getLongestPath(t.id));
    let maxPathTask = '';
    let maxPath = 0;
    pathLengths.forEach((len, id) => {
      if (len > maxPath) { maxPath = len; maxPathTask = id; }
    });

    const criticalTasks = new Set<string>();
    if (maxPathTask) {
      let current = maxPathTask;
      while (current) {
        criticalTasks.add(current);
        const task = taskMap.get(current);
        if (!task) break;
        let nextTask = '';
        let nextPath = 0;
        task.dependsOn?.forEach(depId => {
          const depLen = pathLengths.get(depId) || 0;
          if (depLen > nextPath) { nextPath = depLen; nextTask = depId; }
        });
        if (!nextTask || criticalTasks.has(nextTask)) break;
        current = nextTask;
      }
    }
    return criticalTasks;
  }, [tasks, criticalPathEnabled]);

  // ─── Drag & Drop ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / zoomConfig.dayWidth);
      if (deltaDays === 0) return;

      setTasks(prev => prev.map(t => {
        if (t.id !== dragState.taskId) return t;
        if (dragState.type === 'move') {
          const ns = addDays(new Date(dragState.originalStart), deltaDays);
          const ne = addDays(new Date(dragState.originalEnd), deltaDays);
          return { ...t, startDate: ns.toISOString().split('T')[0], dueDate: ne.toISOString().split('T')[0] };
        } else if (dragState.type === 'resize-start') {
          const ns = addDays(new Date(dragState.originalStart), deltaDays);
          if (ns < new Date(dragState.originalEnd)) return { ...t, startDate: ns.toISOString().split('T')[0] };
        } else {
          const ne = addDays(new Date(dragState.originalEnd), deltaDays);
          if (ne > new Date(dragState.originalStart)) return { ...t, dueDate: ne.toISOString().split('T')[0] };
        }
        return t;
      }));
    };

    const handleMouseUp = async () => {
      const dragTask = dragState.taskId;
      const updated = tasks.find(t => t.id === dragTask);
      if (updated?.startDate && updated?.dueDate) {
        try {
          await api.tasks.update(dragTask, { startDate: updated.startDate, dueDate: updated.dueDate }, accessToken);
        } catch (err) { console.error('Failed to save dates:', err); }
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoomConfig.dayWidth, tasks, accessToken]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleTaskClick = (task: GanttTask) => {
    setSelectedTask(task);
    setShowDrawer(true);
    onTaskClick?.(task);
  };

  const toggleExpand = (taskId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    function collect(nodes: (GanttTask & { children: any[] })[]) {
      nodes.forEach(n => { if (n.children.length > 0) { allIds.add(n.id); collect(n.children); } });
    }
    collect(hierarchy);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => setExpandedNodes(new Set());

  const todayOffset = useMemo(() => daysBetween(dateRange.minDate, startOfDay(new Date())), [dateRange]);

  // ─── Render Task Row ───────────────────────────────────────────────────────

  const renderTaskRow = (task: GanttTask & { children: any[] }, depth: number) => {
    const hasChildren = task.children.length > 0;
    const isExpanded = expandedNodes.has(task.id);
    const isCritical = criticalPathIds.has(task.id);
    const barLeft = task.startDate ? daysBetween(dateRange.minDate, startOfDay(new Date(task.startDate))) * zoomConfig.dayWidth : 0;
    const barWidth = task.startDate && task.dueDate
      ? Math.max(daysBetween(new Date(task.startDate), new Date(task.dueDate)) * zoomConfig.dayWidth, 20) : 60;
    const barColor = STATUS_COLORS[task.status] || '#6b7280';
    const isMilestone = task.taskType === 'milestone' || task.taskType === 'epic';
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'closed' && task.status !== 'done';

    return (
      <div key={task.id}>
        <div className={`flex items-center border-b border-border/50 hover:bg-white/[0.02] transition-colors ${isCritical ? 'bg-red-500/5' : ''}`} style={{ height: 44 }}>
          <div className="w-72 flex-shrink-0 px-3 border-r border-border/50 flex items-center gap-2">
            {hasChildren ? (
              <button onClick={() => toggleExpand(task.id)} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs">
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : <span className="w-5" />}
            {depth > 0 && <span className="text-muted-foreground text-xs ml-2">└</span>}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isMilestone ? <span className="text-amber-400 text-xs">◆</span> : <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLORS[task.priority] || '#6b7280' }} />}
                <span className="text-sm font-medium truncate" title={task.title}>{task.title}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{task.taskCode}</span>
                {task.projectName && <span className="truncate">• {task.projectName}</span>}
              </div>
            </div>
          </div>

          <div className="relative flex-1" style={{ width: chartWidth, minHeight: 44 }}>
            {zoom === 'day' && Array.from({ length: totalDays }).map((_, i) => {
              const day = addDays(dateRange.minDate, i);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              if (!isWeekend) return null;
              return <div key={`we-${i}`} className="absolute top-0 h-full bg-white/[0.01]" style={{ left: i * zoomConfig.dayWidth, width: zoomConfig.dayWidth }} />;
            })}

            {task.dependsOn?.map(depId => {
              const depTask = tasks.find(t => t.id === depId);
              if (!depTask?.dueDate || !task.startDate) return null;
              const depLeft = daysBetween(dateRange.minDate, startOfDay(new Date(depTask.dueDate))) * zoomConfig.dayWidth;
              const depWidth = depTask.startDate && depTask.dueDate ? Math.max(daysBetween(new Date(depTask.startDate), new Date(depTask.dueDate)) * zoomConfig.dayWidth, 20) : 60;
              const fromX = depLeft + depWidth;
              const toX = barLeft;
              const y = 22;
              return (
                <svg key={`dep-${depId}`} className="absolute top-0 h-full pointer-events-none" style={{ left: 0, width: chartWidth }}>
                  <path d={`M ${fromX} ${y} C ${fromX + 30} ${y}, ${toX - 30} ${y}, ${toX} ${y}`} stroke={isCritical ? '#ef4444' : '#475569'} strokeWidth={isCritical ? 2 : 1} fill="none" markerEnd="url(#arrowhead)" opacity={0.6} />
                </svg>
              );
            })}

            {task.startDate && task.dueDate && (
              <div
                className={`absolute top-2 rounded-md cursor-pointer group transition-all ${isCritical ? 'ring-1 ring-red-500/50' : ''} ${isOverdue ? 'ring-1 ring-red-400' : ''}`}
                style={{ left: barLeft, width: barWidth, height: 28, backgroundColor: barColor, opacity: 0.85 }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDragState({ taskId: task.id, type: 'move', startX: e.clientX, originalStart: task.startDate!, originalEnd: task.dueDate! });
                }}
                onClick={() => handleTaskClick(task)}
              >
                {task.completionPercentage > 0 && (
                  <div className="h-full rounded-l-md" style={{ width: `${task.completionPercentage}%`, backgroundColor: 'rgba(255,255,255,0.25)' }} />
                )}
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white truncate">
                  {task.completionPercentage > 0 ? `${task.completionPercentage}%` : ''}
                </span>
                <div className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/20 rounded-l"
                  onMouseDown={(e) => { e.stopPropagation(); setDragState({ taskId: task.id, type: 'resize-start', startX: e.clientX, originalStart: task.startDate!, originalEnd: task.dueDate! }); }} />
                <div className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/20 rounded-r"
                  onMouseDown={(e) => { e.stopPropagation(); setDragState({ taskId: task.id, type: 'resize-end', startX: e.clientX, originalStart: task.startDate!, originalEnd: task.dueDate! }); }} />
                {isMilestone && (
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: barWidth / 2 }}>
                    <div className="w-4 h-4 rotate-45" style={{ backgroundColor: barColor }} />
                  </div>
                )}
              </div>
            )}

            {!task.startDate && !task.dueDate && (
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: barColor }}
                onClick={() => handleTaskClick(task)}
                title={`${task.title}\nNo dates set`}
              >
                <span className="text-[10px] text-white font-bold">{task.title.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && task.children.map(child => renderTaskRow(child, depth + 1))}
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="card p-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <svg className="absolute w-0 h-0">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#475569" />
          </marker>
        </defs>
      </svg>

      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
              {(Object.keys(ZOOM_CONFIG) as ZoomLevel[]).map(level => (
                <button key={level} onClick={() => setZoom(level)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${zoom === level ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                  {ZOOM_CONFIG[level].label}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-border" />
            <button onClick={expandAll} className="text-xs text-muted-foreground hover:text-foreground">Expand All</button>
            <button onClick={collapseAll} className="text-xs text-muted-foreground hover:text-foreground">Collapse All</button>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={criticalPathEnabled} onChange={(e) => setCriticalPathEnabled(e.target.checked)} className="rounded border-border" />
              <span className="text-muted-foreground">Critical Path</span>
            </label>
            <div className="h-6 w-px bg-border" />
            <button onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${showFilters ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:text-foreground'}`}>
              Filters
            </button>
            <button onClick={() => { setLoading(true); api.tasks.list({ limit: 500, projectId }, accessToken).then((res: any) => { setAllTasks(res.data || []); setTasks(res.data || []); }).catch(console.error).finally(() => setLoading(false)); }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground">
              Refresh
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Project</label>
              <select value={filterState.projectFilter} onChange={(e) => setFilterState(prev => ({ ...prev, projectFilter: e.target.value }))}
                className="w-full bg-muted/30 border border-border rounded-md px-3 py-1.5 text-sm">
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assignee</label>
              <select value={filterState.assigneeFilter} onChange={(e) => setFilterState(prev => ({ ...prev, assigneeFilter: e.target.value }))}
                className="w-full bg-muted/30 border border-border rounded-md px-3 py-1.5 text-sm">
                <option value="">All Assignees</option>
                {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={filterState.statusFilter} onChange={(e) => setFilterState(prev => ({ ...prev, statusFilter: e.target.value }))}
                className="w-full bg-muted/30 border border-border rounded-md px-3 py-1.5 text-sm">
                <option value="">All Statuses</option>
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <select value={filterState.priorityFilter} onChange={(e) => setFilterState(prev => ({ ...prev, priorityFilter: e.target.value }))}
                className="w-full bg-muted/30 border border-border rounded-md px-3 py-1.5 text-sm">
                <option value="">All Priorities</option>
                {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Gantt Chart */}
      <div className="card overflow-hidden" ref={chartRef}>
        <div className="overflow-x-auto">
          <div style={{ width: chartWidth + 288, minWidth: '100%' }}>
            <div className="flex border-b border-border sticky top-0 bg-card z-20">
              <div className="w-72 flex-shrink-0 p-3 border-r border-border font-semibold text-sm bg-card flex items-center justify-between">
                <span>Task Name</span>
                <span className="text-xs text-muted-foreground font-normal">{tasks.length} tasks</span>
              </div>
              <div className="relative h-10" style={{ width: chartWidth }}>
                {timelineHeaders.map((h, i) => (
                  <div key={i} className={`absolute top-0 h-full flex items-end pb-1 px-2 text-xs font-medium ${zoom === 'day' ? 'border-l border-border/30' : ''}`}
                    style={{ left: h.offset, width: h.width }}>
                    <div>
                      <div className="text-muted-foreground">{h.label}</div>
                      {h.sub && <div className="text-[10px] text-muted-foreground/60">{h.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p className="text-lg mb-2">No tasks to display</p>
                <p className="text-sm">{Object.values(filterState).some(v => v) ? 'Try adjusting your filters' : 'Create tasks to see them on the Gantt chart'}</p>
              </div>
            ) : (
              <div>{hierarchy.map(task => renderTaskRow(task, 0))}</div>
            )}
          </div>
        </div>

        {todayOffset >= 0 && todayOffset <= totalDays && (
          <div className="absolute top-0 h-full w-px bg-red-500 z-30 pointer-events-none" style={{ left: 288 + todayOffset * zoomConfig.dayWidth, top: 40 }}>
            <div className="absolute -top-0 -left-3 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-b font-medium">Today</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <span className="font-semibold text-muted-foreground">Status:</span>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground capitalize">{status.replace('_', ' ')}</span>
            </div>
          ))}
          <div className="h-4 w-px bg-border mx-2" />
          <span className="font-semibold text-muted-foreground">Priority:</span>
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground capitalize">{priority}</span>
            </div>
          ))}
          <div className="h-4 w-px bg-border mx-2" />
          <div className="flex items-center gap-1.5"><span className="text-amber-400">◆</span><span className="text-muted-foreground">Milestone</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-px bg-red-500" /><span className="text-muted-foreground">Critical Path</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-px border-t-2 border-dashed border-foreground/40" /><span className="text-muted-foreground">Dependency</span></div>
        </div>
      </div>

      {/* Task Detail Drawer */}
      {showDrawer && selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={() => setShowDrawer(false)} onUpdate={() => {
          api.tasks.list({ limit: 500, projectId }, accessToken).then((res: any) => { setAllTasks(res.data || []); setTasks(res.data || []); }).catch(console.error);
        }} />
      )}
    </div>
  );
}

// ─── Task Detail Drawer ──────────────────────────────────────────────────────

function TaskDetailDrawer({ task, onClose, onUpdate }: { task: GanttTask; onClose: () => void; onUpdate: () => void }) {
  const { accessToken } = useAuth();
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try { await api.tasks.update(task.id, { status: newStatus }, accessToken); onUpdate(); }
    catch (err) { console.error('Failed to update status:', err); }
    finally { setUpdating(false); }
  };

  const handleProgressChange = async (progress: number) => {
    setUpdating(true);
    try { await api.tasks.update(task.id, { completionPercentage: progress }, accessToken); onUpdate(); }
    catch (err) { console.error('Failed to update progress:', err); }
    finally { setUpdating(false); }
  };

  const duration = task.startDate && task.dueDate ? daysBetween(new Date(task.startDate), new Date(task.dueDate)) : 0;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'closed' && task.status !== 'done';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div>
            <h3 className="font-semibold text-lg">{task.title}</h3>
            <p className="text-xs text-muted-foreground font-mono">{task.taskCode}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
        </div>

        <div className="p-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={task.status} onChange={(e) => handleStatusChange(e.target.value)} disabled={updating}
                className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                <span className="text-sm capitalize">{task.priority}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Progress</label>
              <span className="text-sm font-medium">{task.completionPercentage}%</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={task.completionPercentage}
              onChange={(e) => handleProgressChange(Number(e.target.value))} disabled={updating} className="w-full" />
            <div className="h-2 bg-muted/30 rounded-full mt-2 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${task.completionPercentage}%`, backgroundColor: STATUS_COLORS[task.status] || '#3b82f6' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <p className="text-sm">{task.startDate ? formatDate(task.startDate) : 'Not set'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Due Date {isOverdue && <span className="text-red-400">(Overdue!)</span>}</label>
              <p className={`text-sm ${isOverdue ? 'text-red-400 font-medium' : ''}`}>{task.dueDate ? formatDate(task.dueDate) : 'Not set'}</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
            <p className="text-sm">{duration} day{duration !== 1 ? 's' : ''}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Project</label>
              <p className="text-sm">{task.projectName || 'Unknown'}</p>
              {task.projectCode && <p className="text-xs text-muted-foreground font-mono">{task.projectCode}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assignee</label>
              <p className="text-sm">{task.assigneeName || 'Unassigned'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <p className="text-sm capitalize">{task.taskType}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Story Points</label>
              <p className="text-sm">{task.storyPoints || '—'}</p>
            </div>
          </div>

          {task.dependsOn && task.dependsOn.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dependencies ({task.dependsOn.length})</label>
              <div className="space-y-1">
                {task.dependsOn.map(depId => (
                  <div key={depId} className="text-xs text-muted-foreground bg-muted/20 rounded px-2 py-1">Task ID: {depId}</div>
                ))}
              </div>
            </div>
          )}

          {task.description && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
