import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Loader2,
  X,
  Stamp,
} from 'lucide-react';
import { Invoice, InvoiceTemplate } from '../../types';
import { InvoicePreview } from './InvoicePreview';
import { InvoicePDF } from './InvoicePDF';
import { pdf } from '@react-pdf/renderer';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency } from '../../lib/formatCurrency';
import { calculateTotals } from '../../lib/calculateTotals';

interface InvoicePreviewPaneProps {
  invoice: Invoice;
  onTemplateChange?: (template: InvoiceTemplate) => void;
  className?: string;
}

const PAPER_WIDTH = 794; // Standard A4 width at 96 DPI
const PAPER_DEFAULT_HEIGHT = 1123; // Standard A4 height at 96 DPI

const TEMPLATES: { id: InvoiceTemplate; label: string; icon: string }[] = [
  { id: 'modern', label: 'Modern', icon: '🎨' },
  { id: 'classic', label: 'Classic', icon: '🏛️' },
  { id: 'minimal', label: 'Minimal', icon: '✨' },
];

const WATERMARK_OPTIONS = [
  { id: 'auto', label: 'Auto (Status)' },
  { id: 'draft', label: 'DRAFT' },
  { id: 'paid', label: 'PAID' },
  { id: 'void', label: 'VOID' },
  { id: 'sample', label: 'SAMPLE' },
  { id: 'none', label: 'None' },
];

