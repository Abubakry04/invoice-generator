import React, { useRef } from 'react';
import { Printer, Download, X, CheckCircle, Building2, Calendar, Hash, ArrowLeft } from 'lucide-react';
import { Invoice, PaymentRecord } from '../../types';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDate } from '../../lib/dates';
import { Button } from '../../components/ui/Button';
import { calculateTotals } from '../../lib/calculateTotals';

interface PaymentReceiptModalProps {
  invoice: Invoice | null;
  payment: PaymentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  invoice,
  payment,
  isOpen,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice || !payment) return null;

  const totals = calculateTotals(invoice.items, invoice.discount, invoice.taxRate);
  const remainingAfterPayment = Math.max(0, totals.total - (invoice.paidAmount || 0));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Payment Receipt
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
              {payment.receiptNumber || 'OFFICIAL RECEIPT'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Print Receipt
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div ref={receiptRef} className="p-8 sm:p-10 space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:p-0">
          {/* Header */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                {invoice.business.logo ? (
                  <img
                    src={invoice.business.logo}
                    alt={invoice.business.name}
                    className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] font-bold text-sm flex items-center justify-center shrink-0">
                    {invoice.business.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {invoice.business.name}
                  </h2>
                  <p className="text-xs text-slate-500">{invoice.business.email}</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-widest block">
                RECEIPT
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block mt-0.5">
                {payment.receiptNumber || 'REC-' + payment.id.slice(-6)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {formatDate(payment.paymentDate)}
              </span>
            </div>
          </div>

          {/* Received From / Paid By */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Received From
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {invoice.client.name}
              </p>
              <p className="text-slate-500 mt-0.5">{invoice.client.email || '—'}</p>
              <p className="text-slate-400 line-clamp-1">{invoice.client.address || ''}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Invoice Reference
              </span>
              <p className="font-mono font-bold text-slate-900 dark:text-white">
                {invoice.number}
              </p>
              <p className="text-slate-500 capitalize">Method: {payment.paymentMethod.replace('_', ' ')}</p>
              {payment.reference && (
                <p className="text-slate-400 font-mono text-[11px]">Ref: {payment.reference}</p>
              )}
            </div>
          </div>

          {/* Amount Paid Callout */}
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 dark:text-emerald-300 block">
                Amount Received
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                {formatCurrency(payment.amount, invoice.currency)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>

          {/* Ledger Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Invoice Total:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(totals.total, invoice.currency)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Paid to Date:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(invoice.paidAmount || 0, invoice.currency)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
              <span>Remaining Balance:</span>
              <span className="font-mono text-[#FF7916]">
                {formatCurrency(remainingAfterPayment, invoice.currency)}
              </span>
            </div>
          </div>

          {/* Notes if present */}
          {payment.notes && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">Notes:</span>
              <p>{payment.notes}</p>
            </div>
          )}

          {/* Signature / Footer */}
          <div className="pt-6 border-t border-dashed border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Thank you for your payment. For any questions, please contact{' '}
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {invoice.business.email}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

