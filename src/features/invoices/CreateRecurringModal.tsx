import React, { useState } from 'react';
import {
  Repeat,
  X,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Invoice, RecurringFrequency } from '../../types';
import { useRecurringStore, computeNextRunDate } from '../../store/recurringStore';
import { getTodayDateString } from '../../lib/dates';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

interface CreateRecurringModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly Retainer (Every month)' },
  { value: 'biweekly', label: 'Bi-Weekly (Every 2 weeks)' },
  { value: 'weekly', label: 'Weekly (Every 7 days)' },
  { value: 'quarterly', label: 'Quarterly (Every 3 months)' },
  { value: 'annually', label: 'Annually (Every year)' },
];

export const CreateRecurringModal: React.FC<CreateRecurringModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const { addSchedule } = useRecurringStore();

  if (!isOpen || !invoice) return null;

  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<string>('');
  const [autoSend, setAutoSend] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatedNextRun = computeNextRunDate(startDate, frequency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      addSchedule({
        invoiceId: invoice.id,
        clientName: invoice.client.name,
        frequency,
        startDate,
        endDate: hasEndDate && endDate ? endDate : undefined,
        nextRunDate: calculatedNextRun,
        status: 'active',
        autoSend,
      });

      toast.success(
        `Configured ${frequency} recurring schedule for ${invoice.client.name}`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      toast.error('Failed to configure recurring schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Set as Recurring Retainer
              </h3>
              <p className="text-xs text-slate-400">
                Invoice {invoice.number} • {invoice.client.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative banner */}
        <div className="p-4 bg-orange-50/70 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/50 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-[#FF7916] shrink-0 mt-0.5" />
          <p>
            EgolePay will automatically generate a new invoice cycle with an incremented number,
            updated dates, and line items on each schedule date.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Select
            label="Billing Cadence / Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
            options={FREQUENCY_OPTIONS}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Cycle Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              leftAddon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Next Cycle Trigger
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#FF7916]" />
                <span>{calculatedNextRun}</span>
              </div>
            </div>
          </div>

          {/* End Date Checkbox & Field */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => setHasEndDate(e.target.checked)}
                className="rounded border-slate-300 text-[#FF7916] focus:ring-[#FF7916]"
              />
              <span>Set end date for this retainer contract</span>
            </label>

            {hasEndDate && (
              <Input
                label="Contract End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required={hasEndDate}
              />
            )}
          </div>

          {/* Auto-send switch */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
                className="rounded border-slate-300 text-[#FF7916] focus:ring-[#FF7916]"
              />
              <span>Automatically mark generated invoice as "Sent" ready for payment</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#FF7916] hover:bg-[#ea580c] text-white font-bold px-4"
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? 'Scheduling...' : 'Activate Retainer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

