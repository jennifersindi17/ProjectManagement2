'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  taskType: string;
  assigneeId?: string;
  reporterId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  completionPercentage?: number;
  parentTaskId?: string;
  labels?: string[];
  projectId?: string;
}

export interface DuplicateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newTask: Task) => void;
  task: Task;
  projectId: string;
  token: string;
  users: User[];
}

const TASK_TYPE_OPTIONS = [
  { value: 'task', label: 'Task' },
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'epic', label: 'Epic' },
  { value: 'story', label: 'Story' },
  { value: 'subtask', label: 'Subtask' },
  { value: 'milestone', label: 'Milestone' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DuplicateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  task,
  projectId,
  token,
  users = [],
}: DuplicateTaskModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Editable fields
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taskType, setTaskType] = useState('task');

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // ─── Initialize form from original task ─────────────────────────────────

  useEffect(() => {
    if (isOpen && task) {
      setTitle(`${task.title} (Copy)`);
      setAssigneeId(task.assigneeId || '');
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setTaskType(task.taskType || 'task');
      setErrors({});
      setSuccessMessage('');

      requestAnimationFrame(() => {
        setIsVisible(true);
        setTimeout(() => titleRef.current?.focus(), 100);
      });
    } else if (!isOpen) {
      setIsVisible(false);
    }
  }, [isOpen, task]);

  // ─── Save handler ────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setErrors({ title: 'Task name is required' });
      return;
    }
    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      setErrors({ dueDate: 'Due date cannot be before start date' });
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // Send only overrides (fields that differ from original)
      const overrides: any = { title: title.trim() };

      // Only include assigneeId if it changed
      if (assigneeId !== (task.assigneeId || '')) {
        overrides.assigneeId = assigneeId || undefined;
      }

      // Only include dates if they were changed
      if (startDate !== (task.startDate || '')) {
        overrides.startDate = startDate || undefined;
      }
      if (dueDate !== (task.dueDate || '')) {
        overrides.dueDate = dueDate || undefined;
      }

      // Only include taskType if changed
      if (taskType !== task.taskType) {
        overrides.taskType = taskType;
      }

      const newTask = await api.tasks.duplicate(task.id, overrides, token);

      // Show success message briefly before closing
      setSuccessMessage(`Task duplicated successfully as "${(newTask as any).title}"`)

      // Auto-close after 1.5s and trigger parent refresh
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(newTask as Task);
        }
        onClose();
      }, 1500);

    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to duplicate task' });
    } finally {
      setSaving(false);
    }
  }, [title, assigneeId, startDate, dueDate, taskType, task, token, onSuccess, onClose]);

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSave]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div
          ref={modalRef}
          className={`relative w-full max-w-lg bg-card rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Copy className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Duplicate Task</h2>
                <p className="text-xs text-muted-foreground">
                  Copy task from: <span className="font-medium">{task.title}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5">
            {/* Success message */}
            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMessage}
              </div>
            )}

            {/* Global error */}
            {errors.form && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.form}
              </div>
            )}

            {/* Editable Fields Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
                Editable Fields
              </h3>

              {/* Task Name */}
              <div>
                <label className="label">Task Name *</label>
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={`input ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="Enter task name..."
                  disabled={saving || !!successMessage}
                />
                {errors.title && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Assignee */}
              <div>
                <label className="label">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                  className="input"
                  disabled={saving || !!successMessage}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="input"
                    disabled={saving || !!successMessage}
                  />
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={`input ${errors.dueDate ? 'border-red-500' : ''}`}
                    disabled={saving || !!successMessage}
                  />
                  {errors.dueDate && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.dueDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Milestone toggle */}
              <div>
                <label className="label">Task Type</label>
                <select
                  value={taskType}
                  onChange={e => setTaskType(e.target.value)}
                  className="input"
                  disabled={saving || !!successMessage}
                >
                  {TASK_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Copied Fields Info Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
                Copied from Original
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Description</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Checklist</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Estimated Hours</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Attachments</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Tags</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Priority</span>
                </div>
              </div>
            </div>

            {/* Not Copied Fields Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
                Not Copied (Reset)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>• Comments</div>
                <div>• Activity Log</div>
                <div>• Actual Hours</div>
                <div>• Progress (reset to 0%)</div>
                <div>• Status (reset to To Do)</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border sticky bottom-0 bg-card rounded-b-xl">
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">ESC</kbd> to close &middot;{' '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">CTRL+ENTER</kbd> to duplicate
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="btn btn-ghost"
                disabled={saving || !!successMessage}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={saving || !!successMessage}
              >
                <Copy className="w-4 h-4 mr-1.5" />
                {saving
                  ? 'Duplicating...'
                  : successMessage
                    ? 'Duplicated!'
                    : 'Duplicate Task'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
