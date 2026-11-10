import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, FileText, Repeat } from 'lucide-react';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useRecurringStore } from '../../store/recurringStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { InvoiceTable } from './InvoiceTable';
import { RecurringSchedulesList } from './RecurringSchedulesList';
import { exportInvoicesToCSV } from '../../lib/exportUtils';
import { InvoiceStatus } from '../../types';

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { invoices, deleteInvoice, duplicateInvoice, updateStatus } = useInvoiceStore();
  const { schedules } = useRecurringStore();
  const { settings } = useSettingsStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'invoices' | 'recurring'>('invoices');

  const handleDuplicate = (id: string) => {
    const dup = duplicateInvoice(id, settings.invoicePrefix || 'INV-');
    if (dup) {
      toast.success(`Duplicated as new invoice ${dup.number}`);
    }
  };

  const handleDelete = (id: string) => {
    deleteInvoice(id);
    toast.info('Invoice deleted');
  };

  const handleStatusChange = (id: string, status: InvoiceStatus) => {
    updateStatus(id, status);
    toast.success(`Invoice marked as ${status}`);
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }
    exportInvoicesToCSV(invoices);
    toast.success('Invoices exported to CSV successfully');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Invoices & Billing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage single invoices, track partial payments, and automate recurring retainers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleExportCSV}
            icon={<Download className="w-4 h-4 text-slate-500" />}
            className="text-xs font-semibold"
          >
            Export CSV
          </Button>

          <Button
            onClick={() => navigate('/invoices/new')}
            icon={<Plus className="w-4 h-4" />}
            size="md"
            className="bg-[#FF7916] hover:bg-[#ea580c] text-white font-bold shadow-xs"
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Top View Toggle: Invoices vs Recurring Retainers */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'invoices'
              ? 'border-[#FF7916] text-[#FF7916]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Invoices</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {invoices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recurring')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'recurring'
              ? 'border-[#FF7916] text-[#FF7916]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Recurring Retainers</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-[#FF7916]">
            {schedules.length}
          </span>
        </button>
      </div>

      {/* View Content */}
      {activeTab === 'invoices' ? (
        <InvoiceTable
          invoices={invoices}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <RecurringSchedulesList onCreateNew={() => navigate('/invoices/new')} />
      )}
    </div>
  );
};

