import React from 'react';
import { Invoice } from '../../types';
import { calculateTotals } from '../../lib/calculateTotals';
import { useSettingsStore } from '../../store/settingsStore';
import { ModernPreview } from './templates/ModernPreview';
import { ClassicPreview } from './templates/ClassicPreview';
import { MinimalPreview } from './templates/MinimalPreview';

export interface InvoicePreviewProps {
  invoice: Invoice;
  className?: string;
  watermark?: string;
  id?: string;
  showShadow?: boolean;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  className = '',
  watermark,
  id = 'invoice-printable-doc',
  showShadow = true,
}) => {
  const { settings } = useSettingsStore();

  const template = invoice.template || settings.defaultTemplate || 'modern';
  const accentColor = invoice.accentColor || settings.accentColor || '#FF7916';

  // Always compute totals on the fly with the pure helper
  const totals = calculateTotals(invoice.items, invoice.discount, invoice.taxRate);

  return (
    <div
      id={id}
      className={`relative bg-white text-slate-800 w-[794px] min-h-[1123px] mx-auto ${
        showShadow ? 'shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)]' : ''
      } rounded-md border border-slate-200/90 overflow-hidden print-sheet select-text flex flex-col justify-between ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Watermark overlay */}
      {watermark && watermark !== 'none' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10 select-none">
          <div className="transform -rotate-35 border-4 border-dashed border-slate-400/20 px-14 py-4 rounded-3xl">
            <span className="text-7xl font-black uppercase tracking-[0.2em] text-slate-400/20">
              {watermark}
            </span>
          </div>
        </div>
      )}

      {/* Template Render */}
      <div className="relative z-0 flex-1 flex flex-col justify-between">
        {template === 'classic' && (
          <ClassicPreview invoice={invoice} totals={totals} accentColor={accentColor} />
        )}
        {template === 'minimal' && (
          <MinimalPreview invoice={invoice} totals={totals} accentColor={accentColor} />
        )}
        {template === 'modern' && (
          <ModernPreview invoice={invoice} totals={totals} accentColor={accentColor} />
        )}
      </div>
    </div>
  );
};
