import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings as SettingsIcon,
  PlusCircle,
  X,
  ChevronRight,
  Zap,
  CreditCard,
} from 'lucide-react';
import logoImg from '../../assets/logo3.png';
import { useProductStore } from '../../store/productStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useUiStore } from '../../store/uiStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { products } = useProductStore();
  const { settings } = useSettingsStore();
  const { subscription, getCurrentPlan } = useSubscriptionStore();
  const { openModal } = useUiStore();

  const currentPlan = getCurrentPlan();

  const lowStockCount = products.filter(
    (p) => p.type === 'product' && (p.stock ?? 0) <= (p.lowStockThreshold ?? 5)
  ).length;

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Invoices', to: '/invoices', icon: FileText },
    {
      name: 'Inventory & Items',
      to: '/inventory',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { name: 'Customers', to: '/clients', icon: Users },
    { name: 'Subscription', to: '/subscription', icon: CreditCard },
    { name: 'Settings', to: '/settings', icon: SettingsIcon },
  ];

  const businessName = settings.business.name || 'EgolePay Hub';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm lg:hidden print:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 dark:border-slate-800">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <img
              src={logoImg}
              alt="EgolePay Logo"
              className="h-8 max-w-[130px] object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] border border-orange-200 dark:border-orange-900/60">
              Invoice
            </span>
          </NavLink>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: New Invoice */}
        <div className="p-4">
          <NavLink
            to="/invoices/new"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#FF7916] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-medium text-sm shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-[#FF7916]/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Invoice</span>
          </NavLink>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-[#FF7916] dark:bg-orange-950/40 dark:text-orange-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Dynamic Plan Badge & Quota Meter tailored to active tier */}
        <div className="p-3 mx-4 mb-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
              <Zap
                className={`w-3.5 h-3.5 fill-current ${
                  subscription.planId === 'business'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-[#FF7916]'
                }`}
              />
              <span>{currentPlan.name}</span>
            </div>
            {subscription.planId !== 'business' && (
              <button
                type="button"
                onClick={() =>
                  openModal('upgrade', {
                    targetPlan: subscription.planId === 'free' ? 'starter' : 'business',
                    trigger: 'Scale your invoicing limits',
                  })
                }
                className="text-[10px] font-bold text-[#FF7916] hover:underline"
              >
                Upgrade
              </button>
            )}
          </div>

          {/* Usage Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Monthly Invoices</span>
              <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">
                {subscription.invoicesCreatedThisMonth} /{' '}
                {currentPlan.invoiceLimit === Infinity ? '∞' : currentPlan.invoiceLimit}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  currentPlan.invoiceLimit !== Infinity &&
                  subscription.invoicesCreatedThisMonth >= currentPlan.invoiceLimit
                    ? 'bg-rose-500'
                    : subscription.planId === 'business'
                    ? 'bg-purple-600'
                    : 'bg-[#FF7916]'
                }`}
                style={{
                  width: `${
                    subscription.invoicesCreatedThisMonth === 0
                      ? 0
                      : currentPlan.invoiceLimit === Infinity
                      ? Math.min(100, Math.round((subscription.invoicesCreatedThisMonth / 50) * 100))
                      : Math.min(
                          100,
                          Math.round(
                            (subscription.invoicesCreatedThisMonth / currentPlan.invoiceLimit) * 100
                          )
                        )
                  }%`,
                }}
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-2 line-clamp-1">
            {subscription.planId === 'free'
              ? 'Up to 5 invoices, single currency'
              : subscription.planId === 'starter'
              ? 'Multi-currency & pay links enabled'
              : 'Unlimited invoices & multi-business'}
          </p>
        </div>

        {/* Business snippet footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <NavLink
            to="/settings"
            onClick={onClose}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
            title="Business profile and preferences"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {settings.business.logo ? (
                <img
                  src={settings.business.logo}
                  alt={businessName}
                  className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] font-bold text-xs flex items-center justify-center shrink-0">
                  {businessName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#FF7916] transition-colors">
                  {businessName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {settings.business.email || 'Settings & Defaults'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0 ml-1" />
          </NavLink>
        </div>
      </aside>
    </>
  );
};
