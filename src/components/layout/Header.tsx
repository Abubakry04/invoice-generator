import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Search,
  Plus,
  FileText,
  Users,
  Package,
  ChevronDown,
  Zap,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useUiStore } from '../../store/uiStore';
import { CloudSyncBadge } from '../saas/CloudSyncBadge';
import { OrgSwitcherDropdown } from '../saas/OrgSwitcherDropdown';
import logoImg from '../../assets/logo3.png';

interface HeaderProps {
  onMenuClick: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onOpenSearch }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme, settings } = useSettingsStore();
  const { currentUser, isAuthenticated, logout } = useAuthStore();
  const { subscription, getCurrentPlan, canCreateInvoice } = useSubscriptionStore();
  const { openModal } = useUiStore();

  const currentPlan = getCurrentPlan();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close create & user dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (createMenuOpen || userMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [createMenuOpen, userMenuOpen]);

  const businessName = settings.business.name || 'EgolePay Hub';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile Menu Button & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 lg:hidden">
          <NavLink to="/" className="flex items-center">
            <img src={logoImg} alt="EgolePay" className="h-6 w-auto max-w-[110px] object-contain" />
          </NavLink>
        </div>

        <div className="hidden sm:block">
          <OrgSwitcherDropdown />
        </div>

        {/* Global Search Bar Trigger (Desktop) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all text-xs w-48 md:w-60 justify-between group"
          title="Search anything (⌘K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF7916] transition-colors shrink-0" />
            <span className="truncate">Search...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Cloud Sync, Upgrade, Quick Search, Quick Create, Theme Toggle, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Cloud Sync Status Indicator */}
        <CloudSyncBadge />

        {/* Upgrade Plan Button (if on free plan) */}
        {subscription.planId === 'free' && (
          <button
            type="button"
            onClick={() => openModal('upgrade', { trigger: 'Upgrade to Starter or Business for unlimited features' })}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 text-[#FF7916] text-xs font-semibold transition-colors"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Upgrade</span>
          </button>
        )}

        {/* Search button on small screens */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-2 rounded-xl sm:hidden text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Search"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick Create Dropdown */}
        <div className="relative" ref={createMenuRef}>
          <button
            type="button"
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#FF7916] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-semibold text-xs shadow-xs hover:shadow transition-all"
            aria-expanded={createMenuOpen}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${createMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {createMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  if (!canCreateInvoice()) {
                    openModal('upgrade', {
                      trigger: `Monthly invoice limit reached (${currentPlan.invoiceLimit} invoices/mo). Upgrade to create more invoices.`,
                    });
                    return;
                  }
                  navigate('/invoices/new');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-[#FF7916] dark:hover:text-orange-400 transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-[#FF7916]" />
                <span>New Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  navigate('/clients');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>New Client</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  navigate('/inventory');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <Package className="w-4 h-4 text-emerald-500" />
                <span>New Item / Stock</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        <div className="h-5 w-px bg-slate-200 dark:border-slate-800 hidden sm:block" />

        {/* User Account / Auth Area */}
        {isAuthenticated && currentUser ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:block text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                {currentUser.name}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] border border-orange-200 dark:border-orange-800">
                      {currentPlan.name}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Business Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    openModal('upgrade', { trigger: 'Upgrade your plan to unlock more features' });
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#FF7916] hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Billing & Plans</span>
                  </div>
                  <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-950/80 px-1.5 py-0.5 rounded">
                    Upgrade
                  </span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/login?mode=register')}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#FF7916] hover:bg-[#ea580c] rounded-xl shadow-xs transition-colors"
            >
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
