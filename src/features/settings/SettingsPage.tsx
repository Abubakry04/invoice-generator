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
  Coins,
  CheckCircle,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useClientStore } from '../../store/clientStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SUPPORTED_CURRENCIES } from '../../lib/formatCurrency';
import { InvoiceTemplate } from '../../types';

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

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, updateBusiness, resetSettings } = useSettingsStore();
  const { resetClients, clearClients } = useClientStore();
  const { resetInvoices, clearInvoices } = useInvoiceStore();
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
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
    toast.success('Sample data cleared. You have a fresh workspace.');
  };

  const handleRestoreSampleData = () => {
    resetSettings();
    resetClients();
    resetInvoices();

    // Reload form values
    setBusinessName('Egolepay LTD');
    setAddress('41, Industrial Avenue,Sabo, Yaba, Lagos, Nigeria');
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

    toast.success('Sample data restored with 3 realistic Nigerian invoices and clients');
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your business profile, default currency, tax rates, and invoice appearance.
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-8">
        {/* Business Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Business Profile</h2>
          </div>

          {/* Logo Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Company Logo
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-36 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden relative group p-2">
                {logo ? (
                  <img src={logo} alt="Business Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400">No logo</span>
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
                <p className="text-[11px] text-slate-500">
                  Recommended: High-resolution PNG or SVG with transparent background (under 2MB).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Acme Studio Ltd"
              required
            />
            <Input
              label="Business Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="billing@yourdomain.com"
              required
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
            />
            <div className="md:col-span-2">
              <Textarea
                label="Registered Business Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, City, State, Country"
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Bank & Payment Details (Appears on Invoice Footer)"
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="Bank Name, Account Name, Account Number, IBAN / Sort Code..."
                rows={3}
                helperText="Provide instructions for wire transfers, direct deposits, or online payment links."
              />
            </div>
          </div>
        </div>

        {/* Invoice Defaults Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Invoice Defaults</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {/* Accent Color Picker */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Invoice Brand Accent Color
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This accent color styles headings, table headers, and badges across previews and PDF downloads.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {ACCENT_COLORS.map((c) => {
                const isSelected = accentColor.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setAccentColor(c.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-slate-900 dark:border-white shadow-sm ring-2 ring-offset-2 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
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
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  title="Choose custom color"
                />
                <span className="text-xs font-mono text-slate-500 uppercase">{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Default Template Choice */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Default Invoice Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { id: 'modern', name: 'Modern', desc: 'Sleek header banner, bold totals & rounded table' },
                  { id: 'classic', name: 'Classic', desc: 'Timeless professional layout with clean lines' },
                  { id: 'minimal', name: 'Minimal', desc: 'Understated typographic elegance and open spacing' },
                ] as const
              ).map((t) => {
                const isSelected = defaultTemplate === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setDefaultTemplate(t.id)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Button type="submit" size="lg" icon={<CheckCircle className="w-4 h-4" />}>
            Save All Settings
          </Button>
        </div>
      </form>

      {/* Data Management Card: Clear & Reset Sample Data */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Coins className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Data & Storage Management</h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          All invoices, clients, and settings are saved securely in your browser's LocalStorage. You can clear
          data or reload the realistic sample business dataset anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setConfirmClearOpen(true)}
          >
            Clear Sample Data
          </Button>

          <Button
            type="button"
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => setConfirmResetOpen(true)}
          >
            Restore Sample Data (3 Invoices & Clients)
          </Button>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleClearAllData}
        title="Clear Sample Data?"
        message="This will delete all sample invoices and clients from your browser storage so you can start with a clean slate."
        confirmLabel="Clear Data"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleRestoreSampleData}
        title="Restore Realistic Sample Data?"
        message="This will populate your app with 3 Nigerian business sample invoices (INV-0001 to INV-0003), 3 clients, and sample business settings."
        confirmLabel="Restore Samples"
        variant="primary"
      />
    </div>
  );
};
