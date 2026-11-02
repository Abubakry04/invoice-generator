import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProductItem } from '../../types';
import { useProductStore } from '../../store/productStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency } from '../../lib/formatCurrency';
import { Package, Wrench, Search, Plus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface CatalogPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: ProductItem) => void;
  onSelectCustom?: (name: string) => void;
}

export const CatalogPickerModal: React.FC<CatalogPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectCustom,
}) => {
  const { products } = useProductStore();
  const { settings } = useSettingsStore();
  const currency = settings.defaultCurrency || 'NGN';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'products' | 'services'>('all');

  const filteredProducts = products.filter((p) => {
    if (filterType === 'products' && p.type !== 'product') return false;
    if (filterType === 'services' && p.type !== 'service') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
      const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
      if (!matchName && !matchSku && !matchDesc) return false;
    }
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select from Catalog"
      description="Choose a saved product or service to automatically populate your line item and verify stock."
    >
      <div className="space-y-4">
        {/* Search & Tabs */}
        <div className="space-y-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, SKU..."
            leftAddon={<Search className="w-4 h-4 text-slate-400" />}
            autoFocus
          />

          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              All ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('products')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                filterType === 'products'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Package className="w-3 h-3" /> Products
            </button>
            <button
              type="button"
              onClick={() => setFilterType('services')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                filterType === 'services'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Wrench className="w-3 h-3" /> Services
            </button>
          </div>
        </div>

        {/* Item List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {filteredProducts.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-slate-500 text-xs">
                {searchQuery
                  ? `No catalog items matched "${searchQuery}".`
                  : 'No items in this category.'}
              </p>
              {onSelectCustom && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onSelectCustom(searchQuery);
                      onClose();
                    }}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    {searchQuery
                      ? `Use "${searchQuery}" as Custom Line Item`
                      : 'Add as Blank Custom Line Item'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            filteredProducts.map((item) => {
              const isProduct = item.type === 'product';
              const stock = item.stock ?? 0;
              const threshold = item.lowStockThreshold ?? 5;
              const isOutOfStock = isProduct && stock === 0;
              const isLowStock = isProduct && stock > 0 && stock <= threshold;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#FF7916] hover:bg-orange-50/30 dark:hover:bg-orange-950/20 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isProduct
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {isProduct ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.name}
                        </span>
                        {item.sku && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                            {item.sku}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {formatCurrency(item.unitPrice, currency)}
                    </div>
                    {isProduct ? (
                      isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                          <XCircle className="w-3 h-3" /> Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                          <AlertTriangle className="w-3 h-3" /> {stock} left (Low)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> {stock} in stock
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400">Service</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          {onSelectCustom ? (
            <button
              type="button"
              onClick={() => {
                onSelectCustom(searchQuery);
                onClose();
              }}
              className="text-xs text-[#FF7916] hover:underline font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{searchQuery ? `Use "${searchQuery}" as Custom Item` : 'Add as Custom Item'}</span>
            </button>
          ) : (
            <div />
          )}
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
