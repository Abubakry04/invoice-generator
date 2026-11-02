import React, { useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import {
  Plus,
  Trash2,
  Calendar,
  Hash,
  Users,
  Percent,
  Palette,
  Check,
  Building2,
  Sparkles,
  CreditCard,
  FileText,
  Clock,
  ExternalLink,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { InvoiceFormData } from './invoiceSchema';
import { useClientStore } from '../../store/clientStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useProductStore } from '../../store/productStore';
import { CatalogPickerModal } from '../inventory/CatalogPickerModal';
import { ProductItem } from '../../types';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { formatCurrency, getCurrencySymbol, SUPPORTED_CURRENCIES } from '../../lib/formatCurrency';
import { getTodayDateString, getDefaultDueDate } from '../../lib/dates';
import { calculateTotals } from '../../lib/calculateTotals';
import { InvoiceTemplate } from '../../types';
import { Link } from 'react-router-dom';

interface InvoiceFormProps {
  form: UseFormReturn<InvoiceFormData>;
}

const TEMPLATES: { id: InvoiceTemplate; name: string; desc: string; icon: string }[] = [
  { id: 'modern', name: 'Modern', desc: 'Vibrant colored banner & badge', icon: '🎨' },
  { id: 'classic', name: 'Classic', desc: 'Corporate double-ruled layout', icon: '🏛️' },
  { id: 'minimal', name: 'Minimal', desc: 'Understated typographic elegance', icon: '✨' },
];

const ACCENT_COLORS = [
  { name: 'Brand Orange', value: '#FF7916' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Amber Bronze', value: '#d97706' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Slate Dark', value: '#334155' },
];

const QUICK_TERMS = [
  'Payment is due within 14 days of issue. Kindly quote invoice number in bank transfer remarks.',
  'Payment due upon receipt. 100% upfront required before service commencement.',
  'Net 30 days. Thank you for your valued business partnership!',
];

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ form }) => {
  const { clients } = useClientStore();
  const { settings } = useSettingsStore();
  const { products } = useProductStore();

  const [showBusinessDetails, setShowBusinessDetails] = useState(false);
  const [catalogPickerRow, setCatalogPickerRow] = useState<number | null>(null);

  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const currency = watch('currency') || 'NGN';
  const selectedTemplate = watch('template') || 'modern';
  const selectedColor = watch('accentColor') || '#FF7916';
  const items = watch('items') || [];
  const discount = watch('discount') || 0;
  const taxRate = watch('taxRate') || 0;
  const business = watch('business') || settings.business;

  const currencySymbol = getCurrencySymbol(currency);
  const totals = calculateTotals(items, discount, taxRate);

  // Quick preset helper for due dates
  const setDueInDays = (days: number) => {
    setValue('dueDate', getDefaultDueDate(days), { shouldValidate: true, shouldDirty: true });
  };

  // Handle client selection from saved clients
  const handleClientSelect = (clientId: string) => {
    if (!clientId) return;
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setValue('client.name', client.name, { shouldValidate: true, shouldDirty: true });
      setValue('client.email', client.email, { shouldValidate: true, shouldDirty: true });
      setValue('client.address', client.address, { shouldValidate: true, shouldDirty: true });
      if (client.phone) {
        setValue('client.phone', client.phone, { shouldDirty: true });
      }
    }
  };

  const handleSelectCatalogItem = (product: ProductItem) => {
    const itemDesc = product.name + (product.description ? ` - ${product.description}` : '');
    if (catalogPickerRow === null) return;

    if (catalogPickerRow === -1) {
      // Append new line item from catalog
      append({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        description: itemDesc,
        quantity: 1,
        unitPrice: product.unitPrice,
      });
    } else {
      // Fill current row from catalog
      setValue(`items.${catalogPickerRow}.productId`, product.id, { shouldDirty: true });
      setValue(`items.${catalogPickerRow}.description`, itemDesc, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`items.${catalogPickerRow}.unitPrice`, product.unitPrice, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setCatalogPickerRow(null);
  };

  const handleSelectCustomItem = (customName: string) => {
    if (catalogPickerRow === null) return;

    if (catalogPickerRow === -1) {
      append({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        description: customName || '',
        quantity: 1,
        unitPrice: 0,
      });
    } else {
      setValue(`items.${catalogPickerRow}.productId`, undefined, { shouldDirty: true });
      setValue(`items.${catalogPickerRow}.description`, customName || '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setCatalogPickerRow(null);
  };

  const handleAddLineItem = () => {
    append({
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
    });
  };

  return (
    <div className="space-y-6 text-sm">
      {/* 1. Header Metadata & Visual Styling Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] flex items-center justify-center font-bold shadow-xs">
              <Hash className="w-5 h-5 text-[#FF7916]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Invoice Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Numbering, timeline, and styling parameters
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Currency:</span>
            <span className="text-[#FF7916] font-mono font-bold">{currency}</span>
          </div>
        </div>

        {/* Top Grid: Number, Status, Currency, Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Invoice Number"
            {...register('number')}
            error={errors.number?.message}
            placeholder="INV-0001"
            leftAddon={<Hash className="w-4 h-4 text-[#FF7916]" />}
            required
          />

          <Select
            label="Currency"
            {...register('currency')}
            options={SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
          />

          <Input
            label="Issue Date"
            type="date"
            {...register('issueDate')}
            error={errors.issueDate?.message}
            leftAddon={<Calendar className="w-4 h-4 text-slate-400" />}
            required
          />

          <div className="space-y-1.5">
            <Input
              label="Due Date"
              type="date"
              {...register('dueDate')}
              error={errors.dueDate?.message}
              leftAddon={<Clock className="w-4 h-4 text-slate-400" />}
              required
            />
            {/* Quick date presets */}
            <div className="flex items-center gap-1 pt-0.5">
              <span className="text-[10px] text-slate-400">Preset:</span>
              <button
                type="button"
                onClick={() => setValue('dueDate', getTodayDateString(), { shouldDirty: true })}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDueInDays(7)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                +7d
              </button>
              <button
                type="button"
                onClick={() => setDueInDays(14)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/50 text-[#FF7916] font-semibold hover:bg-orange-100 transition-colors"
              >
                +14d
              </button>
              <button
                type="button"
                onClick={() => setDueInDays(30)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                +30d
              </button>
            </div>
          </div>
        </div>

        {/* Inline Design & Template Selector */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Template Selector Pills */}
            <div className="md:col-span-7 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF7916]" />
                Invoice Template
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map((t) => {
                  const isSelected = selectedTemplate === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setValue('template', t.id, { shouldDirty: true })}
                      className={`px-3 py-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-[#FF7916] bg-orange-50/60 dark:bg-orange-950/30 text-[#FF7916] ring-1 ring-[#FF7916]/30'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm">{t.icon}</span>
                        <span className="text-xs font-bold truncate">{t.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color Swatches */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#FF7916]" />
                Brand Accent Color
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-none py-0.5">
                  {ACCENT_COLORS.map((c) => {
                    const isSelected = selectedColor.toLowerCase() === c.value.toLowerCase();
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setValue('accentColor', c.value, { shouldDirty: true })}
                        className={`w-6 h-6 rounded-lg transition-transform shrink-0 flex items-center justify-center relative ${
                          isSelected
                            ? 'scale-110 shadow-sm ring-2 ring-slate-900 dark:ring-white'
                            : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setValue('accentColor', e.target.value, { shouldDirty: true })}
                  className="w-6 h-6 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent shrink-0"
                  title="Custom color"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Parties Grid: Bill From & Bill To */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Bill From: Sender (Compact & Collapsible) */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#FF7916]" />
              From (Your Business)
            </h3>
            <Link
              to="/settings"
              className="text-[11px] font-semibold text-[#FF7916] hover:underline flex items-center gap-1"
              title="Edit default business profile in Settings"
            >
              <span>Settings</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="w-11 h-11 rounded-xl object-contain bg-white p-1 border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] font-bold text-base flex items-center justify-center shrink-0">
                {business.name?.charAt(0) || 'E'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                {business.name || 'EgolePay LTD'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {business.email || 'billing@domain.com'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                {business.address || 'Lagos, Nigeria'}
              </p>
            </div>
          </div>

          {/* Collapsible invoice-specific overrides */}
          <div>
            <button
              type="button"
              onClick={() => setShowBusinessDetails(!showBusinessDetails)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
            >
              {showBusinessDetails ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide sender overrides</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Edit sender for this invoice only</span>
                </>
              )}
            </button>

            {showBusinessDetails && (
              <div className="mt-3 space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                <Input
                  label="Company Name"
                  {...register('business.name')}
                  placeholder="EgolePay LTD"
                />
                <Input
                  label="Business Email"
                  type="email"
                  {...register('business.email')}
                  placeholder="billing@domain.com"
                />
                <Input
                  label="Business Phone"
                  {...register('business.phone')}
                  placeholder="+234 802 345 6789"
                />
                <Textarea
                  label="Business Address"
                  {...register('business.address')}
                  rows={2}
                  placeholder="Company Address"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bill To: Customer (Client Details) */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF7916]" />
              Bill To (Client)
            </h3>

            {/* Quick Populate Dropdown */}
            {clients.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Auto-fill:</span>
                <select
                  onChange={(e) => handleClientSelect(e.target.value)}
                  defaultValue=""
                  className="text-xs py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FF7916]/20 focus:border-[#FF7916]"
                >
                  <option value="" disabled>
                    Choose saved client...
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3.5">
            <Input
              label="Client Name"
              {...register('client.name')}
              error={errors.client?.name?.message}
              placeholder="e.g. PayWave Fintech Solutions"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Client Email"
                type="email"
                {...register('client.email')}
                error={errors.client?.email?.message}
                placeholder="accounts@client.com"
              />

              <Input
                label="Phone Number"
                {...register('client.phone')}
                placeholder="+234 810 555 1234"
              />
            </div>

            <Textarea
              label="Billing Address"
              {...register('client.address')}
              placeholder="Landmark Towers, Water Corp Rd, VI, Lagos"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* 3. Interactive Line Items Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] flex items-center justify-center font-bold">
                <FileText className="w-4 h-4 text-[#FF7916]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Line Items</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                {fields.length} {fields.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            {errors.items?.message && (
              <p className="text-xs text-rose-500 font-medium mt-1">{errors.items.message}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCatalogPickerRow(-1)}
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              icon={<Package className="w-4 h-4 text-[#FF7916]" />}
            >
              Select from Catalog
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLineItem}
              className="border-[#FF7916]/30 text-[#FF7916] hover:bg-orange-50 dark:hover:bg-orange-950/30 font-semibold"
              icon={<Plus className="w-4 h-4 text-[#FF7916]" />}
            >
              Add Custom Item
            </Button>
          </div>
        </div>

        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Item / Service Description</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit Price ({currencySymbol})</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        {/* Line Items List */}
        <div className="space-y-3">
          {fields.map((field, index) => {
            const itemQty = items[index]?.quantity || 0;
            const itemPrice = items[index]?.unitPrice || 0;
            const itemTotal = (Number(itemQty) || 0) * (Number(itemPrice) || 0);
            const productId = items[index]?.productId;
            const matchedProduct = productId
              ? products.find((p) => p.id === productId)
              : undefined;
            const isProduct = matchedProduct?.type === 'product';
            const stock = matchedProduct?.stock ?? 0;
            const threshold = matchedProduct?.lowStockThreshold ?? 5;
            const isOverStock = isProduct && (Number(itemQty) || 0) > stock;
            const isOutOfStock = isProduct && stock === 0;
            const isLowStock = isProduct && stock > 0 && stock <= threshold;

            return (
              <div
                key={field.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3 group"
              >
                {/* Unified Responsive Row View */}
                <div className="space-y-3">
                  {/* Mobile header (index + delete button) */}
                  <div className="flex md:hidden items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Item #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    {/* Index (Desktop only) */}
                    <div className="hidden md:flex col-span-1 justify-center pt-2.5 font-mono text-xs font-bold text-slate-400">
                      {index + 1}
                    </div>

                    {/* Description */}
                    <div className="col-span-1 md:col-span-5 space-y-1">
                      <label className="block md:hidden text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Description
                      </label>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1">
                          <Input
                            placeholder="Enter product or service name..."
                            {...register(`items.${index}.description` as const)}
                            error={errors.items?.[index]?.description?.message}
                            className="bg-white dark:bg-slate-900"
                          />
                        </div>
                        {matchedProduct ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setCatalogPickerRow(index)}
                              title="Linked to catalog (Click to change)"
                              className="p-2 rounded-xl border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-[#FF7916] transition-colors"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setValue(`items.${index}.productId`, undefined, { shouldDirty: true });
                              }}
                              title="Unlink from catalog (convert to custom item)"
                              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCatalogPickerRow(index)}
                            title="Select from catalog (Optional)"
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#FF7916] text-slate-400 hover:text-[#FF7916] bg-white dark:bg-slate-900 transition-colors shrink-0"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Stock Counter Badge */}
                      {isProduct && (
                        <div className="flex items-center gap-2 pl-0.5 pt-0.5">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
                              <XCircle className="w-3 h-3" /> Out of stock (0 on hand)
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                              <AlertTriangle className="w-3 h-3" /> Low stock: {stock} on hand
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" /> In stock: {stock} on hand
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 md:col-span-2">
                      <label className="block md:hidden text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        {...register(`items.${index}.quantity` as const)}
                        error={errors.items?.[index]?.quantity?.message}
                        className="text-right font-mono bg-white dark:bg-slate-900"
                      />
                      {isOverStock && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block text-right mt-1">
                          ⚠️ Exceeds stock ({stock})
                        </span>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-1 md:col-span-2">
                      <label className="block md:hidden text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Unit Price ({currencySymbol})
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        {...register(`items.${index}.unitPrice` as const)}
                        error={errors.items?.[index]?.unitPrice?.message}
                        className="text-right font-mono bg-white dark:bg-slate-900"
                      />
                    </div>

                    {/* Total & Action */}
                    <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-2 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      <span className="md:hidden text-xs text-slate-500 font-semibold">Line Total:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate">
                        {formatCurrency(itemTotal, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add item prompt */}
        <button
          type="button"
          onClick={handleAddLineItem}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#FF7916] text-slate-600 dark:text-slate-400 hover:text-[#FF7916] flex items-center justify-center gap-2 font-semibold text-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Line Item</span>
        </button>
      </div>

      {/* 4. Financial Calculation, Bank Remittance & Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Bank Details & Terms */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <CreditCard className="w-4 h-4 text-[#FF7916]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Payment Terms & Bank Details
            </h3>
          </div>

          <Textarea
            label="Payment Instructions / Remittance Account"
            {...register('business.bankDetails')}
            placeholder="Bank Name, Account Name, Account Number, Sort Code"
            rows={3}
          />

          <div className="space-y-2">
            <Textarea
              label="Notes & Terms for Customer"
              {...register('notes')}
              placeholder="e.g. Payment due within 14 days of issue. Thank you!"
              rows={3}
            />

            {/* Quick Notes Presets */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-medium">Quick suggestions:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TERMS.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setValue('notes', term, { shouldDirty: true })}
                    className="text-[10px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 transition-colors text-left line-clamp-1"
                    title={term}
                  >
                    "{term.slice(0, 36)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summary Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-orange-950/10 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Payable Breakdown
            </h3>
            <span className="text-xs font-mono font-bold text-[#FF7916]">{currency}</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Subtotal */}
            <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {formatCurrency(totals.subtotal, currency)}
              </span>
            </div>

            {/* Discount Row */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  Discount ({discount}%)
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  - {formatCurrency(totals.discountAmount, currency)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  {...register('discount')}
                  placeholder="0"
                  leftAddon={<Percent className="w-3.5 h-3.5" />}
                  className="h-8 text-xs bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* VAT / Tax Row */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  VAT / Tax ({taxRate}%)
                  <span className="text-[10px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    VAT
                  </span>
                </span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  + {formatCurrency(totals.taxAmount, currency)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  {...register('taxRate')}
                  placeholder="7.5"
                  leftAddon={<Percent className="w-3.5 h-3.5" />}
                  className="h-8 text-xs bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Grand Total Highlight */}
            <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700">
              <div className="p-4 rounded-2xl bg-slate-900 text-white dark:bg-slate-950 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="uppercase tracking-wider font-semibold">Total Amount Due</span>
                  <span className="font-mono text-orange-400 font-bold">{currency}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white flex items-baseline justify-between">
                  <span>{formatCurrency(totals.total, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Picker Modal */}
      <CatalogPickerModal
        isOpen={catalogPickerRow !== null}
        onClose={() => setCatalogPickerRow(null)}
        onSelect={handleSelectCatalogItem}
        onSelectCustom={handleSelectCustomItem}
      />
    </div>
  );
};
