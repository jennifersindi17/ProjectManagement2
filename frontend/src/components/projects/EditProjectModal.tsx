'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, X, AlertCircle, User as UserIcon, DollarSign, Tag, FileText, Settings, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ProjectMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: any) => void;
  project: any;
  users: User[];
  token: string;
  projectId: string;
}

const PROJECT_TYPES = [
  'ERP Implementation', 'Web Development', 'Mobile App', 'Infrastructure',
  'Data Migration', 'System Integration', 'Consulting', 'Training', 'Support', 'Other',
];

const CATEGORIES = [
  'Internal', 'Client Project', 'R&D', 'Maintenance', 'Upgrade', 'New Implementation',
];

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'GBP', 'AUD', 'CNY'];
const STATUS_OPTIONS = ['planning', 'analysis', 'development', 'sit', 'uat', 'go_live', 'support', 'closed'];
const RESTRICTED_STATUSES = ['closed', 'cancelled'];
const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'];

export default function EditProjectModal({
  isOpen, onClose, onSave, project, users, token, projectId,
}: EditProjectModalProps) {
  const [activeSection, setActiveSection] = useState('general');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const isRestricted = RESTRICTED_STATUSES.includes(project?.status);

  useEffect(() => {
    if (project && isOpen) {
      const initial: Record<string, any> = {
        name: project.name || '',
        clientName: project.clientName || '',
        description: project.description || '',
        projectType: project.projectType || '',
        category: project.category || '',
        priority: project.priority || 'medium',
        status: project.status || 'planning',
        targetGoLive: project.targetGoLive || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        projectManagerId: project.projectManagerId || '',
        projectSponsor: project.projectSponsor || '',
        deliveryManager: project.deliveryManager || '',
        clientPic: project.clientPic || '',
        budget: project.budget || 0,
        contractValue: project.contractValue || 0,
        currency: project.currency || 'IDR',
        tags: project.tags || [],
        labels: project.labelsJsonb || project.labels || [],
        notes: project.notes || '',
      };
      setFormData(initial);
      setOriginalData(JSON.parse(JSON.stringify(initial)));

      api.projects.members(projectId, token).then((res: any) => {
        const members = Array.isArray(res) ? res : (res.data || []);
        setProjectMembers(members);
        setSelectedMembers(members.map((m: any) => m.userId || m.user_id));
      }).catch(() => {
        setProjectMembers([]);
        setSelectedMembers([]);
      });
    }
  }, [project, isOpen, projectId, token]);

  if (!isOpen || !project) return null;

  const setField = (key: string, value: any) => {
    setFormData((prev: Record<string, any>) => ({ ...prev, [key]: value }));
  };

  const isFieldChanged = (key: string) => {
    const orig = originalData[key];
    const curr = formData[key];
    if (Array.isArray(orig) && Array.isArray(curr)) {
      return JSON.stringify(orig) !== JSON.stringify(curr);
    }
    return orig !== curr;
  };

  const hasChanges = () => {
    const fieldsChanged = Object.keys(formData).some((key) => isFieldChanged(key));
    const oldIds = projectMembers.map((m) => m.userId).sort();
    const newIds = [...selectedMembers].sort();
    return fieldsChanged || JSON.stringify(oldIds) !== JSON.stringify(newIds);
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !formData.tags.includes(val)) {
      setField('tags', [...formData.tags, val]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setField('tags', formData.tags.filter((t: string) => t !== tag));
  };

  const addLabel = () => {
    const val = labelInput.trim();
    if (val && !formData.labels.includes(val)) {
      setField('labels', [...formData.labels, val]);
    }
    setLabelInput('');
  };

  const removeLabel = (label: string) => {
    setField('labels', formData.labels.filter((l: string) => l !== label));
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev: string[]) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Planning', analysis: 'Analysis', development: 'Development',
      sit: 'SIT', uat: 'UAT', go_live: 'Go Live', support: 'Support',
      closed: 'Closed', cancelled: 'Cancelled', on_hold: 'On Hold',
    };
    return labels[status] || status;
  };

  const formatDisplay = (key: string, value: any) => {
    if ((key === 'budget' || key === 'contractValue') && typeof value === 'number') {
      return formatCurrency(value);
    }
    if ((key === 'startDate' || key === 'endDate' || key === 'targetGoLive') && value) {
      return formatDate(value);
    }
    if (key === 'projectManagerId' && value) {
      const user = users.find((u) => u.id === value);
      return user ? `${user.firstName} ${user.lastName}` : String(value);
    }
    if (Array.isArray(value)) return value.join(', ');
    return String(value ?? '-');
  };

  const handleSave = async () => {
    if (isRestricted) {
      setError(`Tidak dapat mengedit project berstatus "${getStatusLabel(project.status)}".`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const changedFields: Record<string, any> = {};
      for (const key of Object.keys(formData)) {
        if (isFieldChanged(key)) {
          changedFields[key] = formData[key];
        }
      }
      const updated = await api.projects.update(projectId, changedFields, token);
      const oldIds = projectMembers.map((m) => m.userId).sort();
      const newIds = [...selectedMembers].sort();
      if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
        await api.projects.updateMembers(projectId, selectedMembers, token);
      }
      onSave(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'input w-full';
  const fieldDisabled = isRestricted;

  const sections = [
    { id: 'general', label: 'Umum', icon: FileText },
    { id: 'management', label: 'Manajemen', icon: UserIcon },
    { id: 'financial', label: 'Keuangan', icon: DollarSign },
    { id: 'additional', label: 'Tambahan', icon: Tag },
    { id: 'system', label: 'Sistem', icon: Info },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div ref={modalRef} className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5" /> Edit Project
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{project.code} • {project.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restricted Warning */}
        {isRestricted && (
          <div className="mx-6 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-yellow-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Project berstatus <strong>{getStatusLabel(project.status)}</strong> — pengeditan dibatasi hanya catatan dan label.</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 overflow-x-auto border-b border-border">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors rounded-t-lg ${
                  activeSection === s.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                <Icon className="w-4 h-4 inline mr-1.5" />{s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">

          {/* GENERAL */}
          {activeSection === 'general' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-sm uppercase tracking-wide">Informasi Umum</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Project Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setField('name', e.target.value)} className={inputClass} placeholder="Project name" disabled={fieldDisabled} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Client</label>
                  <input type="text" value={formData.clientName} onChange={(e) => setField('clientName', e.target.value)} className={inputClass} placeholder="Client name" disabled={fieldDisabled} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Deskripsi Project</label>
                  <textarea value={formData.description} onChange={(e) => setField('description', e.target.value)} className={inputClass} placeholder="Deskripsi project..." rows={3} disabled={fieldDisabled} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipe Project</label>
                  <select value={formData.projectType} onChange={(e) => setField('projectType', e.target.value)} className={inputClass} disabled={fieldDisabled}>
                    <option value="">Pilih tipe...</option>
                    {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select value={formData.category} onChange={(e) => setField('category', e.target.value)} className={inputClass} disabled={fieldDisabled}>
                    <option value="">Pilih kategori...</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioritas</label>
                  <select value={formData.priority} onChange={(e) => setField('priority', e.target.value)} className={inputClass} disabled={fieldDisabled}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setField('status', e.target.value)} className={inputClass} disabled={fieldDisabled}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Go Live</label>
                  <input type="date" value={formData.targetGoLive ? String(formData.targetGoLive).split('T')[0] : ''} onChange={(e) => setField('targetGoLive', e.target.value)} className={inputClass} disabled={fieldDisabled} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                  <input type="date" value={formData.startDate ? String(formData.startDate).split('T')[0] : ''} onChange={(e) => setField('startDate', e.target.value)} className={inputClass} disabled={fieldDisabled} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
                  <input type="date" value={formData.endDate ? String(formData.endDate).split('T')[0] : ''} onChange={(e) => setField('endDate', e.target.value)} className={inputClass} disabled={fieldDisabled} />
                </div>
              </div>
            </div>
          )}

          {/* MANAGEMENT */}
          {activeSection === 'management' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-sm uppercase tracking-wide">Manajemen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Manager</label>
                  <select value={formData.projectManagerId} onChange={(e) => setField('projectManagerId', e.target.value)} className={inputClass} disabled={fieldDisabled}>
                    <option value="">Pilih PM...</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Project Sponsor</label>
                  <input type="text" value={formData.projectSponsor} onChange={(e) => setField('projectSponsor', e.target.value)} className={inputClass} placeholder="Sponsor name" disabled={fieldDisabled} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Client PIC</label>
                  <input type="text" value={formData.clientPic} onChange={(e) => setField('clientPic', e.target.value)} className={inputClass} placeholder="Client contact person" disabled={fieldDisabled} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Delivery Manager</label>
                  <input type="text" value={formData.deliveryManager} onChange={(e) => setField('deliveryManager', e.target.value)} className={inputClass} placeholder="Delivery manager" disabled={fieldDisabled} />
                </div>
              </div>

              {/* Team Members */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Team Members</label>
                <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                  <div className="divide-y divide-border">
                    {users.map((user) => {
                      const isSelected = selectedMembers.includes(user.id);
                      return (
                        <button key={user.id} type="button" onClick={() => !fieldDisabled && toggleMember(user.id)}
                          className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted'} ${fieldDisabled ? 'cursor-not-allowed opacity-60' : ''}`}>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-border'}`}>
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {(user.firstName?.[0] || '?').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                            {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                          </div>
                          {projectMembers.find((m) => (m.userId) === user.id) && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Existing</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{selectedMembers.length} anggota dipilih</p>
              </div>
            </div>
          )}

          {/* FINANCIAL */}
          {activeSection === 'financial' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-sm uppercase tracking-wide">Keuangan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Budget</label>
                  <input type="number" value={formData.budget} onChange={(e) => setField('budget', parseFloat(e.target.value) || 0)} className={inputClass} placeholder="0" disabled={fieldDisabled} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contract Value</label>
                  <input type="number" value={formData.contractValue} onChange={(e) => setField('contractValue', parseFloat(e.target.value) || 0)} className={inputClass} placeholder="0" disabled={fieldDisabled} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select value={formData.currency} onChange={(e) => setField('currency', e.target.value)} className={inputClass} disabled={fieldDisabled}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="card p-4 bg-muted/30">
                <h4 className="text-sm font-medium mb-2">Ringkasan</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-muted-foreground">Budget</p><p className="font-semibold">{formatCurrency(formData.budget)} {formData.currency}</p></div>
                  <div><p className="text-muted-foreground">Contract</p><p className="font-semibold">{formatCurrency(formData.contractValue)} {formData.currency}</p></div>
                  <div><p className="text-muted-foreground">Actual Cost</p><p className="font-semibold">{formatCurrency(project.actualCost || 0)} {formData.currency}</p></div>
                </div>
              </div>
            </div>
          )}

          {/* ADDITIONAL */}
          {activeSection === 'additional' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-sm uppercase tracking-wide">Informasi Tambahan</h3>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {formData.tags?.map((tag: string, i: number) => (
                    <span key={i} className="badge badge-blue flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                    className="input flex-1" placeholder="Tambah tag..." disabled={fieldDisabled} />
                  <button onClick={addTag} className="btn btn-ghost" disabled={fieldDisabled}>Tambah</button>
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium mb-1">Labels</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {formData.labels?.map((label: string, i: number) => (
                    <span key={i} className="badge badge-outline flex items-center gap-1">
                      {label}
                      <button onClick={() => removeLabel(label)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={labelInput} onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); }}}
                    className="input flex-1" placeholder="Tambah label..." />
                  <button onClick={addLabel} className="btn btn-ghost">Tambah</button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setField('notes', e.target.value)} className={inputClass} placeholder="Catatan internal project..." rows={4} />
              </div>
            </div>
          )}

          {/* SYSTEM (Read Only) */}
          {activeSection === 'system' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-sm uppercase tracking-wide">Informasi Sistem (Hanya Baca)</h3>
              <div className="card p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">Project Code</p><p className="font-mono font-medium">{project.code}</p></div>
                  <div><p className="text-muted-foreground text-xs">Project ID</p><p className="font-mono text-xs break-all">{project.id}</p></div>
                  <div><p className="text-muted-foreground text-xs">Created Date</p><p className="font-medium">{formatDate(project.createdAt)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Created By</p><p className="font-medium">{project.createdByName || project.createdBy || '-'}</p></div>
                  <div><p className="text-muted-foreground text-xs">Last Modified</p><p className="font-medium">{formatDate(project.updatedAt)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Completion</p><p className="font-medium">{project.completionPercentage ?? 0}%</p></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Batal</button>
          <div className="flex gap-2 items-center">
            {hasChanges() && <span className="text-xs text-muted-foreground">Ada perubahan belum disimpan</span>}
            <button onClick={() => setConfirmVisible(true)} className="btn btn-primary flex items-center gap-2"
              disabled={saving || !hasChanges() || (isRestricted && !formData.notes && !formData.labels?.length)}>
              {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Menyimpan...</>) : (<><Save className="w-4 h-4" /> Simpan Perubahan</>)}
            </button>
          </div>
        </div>

        {/* Confirm Dialog */}
        {confirmVisible && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Konfirmasi Simpan</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Field yang akan diubah:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {Object.keys(formData).filter((key) => isFieldChanged(key)).map((key) => (
                  <div key={key} className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded">
                    <span className="font-medium min-w-[120px] capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="text-muted-foreground">{formatDisplay(key, formData[key])}</span>
                  </div>
                ))}
                {(() => {
                  const oldIds = projectMembers.map((m) => m.userId).sort();
                  const newIds = [...selectedMembers].sort();
                  if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
                    return (
                      <div className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded">
                        <span className="font-medium min-w-[120px]">Team Members:</span>
                        <span className="text-muted-foreground">{selectedMembers.length} anggota</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <p className="text-sm text-muted-foreground mb-4">Apakah Anda yakin ingin menyimpan perubahan ini?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmVisible(false)} className="btn btn-ghost" disabled={saving}>Batal</button>
                <button onClick={() => { setConfirmVisible(false); handleSave(); }} className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Ya, Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
