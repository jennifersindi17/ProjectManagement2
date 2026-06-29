'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, AlertCircle, CheckCircle, GitBranch } from 'lucide-react';
import { api } from '@/lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface ParentTask {
  id: string;
  title: string;
  taskCode?: string;
  projectId: string;
  projectName?: string;
}

interface AddSubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newTask: any) => void;
  parentTask: ParentTask;
  token: string;
  users: User[];
}

const STATUS_OPTIONS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  testing: 'Testing',
  done: 'Done',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
};

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function AddSubtaskModal({
  isOpen,
  onClose,
  onSuccess,
  parentTask,
  token,
  users,
}: AddSubtaskModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setStartDate('');
      setDueDate('');
      setPriority('medium');
      setStatus('todo');
      setErrors({});
      setSuccessMessage('');
      requestAnimationFrame(() => {
        setIsVisible(true);
        setTimeout(() => titleRef.current?.focus(), 100);
      });
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setErrors({ title: 'Subtask name is required' });
      return;
    }
    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      setErrors({ dueDate: 'Due date cannot be before start date' });
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        taskType: 'subtask',
        projectId: parentTask.projectId,
        parentTaskId: parentTask.id,
        assigneeId: assigneeId || undefined,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
      };

      const newTask: any = await api.tasks.create(data, token);
      setSuccessMessage(`Subtask "${newTask.title}" created successfully`);
      setTimeout(() => {
        if (onSuccess) onSuccess(newTask);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to create subtask' });
    } finally {
      setSaving(false);
    }
  }, [title, description, assigneeId, startDate, dueDate, priority, status, parentTask, token, onSuccess, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSave]);

  if (!isOpen) return null;

  const renderField = (label: string, errorKey: string, children: React.ReactNode) => (
    <div>
      <label className="label">{label}</label>
      {children}
      {errors[errorKey] && (
        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errors[errorKey]}
        </p>
      )}
    </div>
  );

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        <div
          ref={modalRef}
          className={`relative w-full max-w-xl bg-card rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <GitBranch className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Add Subtask</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Under: <span className="font-medium text-foreground">{parentTask.title}</span>
                  <span className="text-muted-foreground/60">({parentTask.taskCode})</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5">
            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMessage}
              </div>
            )}
            {errors.form && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.form}
              </div>
            )}

            {/* Inherited info badge */}
            <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Project: <span className="text-foreground font-medium">{parentTask.projectName || 'Auto-inherited'}</span>
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Parent: <span className="text-foreground font-medium">{parentTask.title}</span>
              </div>
            </div>

            {/* Subtask Name */}
            {renderField('Subtask Name *', 'title', (
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter subtask name..."
                disabled={saving || !!successMessage}
              />
            ))}

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="input min-h-[80px] resize-y"
                placeholder="Describe the subtask..."
                disabled={saving || !!successMessage}
              />
            </div>

            {/* Assignment & Dates */}
            <div className="grid grid-cols-2 gap-4">
              {renderField('Assignee', 'assigneeId', (
                <select
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                  className="input"
                  disabled={saving || !!successMessage}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              ))}
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
                {renderField('Due Date', 'dueDate', (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={`input ${errors.dueDate ? 'border-red-500' : ''}`}
                    disabled={saving || !!successMessage}
                  />
                ))}
              </div>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="input"
                  disabled={saving || !!successMessage}
                >
                  {Object.entries(STATUS_OPTIONS).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="input"
                  disabled={saving || !!successMessage}
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border sticky bottom-0 bg-card rounded-b-xl">
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">ESC</kbd> to close &middot;{' '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">CTRL+ENTER</kbd> to create
            </p>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="btn btn-ghost" disabled={saving || !!successMessage}>Cancel</button>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving || !!successMessage}>
                <Plus className="w-4 h-4 mr-1.5" />
                {saving ? 'Creating...' : successMessage ? 'Created!' : 'Create Subtask'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
