import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Download,
  Building2,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { useInvoiceStore } from '../../store/invoiceStore';
import { formatCurrency } from '../../lib/formatCurrency';
import { calculateTotals } from '../../lib/calculateTotals';
import { formatDate } from '../../lib/dates';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { InvoicePDFDownloadButton } from '../invoices/InvoicePDFDownloadButton';
import { PaymentReceiptModal } from '../invoices/PaymentReceiptModal';
import { PaymentRecord } from '../../types';

export const PublicInvoicePayPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { invoices, addPaymentRecord } = useInvoiceStore();
  const invoice = invoices.find((inv) => inv.id === id || inv.publicPaymentToken === id);

  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('•••');
  const [latestPayment, setLatestPayment] = useState<PaymentRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Invoice Not Found</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            The link you followed may be invalid, expired, or removed by the issuer.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#FF7916] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to EgolePay Home
          </Link>
        </div>
      </div>
    );
  }

  const totals = calculateTotals(invoice.items, invoice.discount, invoice.taxRate);
  const remainingBalance = invoice.outstandingAmount ?? totals.total;
  const isPaid = invoice.status === 'paid' || paymentSuccess || remainingBalance <= 0;

  const activeReceiptPayment =
    latestPayment ||
    (invoice.payments && invoice.payments.length > 0
      ? invoice.payments[invoice.payments.length - 1]
      : null);

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);
    setTimeout(() => {
      const paymentAmount = remainingBalance > 0 ? remainingBalance : totals.total;
      const ref = `CARD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const newPayment = addPaymentRecord(invoice.id, {
        amount: paymentAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'card',
        reference: ref,
        notes: 'Online payment via EgolePay checkout portal',
      });
      if (newPayment) {
        setLatestPayment(newPayment);
      }
      setIsPaying(false);
      setPaymentSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header / Portal Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:px-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] flex items-center justify-center font-bold text-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Invoice from
              </p>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {invoice.business.name || 'EgolePay Business'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={isPaid ? 'paid' : invoice.status} size="md" />
            <InvoicePDFDownloadButton
              invoice={invoice}
              size="sm"
              variant="secondary"
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Main Grid: Left Invoice Detail, Right Payment Gateway */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Invoice Summary Card */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
              <div>
                <span className="text-xs text-slate-400 font-mono font-medium">Invoice Number</span>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {invoice.number}
                </h1>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Amount Due</span>
                <p className="text-2xl font-mono font-extrabold text-[#FF7916]">
                  {formatCurrency(totals.total, invoice.currency)}
                </p>
              </div>
            </div>

            {/* Dates & Client Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase tracking-wider font-semibold">Billed To</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{invoice.client.name}</p>
                <p className="text-slate-500">{invoice.client.email}</p>
                {invoice.client.address && <p className="text-slate-500">{invoice.client.address}</p>}
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider font-semibold">Timeline</span>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Issued: <strong className="text-slate-800 dark:text-slate-100">{formatDate(invoice.issueDate)}</strong>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Due: <strong className="text-slate-800 dark:text-slate-100">{formatDate(invoice.dueDate)}</strong>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Description</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Qty</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-medium">{formatCurrency(totals.subtotal, invoice.currency)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount ({invoice.discount}%)</span>
                  <span className="font-mono">- {formatCurrency(totals.discountAmount, invoice.currency)}</span>
                </div>
              )}
              {totals.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>VAT / Tax ({invoice.taxRate}%)</span>
                  <span className="font-mono">+ {formatCurrency(totals.taxAmount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Total Amount</span>
                <span className="font-mono text-base text-[#FF7916]">
                  {formatCurrency(totals.total, invoice.currency)}
                </span>
              </div>
            </div>

            {/* Notes / Bank Instructions */}
            {invoice.business.bankDetails && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Bank Transfer Remarks:
                </span>
                <p className="text-slate-500 whitespace-pre-wrap">{invoice.business.bankDetails}</p>
              </div>
            )}
          </div>

          {/* Right Column: Checkout & Payment Section */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secure Payment Gateway</span>
              </div>

              {isPaid ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment Received</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    This invoice has been settled in full. A copy of the payment record has been added to the merchant ledger.
                  </p>

                  {activeReceiptPayment && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowReceiptModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        <Receipt className="w-4 h-4 text-[#FF7916]" />
                        <span>View / Print Official Receipt</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Due Now</span>
                      <p className="text-lg font-mono font-bold text-[#FF7916]">
                        {formatCurrency(remainingBalance > 0 ? remainingBalance : totals.total, invoice.currency)}
                      </p>
                    </div>
                    <CreditCard className="w-6 h-6 text-[#FF7916]" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      placeholder="4242 4242 4242 4242"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="text"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPaying}
                    className="w-full py-3 px-4 rounded-xl bg-[#FF7916] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-bold text-xs shadow-md shadow-[#FF7916]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPaying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Pay {formatCurrency(remainingBalance > 0 ? remainingBalance : totals.total, invoice.currency)}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-Bit SSL Encrypted • Powered by EgolePay Cloud</span>
                  </div>
                </form>
              )}
            </div>

            {/* Back link */}
            <div className="text-center">
              <Link
                to="/"
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Official Receipt Modal */}
      <PaymentReceiptModal
        invoice={invoice}
        payment={activeReceiptPayment}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};

