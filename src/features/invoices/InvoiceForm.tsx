import React, { useState, useMemo } from 'react';
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
  Lock,
} from 'lucide-react';
import { InvoiceFormData } from './invoiceSchema';
import { useClientStore } from '../../store/clientStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useProductStore } from '../../store/productStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useUiStore } from '../../store/uiStore';
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
  { id: 'minimal', name: 'Minimal', desc: 'Understated typographic elegance (Free)', icon: '✨' },
  { id: 'classic', name: 'Classic', desc: 'Corporate double-ruled layout (Starter)', icon: '🏛️' },
  { id: 'modern', name: 'Modern', desc: 'Vibrant colored banner & badge (Business)', icon: '🎨' },
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
  const { hasFeature, isTemplateAllowed, getRequiredPlanForTemplate } =
    useSubscriptionStore();
  const { openModal } = useUiStore();

  const canUseMultiCurrency = hasFeature('multi_currency');
  const canUseCustomAccent = hasFeature('custom_accent');
  const canUsePaymentPortal = hasFeature('payment_portal');

  const [showBusinessDetails, setShowBusinessDetails] = useState(false);
  const [catalogPickerRow, setCatalogPickerRow] = useState<number | null>(null);

  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const currencyOptions = useMemo(() => {
    return SUPPORTED_CURRENCIES.map((c) => {
      const isDefault = c.code === (settings.defaultCurrency || 'NGN');
      if (canUseMultiCurrency || isDefault) {
        return { value: c.code, label: c.label };
      }
      return { value: c.code, label: `${c.label} 🔒 (Starter)` };
    });
  }, [canUseMultiCurrency, settings.defaultCurrency]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value;
    const isDefault = chosen === (settings.defaultCurrency || 'NGN');
    if (!canUseMultiCurrency && !isDefault) {
      openModal('upgrade', {
        targetPlan: 'starter',
        trigger: 'Invoicing in international currencies (USD, EUR, GBP, etc.) is available on the Starter Plan.',
      });
      setValue('currency', settings.defaultCurrency || 'NGN', { shouldDirty: true });
      return;
    }
    setValue('currency', chosen, { shouldDirty: true, shouldValidate: true });
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const currency = watch('currency') || 'NGN';
  const selectedTemplate = watch('template') || 'minimal';
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
    <div className="space-y-5 text-sm">
      {/* 1. Sleek Design, Template & Currency Bar (Toolbar above document) */}
      <div className="bg-white dark:bg-slate-900 p-2.5 sm:px-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        {/* Template Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium hidden sm:inline text-xs">Template:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
            {TEMPLATES.map((t) => {
              const isSelected = selectedTemplate === t.id;
              const isAllowed = isTemplateAllowed(t.id);
              const requiredPlan = getRequiredPlanForTemplate(t.id);

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (!isAllowed) {
                      openModal('upgrade', {
                        targetPlan: requiredPlan,
                        trigger: `The "${t.name}" template is available on the ${
                          requiredPlan === 'starter' ? 'Starter' : 'Business'
                        } plan.`,
                      });
                      return;
                    }
                    setValue('template', t.id, { shouldDirty: true });
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-[#FF7916] shadow-xs'
                      : !isAllowed
                      ? 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={!isAllowed ? `Requires ${requiredPlan === 'business' ? 'Business' : 'Starter'} Plan` : t.name}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                  {!isAllowed && (
                    <span className="inline-flex items-center text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                      <Lock className="w-2.5 h-2.5 mr-0.5" />
                      {requiredPlan === 'business' ? 'Biz' : 'Starter'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Color & Currency */}
        <div className="flex items-center gap-3">
          {/* Accent Color dots */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium hidden md:inline text-xs">Color:</span>
            <div className="flex items-center gap-1.5">
              {ACCENT_COLORS.map((c) => {
                const isSelected = selectedColor.toLowerCase() === c.value.toLowerCase();
                const isBrandOrange = c.value.toLowerCase() === '#ff7916';
                const isLocked = !isBrandOrange && !canUseCustomAccent;

                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      if (isLocked) {
                        openModal('upgrade', {
                          targetPlan: 'starter',
                          trigger: 'Custom brand accent colors require the Starter plan.',
                        });
                        return;
                      }
                      setValue('accentColor', c.value, { shouldDirty: true });
                    }}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      isSelected
                        ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white scale-110'
                        : isLocked
                        ? 'opacity-40 hover:opacity-70'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={isLocked ? `${c.name} (Starter)` : c.name}
                  />
                );
              })}
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Currency */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium hidden sm:inline text-xs">Currency:</span>
            <select
              value={currency}
              onChange={handleCurrencyChange}
              className="py-1 px-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF7916]"
            >
              {currencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Unified Document Canvas */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
        {/* Document Header: Business (From) & Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-6 border-b border-slate-100 dark:border-slate-800">
          {/* Sender / Business Profile */}
          <div className="md:col-span-6 space-y-2.5">
            <div className="flex items-center gap-3">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt={business.name}
                  className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] font-bold text-lg flex items-center justify-center shrink-0">
                  {business.name?.charAt(0) || 'E'}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {business.name || 'EgolePay LTD'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {business.email || 'billing@domain.com'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
                  {business.address || 'Lagos, Nigeria'}
                </p>
              </div>
            </div>

            {/* Collapsible invoice-specific sender override */}
            <div>
              <button
                type="button"
                onClick={() => setShowBusinessDetails(!showBusinessDetails)}
                className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium flex items-center gap-1 transition-colors"
              >
                {showBusinessDetails ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Hide sender details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Edit sender details for this invoice</span>
                  </>
                )}
              </button>

              {showBusinessDetails && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  <Input
                    label="Business Address"
                    {...register('business.address')}
                    placeholder="Company Address"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Invoice Metadata (Number, Issue Date, Due Date) */}
          <div className="md:col-span-6 space-y-3 md:text-right">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              INVOICE
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:justify-end text-left">
              <Input
                label="Invoice #"
                {...register('number')}
                error={errors.number?.message}
                placeholder="INV-0001"
                required
              />

              <Input
                label="Issue Date"
                type="date"
                {...register('issueDate')}
                error={errors.issueDate?.message}
                required
              />

              <div className="space-y-1">
                <Input
                  label="Due Date"
                  type="date"
                  {...register('dueDate')}
                  error={errors.dueDate?.message}
                  required
                />
                <div className="flex items-center gap-1 justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setValue('dueDate', getTodayDateString(), { shouldDirty: true })}
                    className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Today
                  </button>
                  <span className="text-[10px] text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setDueInDays(14)}
                    className="text-[10px] text-[#FF7916] font-semibold hover:underline"
                  >
                    +14d
                  </button>
                  <span className="text-[10px] text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setDueInDays(30)}
                    className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    +30d
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To: Customer Details */}
        <div className="space-y-3.5 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#FF7916]" />
              Bill To (Client)
            </h3>

            {/* Saved Client Quick Select */}
            {clients.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 hidden sm:inline">Select saved:</span>
                <select
                  onChange={(e) => handleClientSelect(e.target.value)}
                  defaultValue=""
                  className="text-xs py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#FF7916]"
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

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <Input
                label="Client / Company Name"
                {...register('client.name')}
                error={errors.client?.name?.message}
                placeholder="Client Name or Company"
                required
              />
            </div>
            <div className="sm:col-span-6">
              <Input
                label="Client Email"
                type="email"
                {...register('client.email')}
                error={errors.client?.email?.message}
                placeholder="billing@client.com"
              />
            </div>
            <div className="sm:col-span-6">
              <Input
                label="Phone Number (Optional)"
                {...register('client.phone')}
                placeholder="+234 810 000 0000"
              />
            </div>
            <div className="sm:col-span-6">
              <Input
                label="Billing Address"
                {...register('client.address')}
                placeholder="Client office or billing address"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#FF7916]" />
              Items & Services
            </h3>
            {errors.items?.message && (
              <p className="text-xs text-rose-500 font-medium">{errors.items.message}</p>
            )}
          </div>

          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit Price ({currencySymbol})</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Line Items Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
                <div key={field.id} className="py-2.5">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Index (Desktop) */}
                    <div className="hidden md:flex col-span-1 justify-center font-mono text-xs text-slate-400">
                      {index + 1}
                    </div>

                    {/* Description */}
                    <div className="col-span-1 md:col-span-5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1">
                          <Input
                            placeholder="Product or service description..."
                            {...register(`items.${index}.description` as const)}
                            error={errors.items?.[index]?.description?.message}
                          />
                        </div>
                        {matchedProduct ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setCatalogPickerRow(index)}
                              title="Linked to catalog (Click to change)"
                              className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF7916] transition-colors"
                            >
                              <Package className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setValue(`items.${index}.productId`, undefined, { shouldDirty: true });
                              }}
                              title="Unlink from catalog"
                              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCatalogPickerRow(index)}
                            title="Select from catalog (Optional)"
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#FF7916] text-slate-400 hover:text-[#FF7916] transition-colors shrink-0"
                          >
                            <Package className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Stock Info */}
                      {isProduct && (
                        <div className="flex items-center gap-2 pl-0.5 pt-0.5 text-[10px]">
                          {isOutOfStock ? (
                            <span className="text-rose-500 font-medium">⚠️ Out of stock (0 on hand)</span>
                          ) : isLowStock ? (
                            <span className="text-amber-500 font-medium">⚠️ Low stock: {stock} on hand</span>
                          ) : (
                            <span className="text-emerald-500 font-medium">✓ In stock: {stock} on hand</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 md:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        {...register(`items.${index}.quantity` as const)}
                        error={errors.items?.[index]?.quantity?.message}
                        className="text-right font-mono"
                      />
                      {isOverStock && (
                        <span className="text-[10px] font-bold text-amber-500 block text-right mt-0.5">
                          Exceeds stock ({stock})
                        </span>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-1 md:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        {...register(`items.${index}.unitPrice` as const)}
                        error={errors.items?.[index]?.unitPrice?.message}
                        className="text-right font-mono"
                      />
                    </div>

                    {/* Line Total & Delete */}
                    <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-3">
                      <span className="md:hidden text-xs text-slate-500">Amount:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {formatCurrency(itemTotal, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-20 transition-colors shrink-0"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row: Add Item / Select from Catalog */}
          <div className="flex items-center gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLineItem}
              className="text-xs font-semibold text-[#FF7916] border-[#FF7916]/30 hover:bg-orange-50 dark:hover:bg-orange-950/30"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Item
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCatalogPickerRow(-1)}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              icon={<Package className="w-3.5 h-3.5" />}
            >
              From Inventory
            </Button>
          </div>
        </div>

        {/* Footer: Notes & Calculations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6 border-t border-slate-100 dark:border-slate-800">
          {/* Notes & Bank Details */}
          <div className="lg:col-span-7 space-y-4">
            <Textarea
              label="Payment Instructions & Bank Account"
              {...register('business.bankDetails')}
              placeholder="Bank Name, Account Name, Account Number, Sort Code"
              rows={2}
            />

            <div className="space-y-2">
              <Textarea
                label="Customer Notes & Terms"
                {...register('notes')}
                placeholder="e.g. Payment due within 14 days of issue. Thank you for your business!"
                rows={2}
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TERMS.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setValue('notes', term, { shouldDirty: true })}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    "{term.slice(0, 32)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calculations Summary Card */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
            {/* Subtotal */}
            <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {formatCurrency(totals.subtotal, currency)}
              </span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
              <div className="flex items-center gap-1.5">
                <span>Discount</span>
                <div className="w-16">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    {...register('discount')}
                    placeholder="0"
                    className="h-6 text-xs text-right font-mono py-0 px-1.5"
                  />
                </div>
                <span>%</span>
              </div>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                - {formatCurrency(totals.discountAmount, currency)}
              </span>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
              <div className="flex items-center gap-1.5">
                <span>Tax / VAT</span>
                <div className="w-16">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    {...register('taxRate')}
                    placeholder="7.5"
                    className="h-6 text-xs text-right font-mono py-0 px-1.5"
                  />
                </div>
                <span>%</span>
              </div>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                + {formatCurrency(totals.taxAmount, currency)}
              </span>
            </div>

            {/* Grand Total */}
            <div className="border-t-2 border-slate-300 dark:border-slate-700 pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-900 dark:text-white block">
                    Total Due
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{currency}</span>
                </div>
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-[#FF7916] tracking-tight">
                  {formatCurrency(totals.total, currency)}
                </span>
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
