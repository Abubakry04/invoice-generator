import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  Users,
  Package,
  Wrench,
  Settings,
  PlusCircle,
  Sun,
  Moon,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useClientStore } from '../../store/clientStore';
import { useProductStore } from '../../store/productStore';
import { useSettingsStore } from '../../store/settingsStore';
import { calculateTotals } from '../../lib/calculateTotals';
import { formatCurrency } from '../../lib/formatCurrency';
import { getEffectiveStatus } from '../../lib/dates';
import { StatusBadge } from '../ui/StatusBadge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  category: 'action' | 'invoice' | 'client' | 'item';
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon: React.ReactNode;
  onSelect: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { invoices } = useInvoiceStore();
  const { clients } = useClientStore();
  const { products } = useProductStore();
  const { settings, theme, toggleTheme } = useSettingsStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Compute search results
  const items = useMemo<SearchItem[]>(() => {
    const q = query.trim().toLowerCase();
    const results: SearchItem[] = [];

    // Quick Actions
    const defaultActions: SearchItem[] = [
      {
        id: 'action-new-invoice',
        category: 'action',
        title: 'Create New Invoice',
        subtitle: 'Start drafting a fresh invoice',
        icon: <PlusCircle className="w-4 h-4 text-[#FF7916]" />,
        onSelect: () => {
          navigate('/invoices/new');
          onClose();
        },
      },
      {
        id: 'action-clients',
        category: 'action',
        title: 'Clients Directory',
        subtitle: 'View and manage customer contacts',
        icon: <Users className="w-4 h-4 text-blue-500" />,
        onSelect: () => {
          navigate('/clients');
          onClose();
        },
      },
      {
        id: 'action-inventory',
        category: 'action',
        title: 'Inventory & Items',
        subtitle: 'Manage products, services & stock counts',
        icon: <Package className="w-4 h-4 text-emerald-500" />,
        onSelect: () => {
          navigate('/inventory');
          onClose();
        },
      },
      {
        id: 'action-settings',
        category: 'action',
        title: 'Business Settings',
        subtitle: 'Configure company profile, taxes & branding',
        icon: <Settings className="w-4 h-4 text-slate-500" />,
        onSelect: () => {
          navigate('/settings');
          onClose();
        },
      },
      {
        id: 'action-theme',
        category: 'action',
        title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: `Currently in ${theme} mode`,
        icon:
          theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          ),
        onSelect: () => {
          toggleTheme();
          onClose();
        },
      },
    ];

    if (!q) {
      // Show default actions + 3 recent invoices + 3 clients
      results.push(...defaultActions);

      // Recent 3 invoices
      const recent = [...invoices].slice(0, 3);
      for (const inv of recent) {
        const { total } = calculateTotals(inv.items, inv.discount, inv.taxRate);
        const status = getEffectiveStatus(inv);
        results.push({
          id: `inv-${inv.id}`,
          category: 'invoice',
          title: `${inv.number} • ${inv.client.name}`,
          subtitle: `Total: ${formatCurrency(total, inv.currency)}`,
          badge: <StatusBadge status={status} size="sm" />,
          icon: <FileText className="w-4 h-4 text-blue-600" />,
          onSelect: () => {
            navigate(`/invoices/${inv.id}/edit`);
            onClose();
          },
        });
      }

      return results;
    }

    // Filter Invoices
    for (const inv of invoices) {
      const matchNumber = inv.number.toLowerCase().includes(q);
      const matchClient = inv.client.name.toLowerCase().includes(q);
      const matchItem = inv.items.some((i) => i.description.toLowerCase().includes(q));

      if (matchNumber || matchClient || matchItem) {
        const { total } = calculateTotals(inv.items, inv.discount, inv.taxRate);
        const status = getEffectiveStatus(inv);
        results.push({
          id: `inv-${inv.id}`,
          category: 'invoice',
          title: `${inv.number} — ${inv.client.name}`,
          subtitle: `Amount: ${formatCurrency(total, inv.currency)}`,
          badge: <StatusBadge status={status} size="sm" />,
          icon: <FileText className="w-4 h-4 text-blue-600" />,
          onSelect: () => {
            navigate(`/invoices/${inv.id}/edit`);
            onClose();
          },
        });
      }
    }

    // Filter Clients
    for (const client of clients) {
      const matchName = client.name.toLowerCase().includes(q);
      const matchEmail = client.email.toLowerCase().includes(q);
      const matchPhone = client.phone ? client.phone.includes(q) : false;

      if (matchName || matchEmail || matchPhone) {
        results.push({
          id: `client-${client.id}`,
          category: 'client',
          title: client.name,
          subtitle: client.email || client.phone || 'Saved Client',
          icon: <Users className="w-4 h-4 text-indigo-500" />,
          onSelect: () => {
            navigate('/clients');
            onClose();
          },
        });
      }
    }

    // Filter Inventory Products/Services
    for (const product of products) {
      const matchName = product.name.toLowerCase().includes(q);
      const matchSku = product.sku ? product.sku.toLowerCase().includes(q) : false;
      const matchDesc = product.description ? product.description.toLowerCase().includes(q) : false;

      if (matchName || matchSku || matchDesc) {
        const isProduct = product.type === 'product';
        const stock = product.stock ?? 0;
        const lowStock = isProduct && stock <= (product.lowStockThreshold ?? 5);

        results.push({
          id: `prod-${product.id}`,
          category: 'item',
          title: product.name,
          subtitle: `${formatCurrency(product.unitPrice, settings.defaultCurrency || 'NGN')}${
            product.sku ? ` • SKU: ${product.sku}` : ''
          }`,
          badge: isProduct ? (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                stock === 0
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : lowStock
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {stock === 0 ? 'Out of stock' : `${stock} in stock`}
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Service
            </span>
          ),
          icon: isProduct ? (
            <Package className="w-4 h-4 text-[#FF7916]" />
          ) : (
            <Wrench className="w-4 h-4 text-slate-500" />
          ),
          onSelect: () => {
            navigate('/inventory');
            onClose();
          },
        });
      }
    }

    // Filter Actions
    const matchedActions = defaultActions.filter(
      (a) => a.title.toLowerCase().includes(q) || (a.subtitle && a.subtitle.toLowerCase().includes(q))
    );
    results.push(...matchedActions);

    return results;
  }, [query, invoices, clients, products, settings, theme, toggleTheme, navigate, onClose]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < items.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;
    const activeElement = listElement.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search invoices, clients, inventory, or actions..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No matching results found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for an invoice number, client name, product, or action.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    data-index={index}
                    onClick={item.onSelect}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-slate-900 dark:text-white ring-1 ring-[#FF7916]/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-orange-100 dark:bg-orange-900/60 text-[#FF7916]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold truncate text-slate-900 dark:text-white">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge}
                      {isSelected && (
                        <span className="hidden sm:flex items-center text-[10px] text-[#FF7916] font-semibold gap-0.5">
                          Select <CornerDownLeft className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Keyboard Hint Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↵
              </kbd>{' '}
              Select
            </span>
          </div>
          <span className="hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};
