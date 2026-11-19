import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Invoice } from '../../types';
import { exportInvoicesToCSV, filterInvoicesForExport } from '../../lib/exportUtils';
import { formatCurrency } from '../../lib/formatCurrency';
import { calculateTotals } from '../../lib/calculateTotals';
import { useToast } from '../../components/ui/Toast';

interface ExportInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
}

type DatePreset =
  | 'all'
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

export const ExportInvoicesModal: React.FC<ExportInvoicesModalProps> = ({
  isOpen,
  onClose,
  invoices,
}) => {
  const toast = useToast();

  const [preset, setPreset] = useState<DatePreset>('this_month');
  const [dateField, setDateField] = useState<'issueDate' | 'dueDate'>('issueDate');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const defaultDates = useMemo(() => {
    const startThisMonth = new Date(currentYear, currentMonth, 1)
      .toISOString()
      .slice(0, 10);
    const endThisMonth = new Date(currentYear, currentMonth + 1, 0)
      .toISOString()
      .slice(0, 10);

    const startLastMonth = new Date(currentYear, currentMonth - 1, 1)
      .toISOString()
      .slice(0, 10);
    const endLastMonth = new Date(currentYear, currentMonth, 0)
      .toISOString()
      .slice(0, 10);

    const past30 = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);

    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const startQuarter = new Date(currentYear, quarterStartMonth, 1)
      .toISOString()
      .slice(0, 10);
    const endQuarter = new Date(currentYear, quarterStartMonth + 3, 0)
      .toISOString()
      .slice(0, 10);

    const startYear = `${currentYear}-01-01`;
    const endYear = `${currentYear}-12-31`;

    return {
      this_month: { start: startThisMonth, end: endThisMonth },
      last_month: { start: startLastMonth, end: endLastMonth },
      last_30_days: { start: past30, end: today },
      this_quarter: { start: startQuarter, end: endQuarter },
      this_year: { start: startYear, end: endYear },
    };
  }, [currentYear, currentMonth]);

  const [startDate, setStartDate] = useState<string>(defaultDates.this_month.start);
  const [endDate, setEndDate] = useState<string>(defaultDates.this_month.end);

  const handleSelectPreset = (p: DatePreset) => {
    setPreset(p);
    if (p === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (p !== 'custom') {
      setStartDate(defaultDates[p].start);
      setEndDate(defaultDates[p].end);
    }
  };

  const matchingInvoices = useMemo(() => {
    return filterInvoicesForExport(invoices, {
      startDate: preset === 'all' ? undefined : startDate || undefined,
      endDate: preset === 'all' ? undefined : endDate || undefined,
      dateField,
      status: statusFilter,
    });
  }, [invoices, preset, startDate, endDate, dateField, statusFilter]);

  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;

    for (const inv of matchingInvoices) {
      const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);
      totalInvoiced += totals.total;
      totalPaid += inv.paidAmount || (inv.status === 'paid' ? totals.total : 0);
    }

    const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);
    return { totalInvoiced, totalPaid, totalOutstanding };
  }, [matchingInvoices]);

  const handleExport = () => {
    if (matchingInvoices.length === 0) {
      toast.error('No invoices found in this date range');
      return;
    }

    const result = exportInvoicesToCSV(invoices, {
      startDate: preset === 'all' ? undefined : startDate || undefined,
      endDate: preset === 'all' ? undefined : endDate || undefined,
      dateField,
      status: statusFilter,
    });

    toast.success(`Exported ${result.count} invoice${result.count === 1 ? '' : 's'}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Invoices"
      description="Choose a date range to download your spreadsheet."
      maxWidth="md"
    >
      <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
        {/* Preset Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Time Period
          </label>
        </div>

        {/* Custom Date Range Inputs */}
        {preset !== 'all' && (
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-[#FF7916]" />
              <span>Date Range</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-[#FF7916] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-[#FF7916] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Date Target & Status Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Filter By
            </label>
            <select
              value={dateField}
              onChange={(e) => setDateField(e.target.value as 'issueDate' | 'dueDate')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs cursor-pointer"
            >
              <option value="issueDate">Issue Date</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs cursor-pointer"
            >
              <option value="all">All Invoices</option>
              <option value="paid">Paid only</option>
              <option value="sent">Pending & Sent</option>
              <option value="overdue">Overdue only</option>
              <option value="draft">Drafts only</option>
            </select>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#FF7916]" />
              <span>Matching Invoices</span>
            </span>
            <span className="font-mono font-bold text-[#FF7916]">
              {matchingInvoices.length} of {invoices.length}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-orange-200/60 dark:border-orange-900/30 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Total</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate block">
                {formatCurrency(metrics.totalInvoiced)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">Paid</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs truncate block">
                {formatCurrency(metrics.totalPaid)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium block">Due</span>
              <span className="font-mono font-bold text-orange-600 dark:text-orange-400 text-xs truncate block">
                {formatCurrency(metrics.totalOutstanding)}
              </span>
            </div>
          </div>
        </div>

        {/* Short friendly format note */}
        <p className="text-[11px] text-slate-400 text-center sm:text-left">
          Ready for Microsoft Excel, Google Sheets, and Apple Numbers.
        </p>

        {/* Footer Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleExport}
            disabled={matchingInvoices.length === 0}
            className="w-full sm:w-auto bg-[#FF7916] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-bold text-xs shadow-sm cursor-pointer"
            icon={<Download className="w-4 h-4" />}
          >
            Export {matchingInvoices.length} {matchingInvoices.length === 1 ? 'Invoice' : 'Invoices'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