export const InvoicePreviewPane: React.FC<InvoicePreviewPaneProps> = ({
  invoice,
  onTemplateChange,
  className = '',
}) => {
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const paperContentRef = useRef<HTMLDivElement>(null);

  // Auto-fit & Zoom state
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit');
  const [paperHeight, setPaperHeight] = useState<number>(PAPER_DEFAULT_HEIGHT);

  // Watermark state
  const [watermarkOption, setWatermarkOption] = useState<string>('auto');
  const [showWatermarkMenu, setShowWatermarkMenu] = useState<boolean>(false);

  // Fullscreen modal state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(100);

  // Quick actions state
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Handle Escape key and body scroll lock for fullscreen modal
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Measure container width for dynamic auto-fit
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Measure inner paper content height for accurate bounding box
  useEffect(() => {
    if (!paperContentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target) {
          const height = (entry.target as HTMLElement).offsetHeight || PAPER_DEFAULT_HEIGHT;
          setPaperHeight(Math.max(PAPER_DEFAULT_HEIGHT, height));
        }
      }
    });
    observer.observe(paperContentRef.current);
    return () => observer.disconnect();
  }, [invoice]);

  // Compute scale based on container width or manual zoom
  const autoFitScale = useMemo(() => {
    if (!containerWidth) return 0.55;
    const availableWidth = containerWidth - 36;
    const calculated = availableWidth / PAPER_WIDTH;
    return Math.max(0.35, Math.min(1.0, calculated));
  }, [containerWidth]);

  const currentScale = zoomMode === 'fit' ? autoFitScale : zoomMode / 100;

  // Resolve effective watermark string
  const effectiveWatermark = useMemo(() => {
    if (watermarkOption === 'none') return '';
    if (watermarkOption === 'auto') {
      if (invoice.status === 'draft') return 'DRAFT';
      if (invoice.status === 'paid') return 'PAID';
      if (invoice.status === 'overdue') return 'OVERDUE';
      return '';
    }
    return watermarkOption.toUpperCase();
  }, [watermarkOption, invoice.status]);

  // Handle Zoom In / Out
  const handleZoomIn = () => {
    if (zoomMode === 'fit') {
      const next = Math.min(150, Math.round((autoFitScale + 0.1) * 10) * 10);
      setZoomMode(next);
    } else {
      setZoomMode((prev) => Math.min(150, (prev as number) + 10));
    }
  };

  const handleZoomOut = () => {
    if (zoomMode === 'fit') {
      const next = Math.max(40, Math.round((autoFitScale - 0.1) * 10) * 10);
      setZoomMode(next);
    } else {
      setZoomMode((prev) => Math.max(40, (prev as number) - 10));
    }
  };

  const handleToggleFit = () => {
    if (zoomMode === 'fit') {
      setZoomMode(100);
    } else {
      setZoomMode('fit');
    }
  };

  // Direct print trigger
  const handlePrint = () => {
    window.print();
  };

  // PDF direct download
  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const doc = (
        <InvoicePDF
          invoice={invoice}
          accentColor={invoice.accentColor}
          template={invoice.template}
        />
      );
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.number || 'Invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${invoice.number || 'Invoice'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Copy quick invoice summary
  const handleCopySummary = async () => {
    const totals = calculateTotals(invoice.items, invoice.discount, invoice.taxRate);
    const summary = `Invoice: ${invoice.number}\nClient: ${invoice.client.name || 'N/A'}\nTotal: ${formatCurrency(totals.total, invoice.currency)}\nDue: ${invoice.dueDate}\nStatus: ${invoice.status.toUpperCase()}`;
    try {
      await navigator.clipboard.writeText(summary);
      setIsCopied(true);
      toast.success('Invoice summary copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 1. Header Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-2">
        {/* Top row: Status indicator & Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-2 pl-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Live Preview
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {invoice.number || 'INV-0001'}
            </span>
          </div>

          {/* Right action buttons */}
          <div className="flex items-center gap-1">
            {/* Copy Summary */}
            <button
              type="button"
              onClick={handleCopySummary}
              title="Copy invoice summary to clipboard"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Direct Print */}
            <button
              type="button"
              onClick={handlePrint}
              title="Print document (Cmd+P)"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {/* Quick PDF Download */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              title="Download PDF"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF7916]" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Fullscreen Expand */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              title="View full document"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Second row: Template Switcher, Watermark & Zoom controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Template pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs">
            {TEMPLATES.map((tpl) => {
              const active = (invoice.template || 'modern') === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onTemplateChange && onTemplateChange(tpl.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-[#FF7916] shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tpl.icon}</span>
                  <span>{tpl.label}</span>
                </button>
              );
            })}
          </div>

          {/* Watermark Selector & Zoom controls */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Watermark menu toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowWatermarkMenu(!showWatermarkMenu)}
                className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
                title="Select document watermark"
              >
                <Stamp className="w-3 h-3 text-slate-400" />
                <span className="capitalize text-[11px]">
                  {watermarkOption === 'auto' ? 'Stamp' : watermarkOption}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showWatermarkMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 text-xs"
                  onMouseLeave={() => setShowWatermarkMenu(false)}
                >
                  {WATERMARK_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setWatermarkOption(opt.id);
                        setShowWatermarkMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                        watermarkOption === opt.id
                          ? 'text-[#FF7916] font-bold bg-orange-50/50 dark:bg-orange-950/20'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {watermarkOption === opt.id && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Zoom Button Group */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomMode !== 'fit' && (zoomMode as number) <= 40}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={handleToggleFit}
                className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-[#FF7916] transition-colors"
                title="Click to toggle Fit / 100%"
              >
                {zoomMode === 'fit' ? `Fit (${Math.round(autoFitScale * 100)}%)` : `${zoomMode}%`}
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomMode !== 'fit' && (zoomMode as number) >= 150}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>

              {zoomMode !== 'fit' && (
                <button
                  type="button"
                  onClick={() => setZoomMode('fit')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="Reset to Fit"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scaled Paper Canvas Viewport */}
      <div
        ref={containerRef}
        className="bg-slate-100/90 dark:bg-slate-950/80 p-3 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-inner max-h-[calc(100vh-210px)] overflow-auto print-canvas-wrapper"
      >
        <div className="flex justify-center items-start min-h-full py-1">
          <div
            style={{
              width: `${Math.round(PAPER_WIDTH * currentScale)}px`,
              height: `${Math.round(paperHeight * currentScale)}px`,
              position: 'relative',
              flexShrink: 0,
              transition: 'width 0.15s ease-out, height 0.15s ease-out',
            }}
          >
            <div
              ref={paperContentRef}
              style={{
                width: `${PAPER_WIDTH}px`,
                transform: `scale(${currentScale})`,
                transformOrigin: 'top left',
              }}
              className="origin-top-left transition-transform duration-150 ease-out"
            >
              <InvoicePreview
                invoice={invoice}
                watermark={effectiveWatermark}
                id="invoice-printable-doc"
              />
            </div>
          </div>
        </div>

        {/* Canvas Bottom Quick Info */}
        <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-2 print:hidden">
          <span>A4 Document (210 × 297 mm)</span>
          <span>Page 1 of 1</span>
          <span className="capitalize">{invoice.template || 'Modern'} Layout</span>
        </div>
      </div>

      {/* 3. Fullscreen Document Modal mounted via portal */}
      {isFullscreen &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex flex-col p-4 sm:p-6 print:hidden">
            {/* Modal Header Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 mb-4 shadow-xl flex items-center justify-between gap-4 max-w-6xl w-full mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Invoice Preview
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-mono text-xs font-bold text-[#FF7916]">
                  {invoice.number}
                </span>
                <span className="text-xs text-slate-400 capitalize hidden sm:inline">
                  ({invoice.template || 'modern'} template)
                </span>
              </div>

              {/* Modal Controls */}
              <div className="flex items-center gap-2">
                {/* Template switcher in modal */}
                <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => onTemplateChange && onTemplateChange(tpl.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        (invoice.template || 'modern') === tpl.id
                          ? 'bg-white dark:bg-slate-900 text-[#FF7916] shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{tpl.icon}</span> {tpl.label}
                    </button>
                  ))}
                </div>

                {/* Modal Zoom controls */}
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFullscreenZoom((z) => Math.max(50, z - 10))}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {fullscreenZoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setFullscreenZoom((z) => Math.min(150, z + 10))}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Print in Modal */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  title="Print"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {/* Download in Modal */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="p-2 rounded-xl bg-[#FF7916] text-white hover:bg-[#ea580c] disabled:opacity-50"
                  title="Download PDF"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>

                {/* Close Modal */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Close fullscreen preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Preview Body */}
            <div className="flex-1 overflow-auto rounded-3xl p-4 flex justify-center items-start">
              <div
                style={{
                  width: `${Math.round(PAPER_WIDTH * (fullscreenZoom / 100))}px`,
                  height: `${Math.round(paperHeight * (fullscreenZoom / 100))}px`,
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: `${PAPER_WIDTH}px`,
                    transform: `scale(${fullscreenZoom / 100})`,
                    transformOrigin: 'top left',
                  }}
                  className="origin-top-left"
                >
                  <InvoicePreview
                    invoice={invoice}
                    watermark={effectiveWatermark}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
