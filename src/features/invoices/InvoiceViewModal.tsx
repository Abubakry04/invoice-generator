import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { InvoicePreview } from './InvoicePreview';
import { InvoicePDFDownloadButton } from './InvoicePDFDownloadButton';
import { RecordPaymentModal } from './RecordPaymentModal';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { Invoice, PaymentRecord } from '../../types';
import { Button } from '../../components/ui/Button';
import {
  Edit2,
  Printer,
  CreditCard,
  FileText,
  Clock,
  Trash2,
  CheckCircle2,
  Receipt,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDate } from '../../lib/dates';
import { calculateTotals } from '../../lib/calculateTotals';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useToast } from '../../components/ui/Toast';

interface InvoiceViewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { deletePaymentRecord, getInvoice } = useInvoiceStore();

  const [activeTab, setActiveTab] = useState<'document' | 'payments'>('document');
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  if (!invoice) return null;

  // Retrieve freshest state from store
  const liveInvoice = getInvoice(invoice.id) || invoice;
  const totals = calculateTotals(liveInvoice.items, liveInvoice.discount, liveInvoice.taxRate);
  const paidAmount = liveInvoice.paidAmount || 0;
  const remaining = Math.max(0, totals.total - paidAmount);
  const payments = liveInvoice.payments || [];

  const handleDeletePayment = (paymentId: string) => {
    deletePaymentRecord(liveInvoice.id, paymentId);
    toast.info('Payment record removed');
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Invoice ${liveInvoice.number}`}
        description={`${liveInvoice.client.name} • ${formatCurrency(totals.total, liveInvoice.currency)}`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {/* Action Bar & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('document')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'document'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Invoice Document</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'payments'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                <span>Payment History</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {payments.length}
                </span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {remaining > 0 && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                  onClick={() => setShowRecordPayment(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Record Payment
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  onClose();
                  navigate(`/invoices/${liveInvoice.id}/edit`);
                }}
                className="text-xs"
              >
                Edit
              </Button>

              <Button
                variant="ghost"
                size="sm"
                icon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
                className="text-xs"
              >
                Print
              </Button>

              <InvoicePDFDownloadButton invoice={liveInvoice} size="sm" className="text-xs" />
            </div>
          </div>

          {/* Content Views */}
          {activeTab === 'document' ? (
            <div className="bg-slate-100/90 dark:bg-slate-950/80 p-4 sm:p-6 rounded-2xl max-h-[75vh] overflow-auto flex justify-center items-start">
              <div className="shrink-0">
                <InvoicePreview invoice={liveInvoice} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Balance Summary Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Invoice Total
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {formatCurrency(totals.total, liveInvoice.currency)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Total Collected
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {formatCurrency(paidAmount, liveInvoice.currency)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Remaining Due
                  </span>
                  <span className="text-sm font-bold font-mono text-[#FF7916] mt-0.5 block">
                    {formatCurrency(remaining, liveInvoice.currency)}
                  </span>
                </div>
              </div>

              {/* Payments Table */}
              {payments.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No Payments Logged Yet
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                      When client pays in installments or bank transfer, record each transaction here.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowRecordPayment(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    icon={<CreditCard className="w-3.5 h-3.5" />}
                  >
                    Record First Payment
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Receipt #</th>
                        <th className="py-3 px-4">Payment Date</th>
                        <th className="py-3 px-4">Method / Ref</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {p.receiptNumber || 'REC-' + p.id.slice(-6)}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {formatDate(p.paymentDate)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                              {p.paymentMethod.replace('_', ' ')}
                            </span>
                            {p.reference && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Ref: {p.reference}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.amount, liveInvoice.currency)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt(p)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px] inline-flex items-center gap-1"
                              >
                                <Receipt className="w-3 h-3 text-emerald-500" />
                                <span>Receipt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(p.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Remove payment record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        invoice={liveInvoice}
        isOpen={showRecordPayment}
        onClose={() => setShowRecordPayment(false)}
      />

      {/* Official Receipt Viewer Modal */}
      <PaymentReceiptModal
        invoice={liveInvoice}
        payment={selectedReceipt}
        isOpen={selectedReceipt !== null}
        onClose={() => setSelectedReceipt(null)}
      />
    </>
  );
};
