import React, { useMemo } from 'react';
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

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { invoices } = useInvoiceStore();
  const { clients } = useClientStore();
  const { products } = useProductStore();
  const { settings } = useSettingsStore();

  const currency = settings.defaultCurrency || 'NGN';

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

  // Recent 5 invoices sorted by issueDate descending
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''))
      .slice(0, 5);
  }, [invoices]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FF7916] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-orange-200">
              Overview Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {settings.business.name || 'Egolepay Hub'}
          </h1>
          <p className="text-orange-100/90 text-xs sm:text-sm max-w-xl">
            Track revenue, outstanding client balances, and generate professional PDF invoices effortlessly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/invoices/new')}
            size="lg"
            className="bg-white hover:bg-slate-100 !text-slate-900 font-bold border-none shadow-md transition-colors"
            icon={<Plus className="w-4 h-4 text-slate-900" />}
          >
            New Invoice
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Invoiced */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Invoiced</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(stats.totalInvoiced, currency)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across {stats.totalCount} total {stats.totalCount === 1 ? 'invoice' : 'invoices'}
          </p>
        </div>

        {/* 2. Total Paid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Collected (Paid)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalPaid, currency)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.paidCount} fulfilled payments
          </p>
        </div>

        {/* 3. Outstanding */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outstanding Balance</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(stats.totalOutstanding, currency)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Awaiting client remittance
          </p>
        </div>

        {/* 4. Overdue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overdue</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
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

      {/* Two Column Section: Recent Invoices & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Invoices (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Invoices</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest activity across your invoices</p>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No invoices yet. Click "New Invoice" to create one.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {recentInvoices.map((inv) => {
                const effectiveStatus = getEffectiveStatus(inv);
                const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);

                return (
                  <div
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-mono font-bold text-xs shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {inv.number}
                          </span>
                          <StatusBadge status={effectiveStatus} size="sm" />
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {inv.client.name} • Issued {formatDate(inv.issueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm block">
                        {formatCurrency(totals.total, inv.currency)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Due: {formatDate(inv.dueDate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Directory & Quick Stats Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Saved Clients Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Clients Directory</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {clients.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {clients.slice(0, 3).map((client) => (
                <div
                  key={client.id}
                  onClick={() => navigate('/clients')}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {client.name.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {client.name}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/clients')}
            >
              Manage Clients
            </Button>
          </div>

          {/* Stock & Catalog Overview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#FF7916]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Inventory & Stock</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {products.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {products
                .filter((p) => p.type === 'product')
                .slice(0, 3)
                .map((product) => {
                  const stock = product.stock ?? 0;
                  const isLow = stock <= (product.lowStockThreshold ?? 5);

                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate('/inventory')}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formatCurrency(product.unitPrice, currency)}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          stock === 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400'
                            : isLow
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                        }`}
                      >
                        {stock} in stock
                      </span>
                    </div>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/inventory')}
            >
              Manage Inventory
            </Button>
          </div>

          {/* Quick Tip / Branding Card */}
          {/* <div className="bg-slate-900 dark:bg-slate-800/80 rounded-2xl p-6 text-white shadow-sm space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">
              Browser Storage
            </span>
            <h4 className="text-sm font-bold">100% Offline & Private</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your invoices and business profile are stored locally in your browser. No server sync or login
              required. You can export PDF anytime.
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};
