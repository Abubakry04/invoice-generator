import React, { useState, useRef } from 'react';
import {
  Building2,
  Sliders,
  Upload,
  Trash2,
  RefreshCw,
  Palette,
  Percent,
  Hash,
  Database,
  CheckCircle,
  FileText,
  Users,
  Package,
  Sparkles,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useClientStore } from '../../store/clientStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useProductStore } from '../../store/productStore';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SUPPORTED_CURRENCIES } from '../../lib/formatCurrency';
import { InvoiceTemplate } from '../../types';

type SettingsTab = 'profile' | 'invoicing' | 'branding' | 'data';

const ACCENT_COLORS = [
  { name: 'Brand Orange', value: '#FF7916' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Amber Bronze', value: '#d97706' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Slate Dark', value: '#334155' },
];

const TEMPLATES: { id: InvoiceTemplate; name: string; desc: string; icon: string }[] = [
  { id: 'modern', name: 'Modern', desc: 'Vibrant colored header banner, bold totals & rounded table', icon: '🎨' },
  { id: 'classic', name: 'Classic', desc: 'Timeless corporate double-ruled layout with elegant borders', icon: '🏛️' },
  { id: 'minimal', name: 'Minimal', desc: 'Understated typographic elegance with clean open spacing', icon: '✨' },
];

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, updateBusiness, resetSettings } = useSettingsStore();
  const { clients, resetClients, clearClients } = useClientStore();
  const { invoices, resetInvoices, clearInvoices } = useInvoiceStore();
  const { products } = useProductStore();
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Form local state
  const [businessName, setBusinessName] = useState(settings.business.name || '');
  const [address, setAddress] = useState(settings.business.address || '');
  const [email, setEmail] = useState(settings.business.email || '');
  const [phone, setPhone] = useState(settings.business.phone || '');
  const [bankDetails, setBankDetails] = useState(settings.business.bankDetails || '');
  const [logo, setLogo] = useState(settings.business.logo || '');

  // Defaults
  const [currency, setCurrency] = useState(settings.defaultCurrency || 'NGN');
  const [taxRate, setTaxRate] = useState(String(settings.defaultTaxRate || 7.5));
  const [prefix, setPrefix] = useState(settings.invoicePrefix || 'INV-');
  const [accentColor, setAccentColor] = useState(settings.accentColor || '#FF7916');
  const [defaultTemplate, setDefaultTemplate] = useState<InvoiceTemplate>(
    settings.defaultTemplate || 'modern'
  );

  // Confirm dialogs
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Handle Logo file upload to base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, or SVG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogo(base64);
      updateBusiness({ logo: base64 });
      toast.success('Business logo updated successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo('');
    updateBusiness({ logo: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Business logo removed');
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateBusiness({
      name: businessName.trim(),
      address: address.trim(),
      email: email.trim(),
      phone: phone.trim(),
      bankDetails: bankDetails.trim(),
      logo,
    });

    updateSettings({
      defaultCurrency: currency,
      defaultTaxRate: parseFloat(taxRate) || 0,
      invoicePrefix: prefix.trim() || 'INV-',
      accentColor,
      defaultTemplate,
    });

    toast.success('Settings saved successfully');
  };

  const handleClearAllData = () => {
    clearInvoices();
    clearClients();
    toast.success('Data cleared. You have a fresh workspace.');
  };

  const handleRestoreSampleData = () => {
    resetSettings();
    resetClients();
    resetInvoices();

    // Reload form values
    setBusinessName('Egolepay LTD');
    setAddress('41, Industrial Avenue, Sabo, Yaba, Lagos, Nigeria');
    setEmail('hello@egolepay.com');
    setPhone('+234 913 933 0394');
    setBankDetails(
      'Guaranty Trust Bank (GTBank)\nAccount Name: Egolepay LTD\nAccount No: 0123456789\nSort Code: 058152062'
    );
    setCurrency('NGN');
    setTaxRate('7.5');
    setPrefix('INV-');
    setAccentColor('#FF7916');
    setDefaultTemplate('modern');

    toast.success('Sample data restored with realistic invoices and clients');
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Business Profile', icon: <Building2 className="w-4 h-4" /> },
    { id: 'invoicing', label: 'Invoice Defaults', icon: <Sliders className="w-4 h-4" /> },
    { id: 'branding', label: 'Branding & Templates', icon: <Palette className="w-4 h-4" /> },
    { id: 'data', label: 'Data Management', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure your business profile, default currency, tax rates, and brand styling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => handleSaveAll()}
            icon={<CheckCircle className="w-4 h-4" />}
            size="md"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-[#FF7916] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* TAB 1: Business Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Business Information</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                This appears on your invoices under the "From" sender header.
              </p>
            </div>

            {/* Logo Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Company Logo
              </label>
              <div className="flex flex-wrap items-center gap-5">
                <div className="w-36 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden relative group p-2">
                  {logo ? (
                    <img src={logo} alt="Business Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400">No logo uploaded</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png, image/jpeg, image/svg+xml, image/webp"
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Upload className="w-4 h-4" />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Logo
                    </Button>
                    {logo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={handleRemoveLogo}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recommended: PNG, SVG, or JPG under 2MB with transparent or clean background.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Egolepay LTD"
                required
              />
              <Input
                label="Billing Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@egolepay.com"
                required
              />
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 913 933 0394"
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Registered Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, City, State, Country"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Bank & Remittance Details (Printed on Invoice)"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  placeholder="Bank Name, Account Name, Account Number, Sort Code..."
                  rows={3}
                  helperText="Provide instructions for wire transfers, direct deposits, or bank accounts."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Invoice Defaults */}
        {activeTab === 'invoicing' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Default Invoicing Parameters</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Set baseline values automatically applied whenever you create a new invoice.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <Select
                  label="Default Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
                />
              </div>
              <div>
                <Input
                  label="Default Tax Rate (%)"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  leftAddon={<Percent className="w-4 h-4" />}
                  helperText="Standard VAT is 7.5% in Nigeria"
                />
              </div>
              <div>
                <Input
                  label="Invoice Number Prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  leftAddon={<Hash className="w-4 h-4" />}
                  placeholder="INV-"
                  helperText="Sequential: INV-0001, INV-0002..."
                />
              </div>
            </div>

            {/* Quick tax presets */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Quick VAT / Tax Presets:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[0, 5, 7.5, 10, 15, 20].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setTaxRate(String(rate))}
                    className={`text-xs px-3 py-1 rounded-xl border transition-colors ${
                      Number(taxRate) === rate
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF7916] border-[#FF7916] font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {rate}% {rate === 7.5 ? '(NG VAT)' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Branding & Templates */}
        {activeTab === 'branding' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Design & Accent Colors</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize how your exported invoices look to your clients.
              </p>
            </div>

            {/* Accent Color Picker */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Palette className="w-4 h-4 text-[#FF7916]" />
                Brand Accent Color
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {ACCENT_COLORS.map((c) => {
                  const isSelected = accentColor.toLowerCase() === c.value.toLowerCase();
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setAccentColor(c.value)}
                      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-slate-900 dark:border-white shadow-sm ring-2 ring-offset-2 ring-[#FF7916]'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: c.value }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
                {/* Custom Hex input */}
                <div className="flex items-center gap-2 ml-1 p-1 px-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                    title="Choose custom color"
                  />
                  <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 uppercase">
                    {accentColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Default Template Choice */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-[#FF7916]" />
                Default Invoice Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {TEMPLATES.map((t) => {
                  const isSelected = defaultTemplate === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setDefaultTemplate(t.id)}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${
                        isSelected
                          ? 'border-[#FF7916] bg-orange-50/40 dark:bg-orange-950/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">{t.icon}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-[#FF7916]" />}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Data Management */}
        {activeTab === 'data' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Storage & Workspace Stats</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your stored records and sample data.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {invoices.length}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Invoices</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {clients.length}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Saved Clients</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#FF7916] flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {products.length}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Catalog Items</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Workspace Actions
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setConfirmClearOpen(true)}
                >
                  Clear Workspace Data
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => setConfirmResetOpen(true)}
                >
                  Reload Sample Data (Invoices & Clients)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" size="lg" icon={<CheckCircle className="w-4 h-4" />}>
            Save Settings
          </Button>
        </div>
      </form>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleClearAllData}
        title="Clear Workspace Data?"
        message="This will delete all sample invoices and clients from your storage so you can start with a clean slate."
        confirmLabel="Clear Data"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleRestoreSampleData}
        title="Restore Realistic Sample Data?"
        message="This will populate your app with sample invoices, clients, and default business settings."
        confirmLabel="Restore Samples"
        variant="primary"
      />
    </div>
  );
};
