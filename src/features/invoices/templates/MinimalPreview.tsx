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

export const MinimalPreview: React.FC<TemplateProps> = ({ invoice, totals, accentColor }) => {
  const effectiveStatus = getEffectiveStatus(invoice);

  return (
    <div className="w-full min-h-[1050px] p-8 sm:p-12 font-sans text-xs leading-relaxed flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* Top minimal header */}
        <div className="flex flex-row justify-between items-start gap-6 mb-10">
          <div className="min-w-0">
            {invoice.business.logo ? (
              <img
                src={invoice.business.logo}
                alt="Logo"
                className="h-10 max-w-[140px] object-contain mb-4 grayscale hover:grayscale-0 transition-all"
              />
            ) : null}
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 truncate">
              {invoice.business.name || 'Your Business Name'}
            </h1>
            <p className="text-slate-500 whitespace-pre-line text-[11px] mt-1">
              {invoice.business.address || 'Business Address'}
            </p>
            <p className="text-slate-500 text-[11px] mt-0.5">{invoice.business.email || 'business@example.com'}</p>
          </div>

          <div className="text-right space-y-1 shrink-0">
            <div className="flex justify-end items-center gap-2 mb-2">
              <span className="font-mono text-xs tracking-wider uppercase text-slate-400">Invoice</span>
              <span className="font-mono font-bold text-sm text-slate-900">{invoice.number || 'INV-0001'}</span>
            </div>
            <div className="flex justify-end">
              <StatusBadge status={effectiveStatus} size="sm" />
            </div>
            <div className="pt-2 text-[11px] text-slate-500 space-y-0.5">
              <p>Issued: {formatDate(invoice.issueDate)}</p>
              <p className="font-medium text-slate-700">Due: {formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Bill To minimal */}
        <div className="mb-10 pt-4 border-t border-slate-200">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            Client
          </span>
          <h2 className="text-sm font-semibold text-slate-900">
            {invoice.client.name ? (
              invoice.client.name
            ) : (
              <span className="text-slate-400 font-normal italic">Client / Recipient Name</span>
            )}
          </h2>
          <p className="text-slate-500 whitespace-pre-line text-[11px] mt-0.5">
            {invoice.client.address || <span className="text-slate-400 italic">Client Address</span>}
          </p>
          <div className="flex flex-wrap gap-x-4 mt-0.5">
            {invoice.client.email && <p className="text-slate-500 text-[11px]">{invoice.client.email}</p>}
            {invoice.client.phone && <p className="text-slate-500 text-[11px]">{invoice.client.phone}</p>}
          </div>
        </div>

        {/* Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-900 font-medium text-[11px]">
                <th className="py-2 pr-4 font-mono uppercase tracking-wider text-[10px]">Description</th>
                <th className="py-2 px-3 text-center w-16 font-mono uppercase tracking-wider text-[10px]">Qty</th>
                <th className="py-2 px-3 text-right w-28 font-mono uppercase tracking-wider text-[10px]">Price</th>
                <th className="py-2 pl-4 text-right w-32 font-mono uppercase tracking-wider text-[10px]">Total</th>
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
                    <tr key={item.id || idx}>
                      <td className="py-3 pr-4 text-slate-800 break-words">
                        {item.description || <span className="text-slate-400 italic">Untitled line item</span>}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-500 font-mono">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-3 pl-4 text-right font-medium text-slate-900 font-mono">
                        {formatCurrency(lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totals minimal */}
        <div className="pt-4 border-t border-slate-200 flex flex-row justify-between items-start gap-8">
          <div className="space-y-4 flex-1 text-[11px] text-slate-500">
            {invoice.business.bankDetails && (
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                  Bank Details
                </span>
                <p className="whitespace-pre-line font-mono text-[10px] text-slate-600">
                  {invoice.business.bankDetails}
                </p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                  Notes
                </span>
                <p className="whitespace-pre-line text-slate-600">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="w-60 text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-mono text-slate-800">{formatCurrency(totals.subtotal, invoice.currency)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({invoice.discount}%)</span>
                <span className="font-mono">-{formatCurrency(totals.discountAmount, invoice.currency)}</span>
              </div>
            )}
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax ({invoice.taxRate}%)</span>
                <span className="font-mono text-slate-800">+{formatCurrency(totals.taxAmount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-900 font-bold text-slate-900 text-sm">
              <span>Total</span>
              <span className="font-mono text-base font-extrabold" style={{ color: accentColor }}>
                {formatCurrency(totals.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-8 border-t border-slate-100 text-[10px] text-slate-400">
        Issued by {invoice.business.name || 'Your Company'}. Thank you for your partnership.
      </div>
    </div>
  );
};
