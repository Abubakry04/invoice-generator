import React, { useState } from 'react';
import {
  Repeat,
  Play,
  Pause,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useRecurringStore } from '../../store/recurringStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { formatDate } from '../../lib/dates';
import { formatCurrency } from '../../lib/formatCurrency';
import { calculateTotals } from '../../lib/calculateTotals';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

interface RecurringSchedulesListProps {
  onCreateNew?: () => void;
}

export const RecurringSchedulesList: React.FC<RecurringSchedulesListProps> = ({ onCreateNew }) => {
  const toast = useToast();
  const { schedules, toggleScheduleStatus, deleteSchedule, generateCycle } = useRecurringStore();
  const { invoices } = useInvoiceStore();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleManualTrigger = (id: string) => {
    setGeneratingId(id);
    try {
      const generated = generateCycle(id);
      if (generated) {
        toast.success(`Generated new cycle invoice ${generated.number} successfully!`);
      } else {
        toast.error('Could not generate cycle invoice');
      }
    } catch {
      toast.error('Failed to trigger recurring cycle');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteSchedule(deletingId);
      toast.info('Recurring retainer cancelled');
      setDeletingId(null);
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] flex items-center justify-center mx-auto">
          <Repeat className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Active Recurring Retainers
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Automate ongoing billing for monthly retainers, subscriptions, or contracts.
            Select any invoice to set it on a recurring schedule.
          </p>
        </div>
        {onCreateNew && (
          <Button
            size="sm"
            onClick={onCreateNew}
            icon={<Plus className="w-4 h-4" />}
            className="bg-[#FF7916] hover:bg-[#ea580c] text-white font-bold"
          >
            Create Invoice
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile & Reduced Screen Card View (< 1280px) */}
      <div className="block xl:hidden space-y-3">
        {schedules.map((schedule) => {
          const baseInvoice = invoices.find((inv) => inv.id === schedule.invoiceId);
          const totals = baseInvoice
            ? calculateTotals(baseInvoice.items, baseInvoice.discount, baseInvoice.taxRate)
            : null;
          const isActive = schedule.status === 'active';
          const isGenerating = generatingId === schedule.id;

          return (
            <div
              key={schedule.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              {/* Header: Client + Frequency + Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {schedule.clientName}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Template: {baseInvoice?.number || 'Original'}
                    {totals && (
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 ml-1">
                        • {formatCurrency(totals.total, baseInvoice?.currency || 'NGN')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#FF7916] capitalize border border-orange-200 dark:border-orange-900/60">
                    <Repeat className="w-2.5 h-2.5" />
                    {schedule.frequency}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {schedule.status}
                  </span>
                </div>
              </div>

              {/* Timing & Counter */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800/80 my-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Next Trigger</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDate(schedule.nextRunDate)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Generated</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5 block">
                    {schedule.totalGeneratedCount} cycles
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleManualTrigger(schedule.id)}
                  disabled={isGenerating}
                  className="text-xs text-[#FF7916] border-[#FF7916]/30 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  <span>{isGenerating ? 'Running...' : 'Run Cycle Now'}</span>
                </Button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleScheduleStatus(schedule.id)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    title={isActive ? 'Pause recurring generation' : 'Resume schedule'}
                  >
                    {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(schedule.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete retainer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Large View: Table (≥ 1280px) */}
      <div className="hidden xl:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                <th className="py-3 px-4 min-w-[160px]">Client / Retainer</th>
                <th className="py-3 px-4 whitespace-nowrap">Cadence</th>
                <th className="py-3 px-4 whitespace-nowrap">Next Trigger</th>
                <th className="py-3 px-4 whitespace-nowrap">Generated</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {schedules.map((schedule) => {
                const baseInvoice = invoices.find((inv) => inv.id === schedule.invoiceId);
                const totals = baseInvoice
                  ? calculateTotals(baseInvoice.items, baseInvoice.discount, baseInvoice.taxRate)
                  : null;

                const isActive = schedule.status === 'active';
                const isGenerating = generatingId === schedule.id;

                return (
                  <tr
                    key={schedule.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Client & Base Amount */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {schedule.clientName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Base template: {baseInvoice?.number || 'Original'}</span>
                        {totals && (
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            • {formatCurrency(totals.total, baseInvoice?.currency || 'NGN')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cadence */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#FF7916] capitalize border border-orange-200 dark:border-orange-900/60">
                        <Repeat className="w-3 h-3" />
                        {schedule.frequency}
                      </span>
                    </td>

                    {/* Next Trigger */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(schedule.nextRunDate)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Started {formatDate(schedule.startDate)}
                      </span>
                    </td>

                    {/* Generated Count */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {schedule.totalGeneratedCount}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1">cycles</span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {schedule.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1-Click Trigger */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleManualTrigger(schedule.id)}
                          disabled={isGenerating}
                          className="text-xs text-[#FF7916] border-[#FF7916]/30 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                          title="Generate the next invoice cycle right now"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          <span>{isGenerating ? 'Running...' : 'Run Cycle'}</span>
                        </Button>

                        {/* Pause / Resume */}
                        <button
                          type="button"
                          onClick={() => toggleScheduleStatus(schedule.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title={isActive ? 'Pause recurring generation' : 'Resume schedule'}
                        >
                          {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeletingId(schedule.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete retainer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Cancel Recurring Retainer"
        message="Are you sure you want to cancel this recurring retainer schedule? Previously generated invoices will remain untouched."
        confirmLabel="Cancel Retainer"
        variant="danger"
      />
    </div>
  );
};
