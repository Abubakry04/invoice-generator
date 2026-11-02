import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { ProductItem, ItemType } from '../../types';
import { Package, Wrench } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { getCurrencySymbol } from '../../lib/formatCurrency';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<ProductItem, 'id' | 'createdAt'>) => void;
  product?: ProductItem | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
}) => {
  const { settings } = useSettingsStore();
  const currencySymbol = getCurrencySymbol(settings.defaultCurrency || 'NGN');

  const [type, setType] = useState<ItemType>('product');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('10');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('5');
  const [sku, setSku] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setType(product.type);
      setName(product.name);
      setDescription(product.description || '');
      setUnitPrice(product.unitPrice.toString());
      setStock(product.stock !== undefined ? product.stock.toString() : '0');
      setLowStockThreshold(
        product.lowStockThreshold !== undefined ? product.lowStockThreshold.toString() : '5'
      );
      setSku(product.sku || '');
    } else {
      setType('product');
      setName('');
      setDescription('');
      setUnitPrice('');
      setStock('10');
      setLowStockThreshold('5');
      setSku('');
    }
    setErrors({});
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Item name is required';

    const parsedPrice = parseFloat(unitPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      newErrors.unitPrice = 'Enter a valid unit price';
    }

    let parsedStock: number | undefined = undefined;
    let parsedThreshold: number | undefined = undefined;

    if (type === 'product') {
      const s = parseInt(stock, 10);
      if (isNaN(s) || s < 0) {
        newErrors.stock = 'Stock must be 0 or greater';
      } else {
        parsedStock = s;
      }

      const t = parseInt(lowStockThreshold, 10);
      if (!isNaN(t) && t >= 0) {
        parsedThreshold = t;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      unitPrice: parsedPrice,
      stock: parsedStock,
      lowStockThreshold: parsedThreshold,
      sku: sku.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Item' : 'Add Item to Catalog'}
      description="Save products with stock tracking or service items for fast, accurate invoicing."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Item Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('product')}
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                type === 'product'
                  ? 'border-[#FF7916] bg-orange-50/50 dark:bg-orange-950/20 ring-2 ring-[#FF7916]/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  type === 'product'
                    ? 'bg-[#FF7916] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Physical Product</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Tracks stock count</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('service')}
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                type === 'service'
                  ? 'border-[#FF7916] bg-orange-50/50 dark:bg-orange-950/20 ring-2 ring-[#FF7916]/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  type === 'service'
                    ? 'bg-[#FF7916] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Service / Labor</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">No stock tracking</p>
              </div>
            </button>
          </div>
        </div>

        {/* Item Name */}
        <Input
          label="Item or Service Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder={type === 'product' ? 'e.g. Smart POS Terminal V2' : 'e.g. Website Consulting'}
          error={errors.name}
          required
        />

        {/* SKU & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="SKU / Item Code (Optional)"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="e.g. POS-V2-01"
          />

          <Input
            label={`Unit Price (${currencySymbol})`}
            type="number"
            min="0"
            step="any"
            value={unitPrice}
            onChange={(e) => {
              setUnitPrice(e.target.value);
              if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: '' }));
            }}
            placeholder="0.00"
            error={errors.unitPrice}
            required
          />
        </div>

        {/* Stock Management Fields (Product Only) */}
        {type === 'product' && (
          <div className="p-4 rounded-2xl bg-orange-50/40 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#FF7916]" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-900 dark:text-orange-200">
                Stock Counter Settings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="On-Hand Stock Quantity"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value);
                  if (errors.stock) setErrors((prev) => ({ ...prev, stock: '' }));
                }}
                error={errors.stock}
                required
              />

              <Input
                label="Low Stock Alert Threshold"
                type="number"
                min="0"
                step="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="5"
                helperText="Triggers warning when stock falls below this level"
              />
            </div>
          </div>
        )}

        {/* Description / Notes */}
        <Textarea
          label="Item Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief details that will appear on invoices when this item is selected..."
          rows={2}
        />

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            {product ? 'Save Changes' : 'Add to Catalog'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
