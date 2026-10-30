import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { InvoiceTable } from './InvoiceTable';
import { InvoiceStatus } from '../../types';

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { invoices, deleteInvoice, duplicateInvoice, updateStatus } = useInvoiceStore();
  const { settings } = useSettingsStore();
  const toast = useToast();

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

  return (
    <div className="space-y-6">
      {/* Page Title & New Invoice Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage, filter, search, and track all your issued and draft invoices.
          </p>
        </div>
        <Button
          onClick={() => navigate('/invoices/new')}
          icon={<Plus className="w-4 h-4" />}
          size="md"
        >
          Create Invoice
        </Button>
      </div>

      {/* Invoices Table Component */}
      <InvoiceTable
        invoices={invoices}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};
