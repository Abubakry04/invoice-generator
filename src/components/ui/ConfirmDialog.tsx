import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
