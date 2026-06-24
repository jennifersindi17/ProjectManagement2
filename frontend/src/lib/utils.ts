import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Project status
    planning: 'badge-blue', analysis: 'badge-blue', development: 'badge-yellow',
    sit: 'badge-yellow', uat: 'badge-yellow', go_live: 'badge-green',
    support: 'badge-green', closed: 'badge-gray', on_hold: 'badge-yellow', cancelled: 'badge-red',
    // Task status
    backlog: 'badge-gray', todo: 'badge-blue', in_progress: 'badge-yellow',
    review: 'badge-yellow', testing: 'badge-yellow', done: 'badge-green',
    blocked: 'badge-red',
    // Health
    green: 'badge-green', yellow: 'badge-yellow', red: 'badge-red',
    // Priority
    critical: 'badge-red', high: 'badge-yellow', medium: 'badge-blue', low: 'badge-gray',
    // Timesheet
    draft: 'badge-gray', submitted: 'badge-blue', approved: 'badge-green', rejected: 'badge-red',
    // Issue
    open: 'badge-red', investigation: 'badge-yellow', fixed: 'badge-green', reopened: 'badge-red',
    // Risk
    identified: 'badge-blue', assessed: 'badge-yellow', mitigated: 'badge-green', monitoring: 'badge-green',
    occurred: 'badge-red',
  };
  return colors[status] || 'badge-gray';
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getHealthEmoji(health: string): string {
  return health === 'green' ? '🟢' : health === 'yellow' ? '🟡' : '🔴';
}

export function getPriorityEmoji(priority: string): string {
  return priority === 'critical' ? '🔴' : priority === 'high' ? '🟠' : priority === 'medium' ? '🟡' : '🟢';
}
