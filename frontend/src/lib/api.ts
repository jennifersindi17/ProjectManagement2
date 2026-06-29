const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface FetchOptions {
  method?: string;
  body?: any;
  token?: string;
  params?: Record<string, string>;
}

interface TaskStats {
  total: number;
  myTasks: number;
  overdue: number;
  dueToday: number;
  inProgress: number;
  completed: number;
  priorityBreakdown: { priority: string; count: string }[];
  statusBreakdown: { status: string; count: string }[];
}

interface Task {
  id: string;
  taskCode: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  taskType?: string;
  projectName?: string;
  projectCode?: string;
  assignee?: { firstName: string; lastName: string; avatar?: string } | null;
  dueDate?: string;
  startDate?: string;
  completionPercentage?: number;
  labels?: string[];
  createdAt?: string;
}

interface MyTasksGroup {
  assigned: Task[];
  dueToday: Task[];
  upcoming: Task[];
  overdue: Task[];
  completed: Task[];
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, token, params } = options;
  
  const url = new URL(`${API_BASE}${path}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) => apiFetch('/auth/login', { method: 'POST', body: { email, password } }),
    register: (data: any, token: string) => apiFetch('/auth/register', { method: 'POST', body: data, token }),
    refresh: (refreshToken: string) => apiFetch('/auth/refresh', { method: 'POST', body: { refreshToken } }),
    logout: (token: string) => apiFetch('/auth/logout', { method: 'POST', token }),
    me: (token: string) => apiFetch('/auth/me', { token }),
  },
  users: {
    list: (params?: any, token?: string): Promise<{ data: any[]; meta: any }> => apiFetch('/users', { token, params }),
    get: (id: string, token: string) => apiFetch(`/users/${id}`, { token }),
    create: (data: any, token: string) => apiFetch('/users', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/users/${id}`, { method: 'PATCH', body: data, token }),
    delete: (id: string, token: string) => apiFetch(`/users/${id}`, { method: 'DELETE', token }),
  },
  projects: {
    list: (params?: any, token?: string): Promise<{ data: any[]; meta: any }> => apiFetch('/projects', { token, params }),
    get: (id: string, token: string) => apiFetch(`/projects/${id}`, { token }),
    overview: (id: string, token: string) => apiFetch(`/projects/${id}/overview`, { token }),
    create: (data: any, token: string) => apiFetch('/projects', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/projects/${id}`, { method: 'PATCH', body: data, token }),
    delete: (id: string, token: string) => apiFetch(`/projects/${id}`, { method: 'DELETE', token }),
    members: (id: string, token: string): Promise<any[]> => apiFetch(`/projects/${id}/members`, { token }),
    updateMembers: (id: string, memberIds: string[], token: string) =>
      apiFetch(`/projects/${id}/members`, { method: 'PUT', body: { memberIds }, token }),
  },
  tasks: {
    list: (params?: any, token?: string): Promise<{ data: Task[]; meta: { page: number; limit: number; total: number; totalPages: number } }> => apiFetch('/tasks', { token, params }),
    get: (id: string, token: string) => apiFetch(`/tasks/${id}`, { token }),
    create: (data: any, token: string) => apiFetch('/tasks', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/tasks/${id}`, { method: 'PATCH', body: data, token }),
    delete: (id: string, token: string) => apiFetch(`/tasks/${id}`, { method: 'DELETE', token }),
    stats: (token: string): Promise<TaskStats> => apiFetch('/tasks/center/stats', { token }),
    kanban: (token: string, projectId?: string): Promise<{ columns: Record<string, Task[]>; total: number }> =>
      apiFetch(`/tasks/center/kanban${projectId ? `?projectId=${projectId}` : ''}`, { token }),
    calendar: (start: string, end: string, projectId: string | undefined, token: string): Promise<Task[]> =>
      apiFetch(`/tasks/center/calendar?start=${start}&end=${end}${projectId ? `&projectId=${projectId}` : ''}`, { token }),
    myTasks: (token: string): Promise<MyTasksGroup> => apiFetch('/tasks/center/my-tasks', { token }),
    tags: (token: string): Promise<string[]> => apiFetch('/tasks/center/tags', { token }),
    comments: (taskId: string, token: string): Promise<any[]> => apiFetch(`/tasks/${taskId}/comments`, { token }),
    addComment: (taskId: string, content: string, token: string) => apiFetch(`/tasks/${taskId}/comments`, { method: 'POST', body: { content }, token }),
    checklist: (taskId: string, token: string): Promise<any[]> => apiFetch(`/tasks/${taskId}/checklist`, { token }),
    addChecklist: (taskId: string, title: string, token: string) => apiFetch(`/tasks/${taskId}/checklist`, { method: 'POST', body: { title }, token }),
    toggleChecklist: (taskId: string, itemId: string, completed: boolean, token: string) =>
      apiFetch(`/tasks/${taskId}/checklist/${itemId}`, { method: 'PATCH', body: { completed }, token }),
    activity: (taskId: string, token: string): Promise<any[]> => apiFetch(`/tasks/${taskId}/activity`, { token }),
    duplicate: (taskId: string, data: any, token: string) =>
      apiFetch(`/tasks/${taskId}/duplicate`, { method: 'POST', body: data, token }),
    subtasks: (taskId: string, token: string): Promise<any[]> =>
      apiFetch(`/tasks/${taskId}/subtasks`, { token }),
    taskTree: (projectId: string, token: string): Promise<any[]> =>
      apiFetch(`/tasks/tree/${projectId}`, { token }),
    recalculate: (projectId: string, token: string): Promise<{ progress: number }> =>
      apiFetch(`/tasks/recalculate/${projectId}`, { method: 'POST', token }),
    bulkStatus: (taskIds: string[], status: string, token: string) =>
      apiFetch('/tasks/bulk/status', { method: 'PATCH', body: { taskIds, status }, token }),
    bulkDelete: (taskIds: string[], token: string) =>
      apiFetch('/tasks/bulk/delete', { method: 'DELETE', body: { taskIds }, token }),
  },
  sprints: {
    list: (projectId: string, token: string) => apiFetch(`/sprints?projectId=${projectId}`, { token }),
    create: (data: any, token: string) => apiFetch('/sprints', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/sprints/${id}`, { method: 'PATCH', body: data, token }),
  },
  timesheets: {
    list: (params?: any, token?: string) => apiFetch('/timesheets', { token, params }),
    create: (data: any, token: string) => apiFetch('/timesheets', { method: 'POST', body: data, token }),
    approve: (id: string, token: string) => apiFetch(`/timesheets/${id}/approve`, { method: 'PATCH', token }),
    reject: (id: string, reason: string, token: string) => apiFetch(`/timesheets/${id}/reject`, { method: 'PATCH', body: { reason }, token }),
  },
  issues: {
    list: (params?: any, token?: string) => apiFetch('/issues', { token, params }),
    create: (data: any, token: string) => apiFetch('/issues', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/issues/${id}`, { method: 'PATCH', body: data, token }),
  },
  risks: {
    list: (projectId: string, token: string) => apiFetch(`/risks?projectId=${projectId}`, { token }),
    create: (data: any, token: string) => apiFetch('/risks', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/risks/${id}`, { method: 'PATCH', body: data, token }),
  },
  changeRequests: {
    list: (params?: any, token?: string) => apiFetch('/change-requests', { token, params }),
    create: (data: any, token: string) => apiFetch('/change-requests', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/change-requests/${id}`, { method: 'PATCH', body: data, token }),
  },
  documents: {
    list: (params?: any, token?: string) => apiFetch('/documents', { token, params }),
    create: (data: any, token: string) => apiFetch('/documents', { method: 'POST', body: data, token }),
  },
  meetings: {
    list: (params?: any, token?: string) => apiFetch('/meetings', { token, params }),
    create: (data: any, token: string) => apiFetch('/meetings', { method: 'POST', body: data, token }),
  },
  notifications: {
    list: (token: string, params?: any) => apiFetch('/notifications', { token, params }),
    markRead: (id: string, token: string) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH', token }),
    markAllRead: (token: string) => apiFetch('/notifications/read-all', { method: 'PATCH', token }),
    unreadCount: (token: string) => apiFetch('/notifications/unread-count', { token }),
  },
  dashboard: {
    stats: (token: string) => apiFetch('/dashboard/stats', { token }),
    projects: (token: string) => apiFetch('/dashboard/projects', { token }),
    activities: (token: string) => apiFetch('/dashboard/activities', { token }),
  },
  budget: {
    list: (projectId: string, token: string) => apiFetch(`/budget?projectId=${projectId}`, { token }),
    summary: (projectId: string, token: string) => apiFetch(`/budget/summary?projectId=${projectId}`, { token }),
    create: (data: any, token: string) => apiFetch('/budget', { method: 'POST', body: data, token }),
  },
  audit: {
    list: (params: any, token: string) => apiFetch('/audit', { token, params }),
  },
};
