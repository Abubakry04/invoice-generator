import React from 'react';
import { Invoice, InvoiceTotals } from '../../../types';
import { formatCurrency } from '../../../lib/formatCurrency';
import { formatDate } from '../../../lib/dates';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getEffectiveStatus } from '../../../lib/dates';

interface TemplateProps {
  invoice: Invoice;
  totals: InvoiceTotals;
  accentColor: string;
}

export const ClassicPreview: React.FC<TemplateProps> = ({ invoice, totals, accentColor }) => {
  const effectiveStatus = getEffectiveStatus(invoice);

  return (
    <div className="w-full min-h-[1050px] p-8 sm:p-10 font-sans text-xs leading-relaxed flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* Top Header */}
        <div className="flex flex-row justify-between items-start gap-4 pb-6 border-b-2" style={{ borderColor: accentColor }}>
          <div className="min-w-0">
            {invoice.business.logo ? (
              <img src={invoice.business.logo} alt="Logo" className="h-12 max-w-[150px] object-contain mb-3" />
            ) : null}
            <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">
              {invoice.business.name || 'Your Business Name'}
            </h1>
            <p className="text-slate-600 whitespace-pre-line text-[11px] mt-1">
              {invoice.business.address || 'Business Address'}
            </p>
            <div className="text-slate-600 text-[11px] mt-1 flex flex-wrap gap-x-3">
              <span>Email: {invoice.business.email || 'business@example.com'}</span>
              {invoice.business.phone && <span>Phone: {invoice.business.phone}</span>}
            </div>
          </div>

          <div className="text-right flex flex-col items-end shrink-0">
            <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800" style={{ color: accentColor }}>
              INVOICE
            </h2>
            <span className="font-mono text-sm font-bold text-slate-700 mt-1">{invoice.number || 'INV-0001'}</span>
            <div className="mt-2">
              <StatusBadge status={effectiveStatus} size="sm" />
            </div>
            <div className="mt-4 space-y-1 text-slate-600 text-[11px]">
              <div><span className="font-semibold text-slate-800">Date:</span> {formatDate(invoice.issueDate)}</div>
              <div><span className="font-semibold text-slate-800">Payment Due:</span> {formatDate(invoice.dueDate)}</div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="my-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Invoice Recipient (Bill To)
          </span>
          <h3 className="font-bold text-sm text-slate-900">
            {invoice.client.name ? (
              invoice.client.name
            ) : (
              <span className="text-slate-400 font-normal italic">Client / Recipient Name</span>
            )}
          </h3>
          <p className="text-slate-600 whitespace-pre-line text-xs mt-1">
            {invoice.client.address || <span className="text-slate-400 italic">Client Address</span>}
          </p>
          <div className="flex flex-wrap gap-x-4 mt-1">
            {invoice.client.email && <p className="text-slate-600 text-xs">Email: {invoice.client.email}</p>}
            {invoice.client.phone && <p className="text-slate-600 text-xs">Phone: {invoice.client.phone}</p>}
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse border border-slate-200 mb-6">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
              <th className="py-2.5 px-3 border-r border-slate-200">Description</th>
              <th className="py-2.5 px-3 text-center border-r border-slate-200 w-16">Qty</th>
              <th className="py-2.5 px-3 text-right border-r border-slate-200 w-28">Rate</th>
              <th className="py-2.5 px-3 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                  No line items added yet.
                </td>
              </tr>
            ) : (
              invoice.items.map((item, idx) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800 break-words font-medium">
                      {item.description || <span className="text-slate-400 italic">Untitled item</span>}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                      {formatCurrency(lineTotal, invoice.currency)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Bottom section */}
        <div className="flex flex-row justify-between items-start gap-6 mb-6">
          <div className="space-y-3 flex-1 text-[11px]">
            {invoice.business.bankDetails && (
              <div className="border border-slate-200 rounded-lg p-3">
                <span className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">
                  Remittance / Bank Details
                </span>
                <p className="text-slate-600 whitespace-pre-line font-mono text-[10px]">
                  {invoice.business.bankDetails}
                </p>
              </div>
            )}

            {invoice.notes && (
              <div className="text-slate-600">
                <span className="font-bold text-slate-700 block mb-1">Notes:</span>
                <p className="whitespace-pre-line leading-relaxed">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="w-64 text-xs space-y-1.5 pt-0">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{formatCurrency(totals.subtotal, invoice.currency)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Discount ({invoice.discount}%):</span>
                <span className="font-mono font-semibold">-{formatCurrency(totals.discountAmount, invoice.currency)}</span>
              </div>
            )}
            {invoice.taxRate > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>VAT / Tax ({invoice.taxRate}%):</span>
                <span className="font-mono font-semibold">+{formatCurrency(totals.taxAmount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-b-2 font-bold text-sm text-slate-900" style={{ borderColor: accentColor }}>
              <span>Total:</span>
              <span className="font-mono font-black" style={{ color: accentColor }}>
                {formatCurrency(totals.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-4 border-t border-slate-200 text-[10px] text-slate-500">
        Payment is appreciated according to agreed terms.
      </div>
    </div>
  );
};
