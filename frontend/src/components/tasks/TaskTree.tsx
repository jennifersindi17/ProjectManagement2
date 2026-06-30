'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ChevronRight, ChevronDown, GitBranch, MoreVertical, Eye, Edit3, Copy, Plus,
  Trash2, AlertTriangle, Clock, User as UserIcon, GripVertical, Expand, Shrink
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

interface Task {
  id: string;
  title: string;
  taskCode: string;
  status: string;
  priority: string;
  completionPercentage: number;
  level: number;
  parentTaskId: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  estimatedHours?: number;
  hasChildren?: boolean;
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

const INDENT_PX = 32;

export default function TaskTree({
  tasks, projectId, token, users, onTaskUpdated,
  onEditTask, onViewTask, onDuplicateTask, onAddSubtask
}: TaskTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'above' | 'below' | 'inside' | null>(null);
  const [statusMenuTaskId, setStatusMenuTaskId] = useState<string | null>(null);

  // Build children map
  const childrenMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      const pid = t.parentTaskId || '__root__';
      if (!map[pid]) map[pid] = [];
      map[pid].push(t);
    }
    // Sort each group by position
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.level || 1) - (b.level || 1));
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
    const parentIds = new Set<string>();
    for (const t of tasks) {
      if (t.parentTaskId) parentIds.add(t.parentTaskId);
    }
    setExpandedIds(prev => {
      const next = new Set(prev);
      parentIds.forEach(id => next.add(id));
      return next;
    });
  }, [tasks]);

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

  // Filter: keep matched tasks + their parent chain
  const matchedTaskIds = useMemo(() => {
    if (!filterText.trim()) return null;
    const lower = filterText.toLowerCase();
    const matched = new Set<string>();
    for (const t of tasks) {
      if (t.title.toLowerCase().includes(lower) || t.taskCode.toLowerCase().includes(lower)) {
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
  }, [filterText, tasks, taskMap]);

  // Recursive render function
  const renderTask = (task: Task, siblingIndex: number, totalSiblings: number) => {
    const depth = (task.level || 1) - 1;
    const hasChildren = (childrenMap[task.id] || []).length > 0;
    const isExpanded = expandedIds.has(task.id);
    const children = childrenMap[task.id] || [];
    const levelColor = LEVEL_COLORS[depth] || LEVEL_COLORS[4];
    const indentPx = depth * INDENT_PX;

    // Filter visibility
    if (matchedTaskIds && !matchedTaskIds.has(task.id)) return null;

    const isDragOver = dragOverTaskId === task.id;

    return (
      <React.Fragment key={task.id}>
        <div
          className={`group flex items-center gap-1 relative cursor-pointer transition-colors border-l-[3px] ${levelColor.border} ${isDragOver ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/30'}`}
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
            // Determine new parent based on drop position
            let newParentId: string | null = null;
            if (dragPosition === 'inside') {
              newParentId = task.id;
            } else {
              // above or below: use same parent as target
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
              <p className="font-medium text-sm truncate flex-1">{task.title}</p>
              {hasChildren && (
                <span className="text-[10px] bg-foreground/5 text-foreground/60 px-1.5 py-0.5 rounded-full shrink-0 font-medium tabular-nums">
                  {children.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{task.taskCode}</span>
              {(() => {
                const u = users.find(u => u.id === task.assigneeId);
                if (!u) return null;
                return <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{u.firstName} {u.lastName}</span>;
              })()}
              {task.dueDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(task.dueDate)}</span>}
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

  const rootTasks = childrenMap['__root__'] || [];

  return (
    <div className="space-y-2">
      {/* Toolbar: Filter + Expand All / Collapse All */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          placeholder="Filter tasks..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="input input-sm flex-1"
        />
        <button className="btn btn-ghost btn-sm" onClick={expandAll} title="Expand All">
          <Expand className="w-4 h-4" />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={collapseAll} title="Collapse All">
          <Shrink className="w-4 h-4" />
        </button>
      </div>

      {/* Tree */}
      <div className="border rounded-lg overflow-hidden bg-card/50">
        {rootTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No tasks yet</div>
        ) : (
          rootTasks.map((task, idx) => renderTask(task, idx, rootTasks.length))
        )}
      </div>
    </div>
  );
}
