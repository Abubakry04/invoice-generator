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
} from 'lucide-react';
import logoImg from '../../assets/logo3.png';
import { useProductStore } from '../../store/productStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { products } = useProductStore();
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
    { name: 'Clients', to: '/clients', icon: Users },
    { name: 'Settings', to: '/settings', icon: SettingsIcon },
  ];

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
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
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

        {/* Business snippet footer */}
        {/* <div className="p-4 m-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Business
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            {settings.business.name || 'Set Business Name'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {settings.business.email || 'billing@domain.com'}
          </p>
        </div> */}
      </aside>
    </>
  );
};
