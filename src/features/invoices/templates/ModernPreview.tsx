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

export const ModernPreview: React.FC<TemplateProps> = ({ invoice, totals, accentColor }) => {
  const effectiveStatus = getEffectiveStatus(invoice);

  return (
    <div className="w-full min-h-[1050px] p-8 sm:p-10 font-sans text-xs leading-relaxed flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* Top Banner Header with Accent Color */}
        <div
          className="rounded-xl p-6 text-white mb-8 flex flex-row items-center justify-between gap-4 shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          <div className="flex items-center gap-4 min-w-0">
            {invoice.business.logo ? (
              <img
                src={invoice.business.logo}
                alt="Logo"
                className="h-12 max-w-[140px] object-contain bg-white p-1.5 rounded-lg shadow-sm shrink-0"
              />
            ) : null}
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight truncate">
                {invoice.business.name || 'Your Business Name'}
              </h1>
              <p className="text-white/80 text-[11px] mt-0.5 truncate">{invoice.business.email || 'business@example.com'}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/70 block">INVOICE</span>
            <span className="text-xl font-black text-white tracking-wider font-mono">{invoice.number || 'INV-0001'}</span>
            <div className="mt-1 flex justify-end">
              <StatusBadge status={effectiveStatus} size="sm" className="bg-white/20 text-white border-white/30 backdrop-blur-sm" />
            </div>
          </div>
        </div>

        {/* Addresses & Dates Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed From
            </span>
            <p className="font-bold text-slate-900 text-xs">{invoice.business.name || 'Your Business Name'}</p>
            <p className="text-slate-500 whitespace-pre-line text-[11px] mt-0.5">{invoice.business.address || 'Business Address'}</p>
            {invoice.business.phone && <p className="text-slate-500 text-[11px] mt-0.5">{invoice.business.phone}</p>}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To
            </span>
            <p className="font-bold text-slate-900 text-xs">
              {invoice.client.name ? (
                invoice.client.name
              ) : (
                <span className="text-slate-400 font-normal italic">Client / Company Name</span>
              )}
            </p>
            <p className="text-slate-500 whitespace-pre-line text-[11px] mt-0.5">
              {invoice.client.address || <span className="text-slate-400 italic">Client Address</span>}
            </p>
            {invoice.client.email && <p className="text-slate-500 text-[11px] mt-0.5">{invoice.client.email}</p>}
            {invoice.client.phone && <p className="text-slate-500 text-[11px] mt-0.5">{invoice.client.phone}</p>}
          </div>

          <div className="space-y-2 text-right">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Issue Date
              </span>
              <span className="font-semibold text-slate-800 text-xs">{formatDate(invoice.issueDate)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Due Date
              </span>
              <span className="font-semibold text-slate-800 text-xs">{formatDate(invoice.dueDate)}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-3 text-center w-16">Qty</th>
                <th className="py-3 px-3 text-right w-28">Unit Price</th>
                <th className="py-3 px-4 text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
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
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-800 break-words">
                        {item.description || <span className="text-slate-400 italic">Untitled line item</span>}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-mono">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-600 font-mono">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800 font-mono">
                        {formatCurrency(lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-row justify-between items-start gap-6 mb-8">
          {/* Notes & Bank Details */}
          <div className="space-y-4 flex-1 max-w-sm text-[11px]">
            {invoice.notes && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">
                  Notes & Terms
                </span>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">{invoice.notes}</p>
              </div>
            )}

            {invoice.business.bankDetails && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">
                  Payment Instructions
                </span>
                <p className="text-slate-600 whitespace-pre-line font-mono text-[10px] leading-relaxed">
                  {invoice.business.bankDetails}
                </p>
              </div>
            )}
          </div>

          {/* Calculation Summary Box */}
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold font-mono text-slate-800">
                {formatCurrency(totals.subtotal, invoice.currency)}
              </span>
            </div>

            {totals.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Discount ({invoice.discount}%):</span>
                <span className="font-semibold font-mono">
                  -{formatCurrency(totals.discountAmount, invoice.currency)}
                </span>
              </div>
            )}

            {invoice.taxRate > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Tax / VAT ({invoice.taxRate}%):</span>
                <span className="font-semibold font-mono text-slate-800">
                  +{formatCurrency(totals.taxAmount, invoice.currency)}
                </span>
              </div>
            )}

            <div
              className="flex justify-between items-center p-3 rounded-xl text-white font-bold text-sm mt-2 shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <span>Total Due:</span>
              <span className="text-base font-extrabold font-mono">
                {formatCurrency(totals.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-6 border-t border-slate-100 text-[10px] text-slate-400">
        Thank you for your business. For questions regarding this invoice, contact {invoice.business.email || 'support'}.
      </div>
    </div>
  );
};
