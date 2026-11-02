import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Wrench,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FilePlus,
  Boxes,
  MinusCircle,
  PlusCircle,
  XCircle,
} from 'lucide-react';
import { useProductStore } from '../../store/productStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ProductModal } from './ProductModal';
import { ProductItem } from '../../types';
import { formatCurrency } from '../../lib/formatCurrency';

type FilterType = 'all' | 'products' | 'services' | 'low-stock';

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct, adjustStock } = useProductStore();
  const { settings } = useSettingsStore();
  const toast = useToast();

  const currency = settings.defaultCurrency || 'NGN';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let productCount = 0;
    let serviceCount = 0;

    for (const p of products) {
      if (p.type === 'product') {
        productCount++;
        const s = p.stock ?? 0;
        totalStockUnits += s;
        const threshold = p.lowStockThreshold ?? 5;
        if (s === 0) {
          outOfStockCount++;
        } else if (s <= threshold) {
          lowStockCount++;
        }
      } else {
        serviceCount++;
      }
    }

    return {
      totalItems: products.length,
      productCount,
      serviceCount,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Filter items
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Filter tab
      if (activeFilter === 'products' && p.type !== 'product') return false;
      if (activeFilter === 'services' && p.type !== 'service') return false;
      if (activeFilter === 'low-stock') {
        if (p.type !== 'product') return false;
        const threshold = p.lowStockThreshold ?? 5;
        const s = p.stock ?? 0;
        if (s > threshold) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
        if (!matchName && !matchSku && !matchDesc) return false;
      }

      return true;
    });
  }, [products, activeFilter, searchQuery]);

  const handleSaveProduct = (data: Omit<ProductItem, 'id' | 'createdAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
      toast.success(`"${data.name}" updated successfully`);
    } else {
      addProduct(data);
      toast.success(`"${data.name}" added to catalog`);
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = () => {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id);
      toast.info(`"${deletingProduct.name}" removed from catalog`);
      setDeletingProduct(null);
    }
  };

  const handleQuickStockAdjust = (id: string, name: string, delta: number) => {
    adjustStock(id, delta);
    const direction = delta > 0 ? '+1 added' : '-1 deducted';
    toast.info(`Stock updated: ${name} (${direction})`);
  };

  const handleCreateInvoiceWithItem = (item: ProductItem) => {
    navigate(`/invoices/new?prefillProductId=${item.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Inventory & Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track on-hand stock counters, monitor low stock alerts, and save services for quick invoicing.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
          size="md"
        >
          Add Item
        </Button>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Catalog Items */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Catalog</span>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#FF7916]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {stats.totalItems}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.productCount} physical, {stats.serviceCount} services
          </p>
        </div>

        {/* Total Stock Units */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">On-Hand Stock</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {stats.totalStockUnits}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total units across all physical inventory
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setActiveFilter('low-stock')}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all ${
            stats.lowStockCount > 0
              ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Low Stock Warnings</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {stats.lowStockCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.lowStockCount > 0 ? 'Click to filter items needing restock' : 'All product stock levels healthy'}
          </p>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setActiveFilter('low-stock')}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all ${
            stats.outOfStockCount > 0
              ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Out of Stock</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {stats.outOfStockCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.outOfStockCount > 0 ? 'Depleted inventory items' : 'No items currently depleted'}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-[#FF7916] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Items ({products.length})
          </button>
          <button
            onClick={() => setActiveFilter('products')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeFilter === 'products'
                ? 'bg-[#FF7916] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Products ({stats.productCount})
          </button>
          <button
            onClick={() => setActiveFilter('services')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeFilter === 'services'
                ? 'bg-[#FF7916] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Services ({stats.serviceCount})
          </button>
          <button
            onClick={() => setActiveFilter('low-stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeFilter === 'low-stock'
                ? 'bg-amber-500 text-white shadow-xs'
                : stats.lowStockCount > 0 || stats.outOfStockCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Alerts ({stats.lowStockCount + stats.outOfStockCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, SKU..."
            leftAddon={<Search className="w-4 h-4 text-slate-400" />}
            className="text-xs bg-slate-50 dark:bg-slate-800/80"
          />
        </div>
      </div>

      {/* Catalog Table */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No items found"
          description={
            searchQuery
              ? `No catalog items matched "${searchQuery}". Try a different keyword.`
              : 'Add your first product or service to start tracking stock and invoicing faster.'
          }
          actionLabel="Add Item"
          onAction={() => {
            setEditingProduct(null);
            setModalOpen(true);
          }}
          icon={<Package className="w-8 h-8 text-slate-400" />}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Item / Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Unit Price</th>
                  <th className="py-3.5 px-4">Stock Counter</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredProducts.map((item) => {
                  const isProduct = item.type === 'product';
                  const stock = item.stock ?? 0;
                  const threshold = item.lowStockThreshold ?? 5;
                  const isOutOfStock = isProduct && stock === 0;
                  const isLowStock = isProduct && stock > 0 && stock <= threshold;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & SKU */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.sku && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                                {item.sku}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-md">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isProduct ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            <Package className="w-3.5 h-3.5" />
                            Product
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                            <Wrench className="w-3.5 h-3.5" />
                            Service
                          </span>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.unitPrice, currency)}
                      </td>

                      {/* Stock Counter with quick +/- controls */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isProduct ? (
                          <div className="flex items-center gap-2.5">
                            {/* Stock Badge */}
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                                <XCircle className="w-3.5 h-3.5" />
                                Out of Stock (0)
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Low: {stock} left
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {stock} in stock
                              </span>
                            )}

                            {/* Quick + / - Adjuster */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleQuickStockAdjust(item.id, item.name, -1)}
                                disabled={stock <= 0}
                                title="Decrease stock by 1"
                                className="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-mono font-bold px-1.5 text-slate-700 dark:text-slate-300">
                                {stock}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickStockAdjust(item.id, item.name, 1)}
                                title="Increase stock by 1"
                                className="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            — (Service / Billable hours)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCreateInvoiceWithItem(item)}
                            title="Create invoice with this item"
                            className="p-1.5 rounded-lg text-[#FF7916] hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
                          >
                            <FilePlus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(item);
                              setModalOpen(true);
                            }}
                            title="Edit item"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(item)}
                            title="Delete item"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteProduct}
        title="Delete Catalog Item"
        message={`Are you sure you want to remove "${deletingProduct?.name}" from your catalog? This will not alter existing invoices.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};
