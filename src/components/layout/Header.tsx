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
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import logoImg from '../../assets/logo3.png';

interface HeaderProps {
  onMenuClick: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onOpenSearch }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme, settings } = useSettingsStore();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Close create dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
    };
    if (createMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [createMenuOpen]);

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

        {/* Global Search Bar Trigger (Desktop) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all text-xs w-64 md:w-80 justify-between group shadow-2xs"
          title="Search anything (⌘K)"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF7916] transition-colors shrink-0" />
            <span className="truncate">Search invoices, clients, items...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Search Mobile Icon, Quick Create Button, Theme Toggle, Profile Chip */}
      <div className="flex items-center gap-2 sm:gap-3">
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

        {/* Business Profile Chip */}
        <NavLink
          to="/settings"
          className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors group"
          title="Account & Business Settings"
        >
          {settings.business.logo ? (
            <img
              src={settings.business.logo}
              alt={businessName}
              className="w-6 h-6 rounded-lg object-contain bg-white p-0.5 border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] font-bold text-xs flex items-center justify-center shrink-0">
              {businessName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden md:inline text-xs font-semibold max-w-[120px] truncate text-slate-800 dark:text-slate-200 group-hover:text-[#FF7916] transition-colors">
            {businessName}
          </span>
        </NavLink>
      </div>
    </header>
  );
};
