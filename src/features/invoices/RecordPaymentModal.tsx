import React, { useState } from 'react';
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
} from 'lucide-react';
import { Invoice, PaymentMethod } from '../../types';
import { useInvoiceStore } from '../../store/invoiceStore';
import { formatCurrency, getCurrencySymbol } from '../../lib/formatCurrency';
import { getTodayDateString } from '../../lib/dates';
import { calculateTotals } from '../../lib/calculateTotals';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer (EFT / Wire)' },
  { value: 'card', label: 'Debit / Credit Card (Online / POS)' },
  { value: 'pos', label: 'POS Terminal' },
  { value: 'cash', label: 'Cash in Hand' },
  { value: 'other', label: 'Other / Cheque' },
];

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const { addPaymentRecord } = useInvoiceStore();

  if (!isOpen || !invoice) return null;

  const totals = calculateTotals(invoice.items, invoice.discount, invoice.taxRate);
  const paidSoFar = invoice.paidAmount || 0;
  const remaining = Math.max(0, totals.total - paidSoFar);

  const [amount, setAmount] = useState<number>(remaining);
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickPercent = (pct: number) => {
    const val = Number(((remaining * pct) / 100).toFixed(2));
    setAmount(val);
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
        toast.success(
          `Recorded payment of ${formatCurrency(amount, invoice.currency)} (${record.receiptNumber})`
        );
      }
      if (onSuccess) onSuccess();
      onClose();
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Payment / Installment
              </h3>
              <p className="text-xs text-slate-400">
                Invoice {invoice.number} • {invoice.client.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Overview Card */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Total Invoiced
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatCurrency(totals.total, invoice.currency)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Paid So Far
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {formatCurrency(paidSoFar, invoice.currency)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF7916] block">
              Remaining Balance
            </span>
            <span className="font-mono text-xs sm:text-sm font-extrabold text-[#FF7916] mt-0.5 block">
              {formatCurrency(remaining, invoice.currency)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount input & Quick preset buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Amount Received ({getCurrencySymbol(invoice.currency)})
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickPercent(50)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  50% Deposit
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(100)}
                  className="text-[10px] px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/60 text-[#FF7916] font-bold hover:bg-orange-100"
                >
                  100% Full Balance
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
              label="Payment Channel / Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              options={PAYMENT_METHODS}
            />
          </div>

          <Input
            label="Transaction Ref / Bank Narration (Optional)"
            placeholder="e.g. GTB/NIP/20261110/019293 or Cheque #104"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            leftAddon={<Hash className="w-3.5 h-3.5 text-slate-400" />}
          />

          <Textarea
            label="Internal Notes / Customer Memo"
            placeholder="e.g. First installment paid via wire transfer."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || amount <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

