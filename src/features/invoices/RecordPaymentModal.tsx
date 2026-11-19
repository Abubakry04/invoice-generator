import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  X,
  Calendar,
  Hash,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  Printer,
  Receipt,
} from 'lucide-react';
import { Invoice, PaymentMethod, PaymentRecord } from '../../types';
import { useInvoiceStore } from '../../store/invoiceStore';
import { formatCurrency, getCurrencySymbol } from '../../lib/formatCurrency';
import { getTodayDateString } from '../../lib/dates';
import { calculateTotals } from '../../lib/calculateTotals';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Debit / Credit Card' },
  { value: 'pos', label: 'POS Terminal' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Cheque / Other' },
];

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const { addPaymentRecord } = useInvoiceStore();

  const totals = invoice
    ? calculateTotals(invoice.items, invoice.discount, invoice.taxRate)
    : { total: 0, subtotal: 0, taxAmount: 0, discountAmount: 0 };
  const paidSoFar = invoice?.paidAmount || 0;
  const remaining = Math.max(0, totals.total - paidSoFar);

  const [amount, setAmount] = useState<number>(remaining);
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordedPayment, setRecordedPayment] = useState<PaymentRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      const t = calculateTotals(invoice.items, invoice.discount, invoice.taxRate);
      const paid = invoice.paidAmount || 0;
      const rem = Math.max(0, t.total - paid);
      setAmount(rem);
      setPaymentDate(getTodayDateString());
      setPaymentMethod('bank_transfer');
      setReference('');
      setNotes('');
      setRecordedPayment(null);
      setShowReceiptModal(false);
    }
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  const handleQuickPercent = (pct: number) => {
    const val = Number(((remaining * pct) / 100).toFixed(2));
    setAmount(val);
  };

  const handleModalClose = () => {
    setRecordedPayment(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    if (amount > remaining + 0.01) {
      toast.error(
        `Amount exceeds remaining balance (${formatCurrency(remaining, invoice.currency)})`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const record = addPaymentRecord(invoice.id, {
        amount,
        paymentDate,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (record) {
        setRecordedPayment(record);
        toast.success(
          `Recorded payment of ${formatCurrency(amount, invoice.currency)} (${record.receiptNumber})`
        );
      }
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Payment
              </h3>
              <p className="text-[11px] text-slate-400">
                {invoice.number} • {invoice.client.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {recordedPayment ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                {recordedPayment.receiptNumber}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                Payment Logged to Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Successfully recorded <strong>{formatCurrency(recordedPayment.amount, invoice.currency)}</strong> for Invoice <strong>{invoice.number}</strong>.
              </p>
            </div>

            {/* Quick Ledger Recap */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Channel</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {recordedPayment.paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payment Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {recordedPayment.paymentDate}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Amount Paid</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(recordedPayment.amount, invoice.currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remaining Due</span>
                <span className="font-mono font-bold text-[#FF7916] text-sm">
                  {formatCurrency(Math.max(0, remaining - recordedPayment.amount), invoice.currency)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowReceiptModal(true)}
                icon={<Printer className="w-4 h-4" />}
              >
                Print / View Receipt
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleModalClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Balance Overview Card */}
            <div className="p-3.5 sm:p-5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block truncate">
                  Total
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                  {formatCurrency(totals.total, invoice.currency)}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block truncate">
                  Paid
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate">
                  {formatCurrency(paidSoFar, invoice.currency)}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#FF7916] block truncate">
                  Balance Due
                </span>
                <span className="font-mono text-xs sm:text-sm font-extrabold text-[#FF7916] mt-0.5 block truncate">
                  {formatCurrency(remaining, invoice.currency)}
                </span>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Amount input & Quick preset buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amount ({getCurrencySymbol(invoice.currency)})
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickPercent(50)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer font-medium"
                    >
                      50% Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPercent(100)}
                      className="text-[10px] px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/60 text-[#FF7916] font-bold hover:bg-orange-100 cursor-pointer"
                    >
                      Full Balance
                    </button>
                  </div>
                </div>

                <Input
                  type="number"
                  step="any"
                  min="0.01"
                  max={remaining}
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  required
                  leftAddon={<span className="font-mono font-bold text-xs">{getCurrencySymbol(invoice.currency)}</span>}
                  className="font-mono font-bold text-base text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Payment Date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  leftAddon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
                />

                <Select
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  options={PAYMENT_METHODS}
                />
              </div>

              <Input
                label="Transaction Reference (Optional)"
                placeholder="e.g. Bank transfer ref or cheque #"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                leftAddon={<Hash className="w-3.5 h-3.5 text-slate-400" />}
              />

              <Textarea
                label="Notes (Optional)"
                placeholder="e.g. First installment paid via transfer."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || amount <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 cursor-pointer"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Official Printable Receipt Modal */}
      <PaymentReceiptModal
        invoice={invoice}
        payment={recordedPayment}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};

