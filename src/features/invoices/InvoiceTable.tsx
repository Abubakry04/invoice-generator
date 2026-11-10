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
  ExternalLink,
  Link as LinkIcon,
  Lock,
  CreditCard,
  Repeat,
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '../../types';
import { calculateTotals } from '../../lib/calculateTotals';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDate, getEffectiveStatus } from '../../lib/dates';
import { exportInvoicesToCSV } from '../../lib/exportUtils';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { InvoiceViewModal } from './InvoiceViewModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { CreateRecurringModal } from './CreateRecurringModal';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { useToast } from '../../components/ui/Toast';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useUiStore } from '../../store/uiStore';

interface InvoiceTableProps {
  invoices: Invoice[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: InvoiceStatus) => void;
}

type FilterStatus = 'all' | InvoiceStatus;

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onDuplicate,
  onDelete,
  onStatusChange,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasFeature } = useSubscriptionStore();
  const { openModal } = useUiStore();
  const canUsePaymentPortal = hasFeature('payment_portal');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [recurringModalInvoice, setRecurringModalInvoice] = useState<Invoice | null>(null);
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
      partially_paid: 0,
      cancelled: 0,
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
                    ? 'bg-[#FF7916] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Export Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-64">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice #, client..."
              leftAddon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (filteredInvoices.length === 0) {
                toast.error('No invoices match the current filter');
                return;
              }
              exportInvoicesToCSV(filteredInvoices);
              toast.success(`Exported ${filteredInvoices.length} invoices to CSV`);
            }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
            title="Export filtered invoices to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="hover:text-[#FF7916] hover:underline"
                          >
                            {inv.number}
                          </button>
                          {inv.isRecurring && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] border border-orange-200 dark:border-orange-900/60">
                              <Repeat className="w-2.5 h-2.5" /> Retainer
                            </span>
                          )}
                        </div>
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
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {formatCurrency(totals.total, inv.currency)}
                        </div>
                        {(inv.paidAmount || 0) > 0 && effectiveStatus !== 'paid' && (
                          <div className="mt-0.5 text-[10px] space-y-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium block">
                              {formatCurrency(inv.paidAmount || 0, inv.currency)} paid
                            </span>
                            <span className="text-[#FF7916] font-bold block">
                              {formatCurrency(
                                Math.max(0, totals.total - (inv.paidAmount || 0)),
                                inv.currency
                              )}{' '}
                              due
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Record Payment button */}
                          {effectiveStatus !== 'paid' && (
                            <button
                              onClick={() => setPaymentModalInvoice(inv)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Record Payment / Installment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

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
                                <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 text-left text-xs">
                                  {/* Record Payment */}
                                  {effectiveStatus !== 'paid' && (
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setPaymentModalInvoice(inv);
                                      }}
                                      className="w-full px-3 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 font-semibold"
                                    >
                                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                      Record Payment
                                    </button>
                                  )}

                                  {/* Set as Recurring Retainer */}
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setRecurringModalInvoice(inv);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <Repeat className="w-3.5 h-3.5 text-[#FF7916]" />
                                    Set as Recurring Retainer
                                  </button>

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

                                  {/* Copy Public Payment Link */}
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      if (!canUsePaymentPortal) {
                                        openModal('upgrade', {
                                          targetPlan: 'starter',
                                          trigger:
                                            'Online customer payment links are available on Starter and Business plans.',
                                        });
                                        return;
                                      }
                                      const url = `${window.location.origin}/pay/${inv.id}`;
                                      navigator.clipboard.writeText(url);
                                      toast.success('Public payment portal link copied!');
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Copy Payment Link</span>
                                    </div>
                                    {!canUsePaymentPortal && (
                                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.5 rounded flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" />
                                        Starter
                                      </span>
                                    )}
                                  </button>

                                  {/* Open Payment Portal */}
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      if (!canUsePaymentPortal) {
                                        openModal('upgrade', {
                                          targetPlan: 'starter',
                                          trigger:
                                            'Online customer payment portal is available on Starter and Business plans.',
                                        });
                                        return;
                                      }
                                      window.open(`/pay/${inv.id}`, '_blank');
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Open Pay Portal</span>
                                    </div>
                                    {!canUsePaymentPortal && (
                                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.5 rounded flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" />
                                        Starter
                                      </span>
                                    )}
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

      {/* Record Partial / Full Payment Modal */}
      <RecordPaymentModal
        invoice={paymentModalInvoice}
        isOpen={paymentModalInvoice !== null}
        onClose={() => setPaymentModalInvoice(null)}
      />

      {/* Set as Recurring Retainer Modal */}
      <CreateRecurringModal
        invoice={recurringModalInvoice}
        isOpen={recurringModalInvoice !== null}
        onClose={() => setRecurringModalInvoice(null)}
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
