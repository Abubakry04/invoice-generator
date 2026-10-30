import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  Edit2,
  Copy,
  Trash2,
  Download,
  MoreVertical,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '../../types';
import { calculateTotals } from '../../lib/calculateTotals';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDate, getEffectiveStatus } from '../../lib/dates';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { InvoiceViewModal } from './InvoiceViewModal';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { useToast } from '../../components/ui/Toast';

interface InvoiceTableProps {
  invoices: Invoice[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: InvoiceStatus) => void;
}

type FilterStatus = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onDuplicate,
  onDelete,
  onStatusChange,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter & Search
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const effStatus = getEffectiveStatus(inv);

      // Status filter
      if (activeFilter !== 'all' && effStatus !== activeFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = inv.number.toLowerCase().includes(q);
        const matchClient = inv.client.name.toLowerCase().includes(q) || inv.client.email.toLowerCase().includes(q);
        const matchItems = inv.items.some((i) => i.description.toLowerCase().includes(q));
        if (!matchNumber && !matchClient && !matchItems) return false;
      }

      return true;
    });
  }, [invoices, activeFilter, searchQuery]);

  // Counts for each tab
  const statusCounts = useMemo(() => {
    const counts: Record<FilterStatus, number> = {
      all: invoices.length,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
    };
    for (const inv of invoices) {
      const st = getEffectiveStatus(inv);
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    }
    return counts;
  }, [invoices]);

  // Direct fast PDF download
  const handleDownloadPdf = async (inv: Invoice) => {
    try {
      const doc = <InvoicePDF invoice={inv} accentColor={inv.accentColor} template={inv.template} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${inv.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${inv.number}.pdf`);
    } catch {
      toast.error('Could not download PDF');
    }
  };

  const invoiceToDelete = invoices.find((inv) => inv.id === deletingInvoiceId);

  return (
    <div className="space-y-4">
      {/* Top Filter Bar: Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'all', label: 'All Invoices' },
              { id: 'draft', label: 'Draft' },
              { id: 'sent', label: 'Sent' },
              { id: 'paid', label: 'Paid' },
              { id: 'overdue', label: 'Overdue' },
            ] as const
          ).map((tab) => {
            const count = statusCounts[tab.id];
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, client, item..."
            leftAddon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="w-10 h-10" />}
          title={searchQuery ? 'No matching invoices' : `No ${activeFilter === 'all' ? '' : activeFilter} invoices`}
          description={
            searchQuery
              ? `No invoices matched "${searchQuery}". Clear your search or change filters.`
              : 'Create a new invoice to get started.'
          }
          actionLabel="New Invoice"
          onAction={() => navigate('/invoices/new')}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Issue / Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredInvoices.map((inv) => {
                  const effectiveStatus = getEffectiveStatus(inv);
                  const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);
                  const isMenuOpen = activeMenuId === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Invoice # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        <button
                          onClick={() => setSelectedInvoiceForView(inv)}
                          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1.5"
                        >
                          {inv.number}
                        </button>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {inv.client.name || 'Unnamed Client'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {inv.client.email || '—'}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {formatDate(inv.issueDate)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Due: {formatDate(inv.dueDate)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={effectiveStatus} size="sm" />
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {formatCurrency(totals.total, inv.currency)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Preview button */}
                          <button
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Preview Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Edit */}
                          <button
                            onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Download PDF directly */}
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* More dropdown trigger */}
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setActiveMenuId(isMenuOpen ? null : inv.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setActiveMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 text-left text-xs">
                                  {/* Duplicate */}
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onDuplicate(inv.id);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    Duplicate Invoice
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Set Status
                                  </div>

                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onStatusChange(inv.id, 'paid');
                                    }}
                                    className="w-full px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    Mark as Paid
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onStatusChange(inv.id, 'sent');
                                    }}
                                    className="w-full px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <Send className="w-3.5 h-3.5 text-blue-500" />
                                    Mark as Sent
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onStatusChange(inv.id, 'draft');
                                    }}
                                    className="w-full px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    Mark as Draft
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setDeletingInvoiceId(inv.id);
                                    }}
                                    className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Invoice
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <InvoiceViewModal
        invoice={selectedInvoiceForView}
        isOpen={!!selectedInvoiceForView}
        onClose={() => setSelectedInvoiceForView(null)}
      />

      {/* Delete Invoice Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingInvoiceId}
        onClose={() => setDeletingInvoiceId(null)}
        onConfirm={() => {
          if (deletingInvoiceId) {
            onDelete(deletingInvoiceId);
            setDeletingInvoiceId(null);
          }
        }}
        title="Delete Invoice?"
        message={`Are you sure you want to permanently delete invoice ${invoiceToDelete?.number}? This action cannot be undone.`}
        confirmLabel="Delete Invoice"
        variant="danger"
      />
    </div>
  );
};
