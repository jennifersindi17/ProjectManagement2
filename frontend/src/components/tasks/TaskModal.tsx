'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';
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
  dependsOn?: string[];
  storyPoints?: number;
  projectId?: string;
}

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskSaveData) => Promise<boolean> | void;
  task?: Task;
  projectId: string;
  token: string;
  users: User[];
  parentTasks?: Task[];
  mode?: 'add' | 'edit' | 'view';
}

export interface TaskSaveData {
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
  storyPoints?: number;
  projectId: string;
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id?: string;
  title: string;
  completed: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

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

const TASK_TYPE_OPTIONS = [
  { value: 'task', label: 'Task' },
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'epic', label: 'Epic' },
  { value: 'story', label: 'Story' },
  { value: 'subtask', label: 'Subtask' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  projectId,
  token,
  users = [],
  parentTasks = [],
  mode: modalMode,
}: TaskModalProps) {
  const isEditMode = !!task && modalMode !== 'view';
  const isViewMode = modalMode === 'view';
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [reporterId, setReporterId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [actualHours, setActualHours] = useState<string>('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [parentTaskId, setParentTaskId] = useState('');
  const [taskType, setTaskType] = useState('task');
  const [tagsInput, setTagsInput] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // ─── Populate form for edit mode ─────────────────────────────────────────

  useEffect(() => {
    if (task && isEditMode) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAssigneeId(task.assigneeId || '');
      setReporterId(task.reporterId || '');
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setEstimatedHours(task.estimatedHours?.toString() || '');
      setActualHours(task.actualHours?.toString() || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'medium');
      setCompletionPercentage(task.completionPercentage || 0);
      setParentTaskId(task.parentTaskId || '');
      setTaskType(task.taskType || 'task');
      setTagsInput(task.labels?.join(', ') || '');
      setHasChanges(false);

      // Fetch existing checklist
      if (token) {
        api.tasks.checklist(task.id, token).then((items: any[]) => {
          if (items && items.length > 0) {
            setChecklist(items.map((item: any) => ({
              id: item.id,
              title: item.title,
              completed: item.completed,
            })));
          }
        }).catch(() => {});
      }
    }
  }, [task, isEditMode, token]);

  // ─── Reset form for add mode ─────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setReporterId('');
    setStartDate('');
    setDueDate('');
    setEstimatedHours('');
    setActualHours('');
    setStatus('todo');
    setPriority('medium');
    setCompletionPercentage(0);
    setParentTaskId('');
    setTaskType('task');
    setTagsInput('');
    setChecklist([]);
    setErrors({});
    setHasChanges(false);
    setShowUnsavedConfirm(false);
  }, []);

  // ─── Open/Close animation ────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      if (!isEditMode) {
        resetForm();
      }
      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        setIsVisible(true);
        // Focus title input
        setTimeout(() => titleRef.current?.focus(), 100);
      });
    } else {
      setIsVisible(false);
    }
  }, [isOpen, isEditMode, resetForm]);

  // ─── Track changes (skip initial populate) ─────────────────────────────

  const isPopulating = useRef(true);

  useEffect(() => {
    if (isOpen) {
      // Mark as populating on first open for edit mode
      if (task && isEditMode) {
        isPopulating.current = true;
      }
    }
  }, [isOpen, task, isEditMode]);

  useEffect(() => {
    if (!isOpen) return;
    // Skip the change tracking during initial populate
    if (isPopulating.current) {
      isPopulating.current = false;
      return;
    }
    setHasChanges(true);
  }, [
    title, description, assigneeId, reporterId, startDate, dueDate,
    estimatedHours, actualHours, status, priority, completionPercentage,
    parentTaskId, taskType, tagsInput, checklist,
    isOpen,
  ]);



  // ─── Save handler ────────────────────────────────────────────────────────

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleSave = useCallback(async () => {
    // Validate
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
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        taskType,
        assigneeId: assigneeId || undefined,
        reporterId: reporterId || undefined,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        actualHours: actualHours ? parseFloat(actualHours) : undefined,
        completionPercentage,
        parentTaskId: parentTaskId || undefined,
        labels: tags.length > 0 ? tags : undefined,
        projectId,
        checklist: checklist.length > 0 ? checklist : undefined,
      };

      const result = await onSave(data);

      if (result === false) {
        return;
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setErrors({ form: err.message || 'Failed to save task' });
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  }, [title, description, status, priority, taskType, assigneeId, reporterId,
      startDate, dueDate, estimatedHours, actualHours, completionPercentage,
      parentTaskId, tagsInput, projectId, checklist, onSave]);

  // ─── Close handler with unsaved changes check ────────────────────────────

  const handleClose = useCallback(() => {
    if (hasChanges && (title.trim() || description.trim())) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  }, [hasChanges, title, description, onClose]);

  const confirmClose = () => {
    setShowUnsavedConfirm(false);
    onClose();
  };

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handleSave]);

  // ─── Checklist handlers ──────────────────────────────────────────────────

  const addChecklistItem = () => {
    setChecklist(prev => [...prev, { title: '', completed: false }]);
    setHasChanges(true);
  };

  const updateChecklistItem = (index: number, field: keyof ChecklistItem, value: string | boolean) => {
    setChecklist(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setHasChanges(true);
  };

  const removeChecklistItem = (index: number) => {
    setChecklist(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  // ─── Render helpers ──────────────────────────────────────────────────────

  const renderField = (
    label: string,
    errorKey: string,
    children: React.ReactNode
  ) => (
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

  const renderSection = (
    sectionTitle: string,
    children: React.ReactNode
  ) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
        {sectionTitle}
      </h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );

  // ─── Don't render if not open ────────────────────────────────────────────

  if (!isOpen) return null;

  // ─── Main render ─────────────────────────────────────────────────────────

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
          onClick={handleClose}
        />

        {/* Modal Content */}
        <div
          ref={modalRef}
          className={`relative w-full max-w-2xl bg-card rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10 rounded-t-xl">
            <h2 className="text-lg font-semibold">
              {isEditMode ? 'Edit Task' : 'New Task'}
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-6">
            {/* Global error */}
            {errors.form && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.form}
              </div>
            )}

            {/* Section 1: General Information */}
            {renderSection('General Information', (
              <>
                <div className="col-span-2">
                  {renderField('Task Name *', 'title', (
                    <input
                      ref={titleRef}
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className={`input ${errors.title ? 'border-red-500' : ''}`}
                      placeholder="Enter task name..."
                      disabled={isViewMode}
                    />
                  ))}
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="input min-h-[80px] resize-y"
                    placeholder="Describe the task..."
                    disabled={isViewMode}
                  />
                </div>
              </>
            ))}

            {/* Section 2: Assignment */}
            {renderSection('Assignment', (
              <>
                {renderField('Assignee', 'assigneeId', (
                  <select
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="input"
                    disabled={isViewMode}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                ))}
                {renderField('Reporter', 'reporterId', (
                  <select
                    value={reporterId}
                    onChange={e => setReporterId(e.target.value)}
                    className="input"
                    disabled={isViewMode}
                  >
                    <option value="">No Reporter</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                ))}
              </>
            ))}

            {/* Section 3: Planning */}
            {renderSection('Planning', (
              <>
                {renderField('Start Date', 'startDate', (
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="input"
                    disabled={isViewMode}
                  />
                ))}
                {renderField('Due Date', 'dueDate', (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={`input ${errors.dueDate ? 'border-red-500' : ''}`}
                    disabled={isViewMode}
                  />
                ))}
                <div>
                  <label className="label">Estimated Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedHours}
                    onChange={e => setEstimatedHours(e.target.value)}
                    className="input"
                    placeholder="0"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label className="label">Actual Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={actualHours}
                    onChange={e => setActualHours(e.target.value)}
                    className="input"
                    placeholder="0"
                    disabled={isViewMode}
                  />
                </div>
              </>
            ))}

            {/* Section 4: Status */}
            {renderSection('Status', (
              <>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="input"
                    disabled={isViewMode}
                  >
                    {Object.entries(STATUS_OPTIONS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="input"
                    disabled={isViewMode}
                  >
                    {PRIORITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">
                    Progress: {completionPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={completionPercentage}
                    onChange={e => setCompletionPercentage(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    disabled={isViewMode}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </>
            ))}

            {/* Section 5: Hierarchy */}
            {renderSection('Hierarchy', (
              <>
                <div className="col-span-2">
                  <label className="label">Parent Task</label>
                  <select
                    value={parentTaskId}
                    onChange={e => setParentTaskId(e.target.value)}
                    className="input"
                    disabled={isViewMode}
                  >
                    <option value="">No Parent</option>
                    {parentTasks
                      .filter(pt => pt.id !== task?.id)
                      .map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.title}</option>
                      ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Task Type</label>
                  <div className="flex items-center gap-4">
                    <select
                      value={taskType}
                      onChange={e => setTaskType(e.target.value)}
                      className="input flex-1"
                      disabled={isViewMode}
                    >
                      {TASK_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={taskType === 'milestone'}
                        onChange={e => setTaskType(e.target.checked ? 'milestone' : 'task')}
                        className="w-4 h-4 rounded border-border"
                        disabled={isViewMode}
                      />
                      <span className="text-sm">Milestone</span>
                    </label>
                  </div>
                </div>
              </>
            ))}

            {/* Section 6: Additional */}
            {renderSection('Additional', (
              <>
                <div className="col-span-2">
                  <label className="label">Tags</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    className="input"
                    placeholder="tag1, tag2, tag3 (comma-separated)"
                    disabled={isViewMode}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate tags with commas
                  </p>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Checklist</label>
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={addChecklistItem}
                        className="btn btn-ghost text-xs h-7 px-2"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Item
                      </button>
                    )}
                  </div>
                  {checklist.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No checklist items yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {checklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={e => updateChecklistItem(index, 'completed', e.target.checked)}
                            className="w-4 h-4 rounded border-border shrink-0"
                          />
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => updateChecklistItem(index, 'title', e.target.value)}
                            className="input flex-1 text-sm"
                            placeholder="Checklist item..."
                          />
                          <button
                            type="button"
                            onClick={() => removeChecklistItem(index)}
                            className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border sticky bottom-0 bg-card rounded-b-xl">
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">ESC</kbd> to close &middot;{' '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">CTRL+S</kbd> to save
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="btn btn-ghost"
                disabled={saving}
              >
                {isViewMode ? 'Close' : 'Cancel'}
              </button>
              {!isViewMode && (
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {saving
                    ? 'Saving...'
                    : isEditMode
                      ? 'Update Task'
                      : 'Create Task'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Confirm Dialog */}
      {showUnsavedConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowUnsavedConfirm(false)} />
          <div className="relative bg-card rounded-xl border border-border shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-500/10 rounded-full">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="font-semibold">Unsaved Changes</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              You have unsaved changes. Are you sure you want to close without saving?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowUnsavedConfirm(false)}
                className="btn btn-ghost"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmClose}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
