import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/40">
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} icon={actionIcon} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
