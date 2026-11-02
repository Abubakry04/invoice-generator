import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  FileText,
  Users,
  Package,
  Eye,
  Edit2,
} from 'lucide-react';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useClientStore } from '../../store/clientStore';
import { useProductStore } from '../../store/productStore';
import { useSettingsStore } from '../../store/settingsStore';
import { calculateTotals } from '../../lib/calculateTotals';
import { formatCurrency } from '../../lib/formatCurrency';
import { getEffectiveStatus, formatDate } from '../../lib/dates';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { InvoiceViewModal } from '../invoices/InvoiceViewModal';
import { Invoice } from '../../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { invoices } = useInvoiceStore();
  const { clients } = useClientStore();
  const { products } = useProductStore();
  const { settings } = useSettingsStore();

  const currency = settings.defaultCurrency || 'NGN';
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);

  // Compute Dashboard Metrics
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    let paidCount = 0;

    for (const inv of invoices) {
      const { total } = calculateTotals(inv.items, inv.discount, inv.taxRate);
      const effectiveStatus = getEffectiveStatus(inv);

      totalInvoiced += total;

      if (effectiveStatus === 'paid') {
        totalPaid += total;
        paidCount++;
      } else {
        totalOutstanding += total;
        if (effectiveStatus === 'overdue') {
          totalOverdue += total;
          overdueCount++;
        }
      }
    }

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalOverdue,
      overdueCount,
      paidCount,
      totalCount: invoices.length,
    };
  }, [invoices]);

  // Recent invoices sorted by issueDate descending
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''))
      .slice(0, 5);
  }, [invoices]);

  // Top stock alert products
  const stockAlertProducts = useMemo(() => {
    return products
      .filter((p) => p.type === 'product')
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 3);
  }, [products]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Clean Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {settings.business.name || 'EgolePay Hub'} • Financial summary and billing overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/invoices/new')}
            size="md"
            className="bg-[#FF7916] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-semibold shadow-xs"
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {/* 2. Four Clean KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Invoiced</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(stats.totalInvoiced, currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.totalCount} total {stats.totalCount === 1 ? 'invoice' : 'invoices'}
          </p>
        </div>

        {/* Collected */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Collected (Paid)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalPaid, currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.paidCount} fulfilled payments
          </p>
        </div>

        {/* Outstanding */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outstanding Balance</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(stats.totalOutstanding, currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Awaiting client remittance
          </p>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overdue</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {formatCurrency(stats.totalOverdue, currency)}
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1 font-medium">
            {stats.overdueCount} {stats.overdueCount === 1 ? 'invoice requires' : 'invoices require'} follow-up
          </p>
        </div>
      </div>

      {/* 3. Recent Invoices (Full Width Clean Financial Table) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Invoices</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest billing and payment activity</p>
          </div>
          <button
            onClick={() => navigate('/invoices')}
            className="text-xs font-semibold text-[#FF7916] hover:underline flex items-center gap-1 group"
          >
            <span>View all invoices ({invoices.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-[#FF7916] flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No invoices yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Issue your first invoice to begin tracking revenue.</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/invoices/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Invoice
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Invoice</th>
                  <th className="py-3.5 px-6">Client</th>
                  <th className="py-3.5 px-6">Issue Date</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Amount</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {recentInvoices.map((inv) => {
                  const effectiveStatus = getEffectiveStatus(inv);
                  const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white group-hover:text-[#FF7916] transition-colors whitespace-nowrap">
                        {inv.number}
                      </td>
                      <td className="py-4 px-6 text-slate-800 dark:text-slate-200 font-medium">
                        {inv.client.name}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge status={effectiveStatus} size="sm" />
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white text-right whitespace-nowrap">
                        {formatCurrency(totals.total, inv.currency)}
                      </td>
                      <td
                        className="py-4 px-6 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#FF7916] text-slate-600 dark:text-slate-300 hover:text-[#FF7916] text-xs font-semibold bg-white dark:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Two Balanced Bottom Cards: Clients & Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Saved Clients Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Clients Directory</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                  {clients.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="text-xs font-semibold text-[#FF7916] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {clients.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No clients added yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {clients.slice(0, 3).map((client) => (
                  <div
                    key={client.id}
                    onClick={() => navigate('/clients')}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 -mx-1 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {client.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {client.email || client.phone || 'Client Contact'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Inventory & Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#FF7916]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Inventory & Stock</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                  {products.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="text-xs font-semibold text-[#FF7916] hover:underline flex items-center gap-1"
              >
                <span>View catalog</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {stockAlertProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No physical items in inventory.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {stockAlertProducts.map((product) => {
                  const stock = product.stock ?? 0;
                  const isLow = stock <= (product.lowStockThreshold ?? 5);

                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate('/inventory')}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 -mx-1 px-2 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {formatCurrency(product.unitPrice, currency)}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1.5 ${
                          stock === 0
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
                            : isLow
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            stock === 0 ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        {stock} in stock
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Quick Preview Modal */}
      <InvoiceViewModal
        invoice={selectedInvoiceForView}
        isOpen={selectedInvoiceForView !== null}
        onClose={() => setSelectedInvoiceForView(null)}
      />
    </div>
  );
};
