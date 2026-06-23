const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions {
  method?: string;
  body?: any;
  token?: string;
  params?: Record<string, string>;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, token, params } = options;
  
  const url = new URL(`${API_URL}${path}`);
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
    list: (params?: any, token?: string) => apiFetch('/users', { token, params }),
    get: (id: string, token: string) => apiFetch(`/users/${id}`, { token }),
    create: (data: any, token: string) => apiFetch('/users', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/users/${id}`, { method: 'PATCH', body: data, token }),
    delete: (id: string, token: string) => apiFetch(`/users/${id}`, { method: 'DELETE', token }),
  },
  projects: {
    list: (params?: any, token?: string) => apiFetch('/projects', { token, params }),
    get: (id: string, token: string) => apiFetch(`/projects/${id}`, { token }),
    create: (data: any, token: string) => apiFetch('/projects', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/projects/${id}`, { method: 'PATCH', body: data, token }),
    delete: (id: string, token: string) => apiFetch(`/projects/${id}`, { method: 'DELETE', token }),
  },
  tasks: {
    list: (params?: any, token?: string) => apiFetch('/tasks', { token, params }),
    get: (id: string, token: string) => apiFetch(`/tasks/${id}`, { token }),
    create: (data: any, token: string) => apiFetch('/tasks', { method: 'POST', body: data, token }),
    update: (id: string, data: any, token: string) => apiFetch(`/tasks/${id}`, { method: 'PATCH', body: data, token }),
    delete: (id: string, token: string) => apiFetch(`/tasks/${id}`, { method: 'DELETE', token }),
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
