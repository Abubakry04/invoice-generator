import React from 'react';
import { InvoiceStatus } from '../../types';

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  InvoiceStatus,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  draft: {
    label: 'Draft',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
  sent: {
    label: 'Sent',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    border: 'border-blue-200 dark:border-blue-800',
  },
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  overdue: {
    label: 'Overdue',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500 animate-pulse',
    border: 'border-rose-200 dark:border-rose-800',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const config = statusConfig[status] || statusConfig.draft;

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="capitalize">{config.label}</span>
    </span>
  );
};
