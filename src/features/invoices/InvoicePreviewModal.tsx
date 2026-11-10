import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Stamp,
  Check,
  ChevronDown,
  Loader2,
  Send,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { Invoice, InvoiceTemplate } from '../../types';
import { InvoicePreview } from './InvoicePreview';
import { InvoicePDF } from './InvoicePDF';
import { pdf } from '@react-pdf/renderer';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useUiStore } from '../../store/uiStore';

interface InvoicePreviewModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onTemplateChange?: (template: InvoiceTemplate) => void;
  onSaveAndSend?: () => void;
}

const PAPER_WIDTH = 794; // Standard A4 width at 96 DPI
const PAPER_DEFAULT_HEIGHT = 1123;

const TEMPLATES: { id: InvoiceTemplate; label: string; icon: string }[] = [
  { id: 'minimal', label: 'Minimal', icon: '✨' },
  { id: 'classic', label: 'Classic', icon: '🏛️' },
  { id: 'modern', label: 'Modern', icon: '🎨' },
];

const WATERMARK_OPTIONS = [
  { id: 'auto', label: 'Auto (Status)' },
  { id: 'draft', label: 'DRAFT' },
  { id: 'paid', label: 'PAID' },
  { id: 'void', label: 'VOID' },
  { id: 'sample', label: 'SAMPLE' },
  { id: 'none', label: 'None' },
];

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onTemplateChange,
  onSaveAndSend,
}) => {
  const toast = useToast();
  const { isTemplateAllowed, getRequiredPlanForTemplate } = useSubscriptionStore();
  const { openModal } = useUiStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const paperContentRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit');
  const [paperHeight, setPaperHeight] = useState<number>(PAPER_DEFAULT_HEIGHT);

  const [watermarkOption, setWatermarkOption] = useState<string>('auto');
  const [showWatermarkMenu, setShowWatermarkMenu] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Measure container width
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // Measure paper height
  useEffect(() => {
    if (!isOpen || !paperContentRef.current) return;
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
  }, [isOpen, invoice]);

  // Auto-fit scale
  const autoFitScale = useMemo(() => {
    if (!containerWidth) return 0.85;
    const availableWidth = containerWidth - 48;
    const calculated = availableWidth / PAPER_WIDTH;
    return Math.max(0.4, Math.min(1.0, calculated));
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

  const handlePrint = () => {
    window.print();
  };

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

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex flex-col p-3 sm:p-5 print:p-0 print:bg-transparent overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* 1. Modal Top Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 mb-3 shadow-xl flex flex-wrap items-center justify-between gap-3 max-w-6xl w-full mx-auto print:hidden">
        {/* Left: Document Info */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Editor
          </Button>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              Invoice Preview
            </span>
            <span className="font-mono text-xs font-bold text-[#FF7916] bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-900/60">
              {invoice.number}
            </span>
          </div>
        </div>

        {/* Center / Right: Template switcher, Watermark & Actions */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Template Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
            {TEMPLATES.map((tpl) => {
              const active = (invoice.template || 'minimal') === tpl.id;
              const isAllowed = isTemplateAllowed(tpl.id);
              const requiredPlan = getRequiredPlanForTemplate(tpl.id);
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    if (!isAllowed) {
                      openModal('upgrade', {
                        targetPlan: requiredPlan,
                        trigger: `The "${tpl.label}" template is available on the ${
                          requiredPlan === 'starter' ? 'Starter' : 'Business'
                        } plan.`,
                      });
                      return;
                    }
                    if (onTemplateChange) {
                      onTemplateChange(tpl.id);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-[#FF7916] shadow-xs'
                      : !isAllowed
                      ? 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={!isAllowed ? `Requires ${requiredPlan === 'business' ? 'Business' : 'Starter'} Plan` : tpl.label}
                >
                  <span>{tpl.icon}</span>
                  <span>{tpl.label}</span>
                  {!isAllowed && (
                    <span className={`inline-flex items-center text-[9px] font-bold px-1 py-0.5 rounded ${
                      requiredPlan === 'business'
                        ? 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800'
                        : 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800'
                    }`}>
                      <Lock className="w-2.5 h-2.5 mr-0.5" />
                      {requiredPlan === 'business' ? 'Biz' : 'Starter'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Watermark Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWatermarkMenu(!showWatermarkMenu)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
              title="Select document watermark"
            >
              <Stamp className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize text-xs">
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

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomMode !== 'fit' && (zoomMode as number) <= 40}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleToggleFit}
              className="px-2 py-0.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-[#FF7916]"
              title="Toggle Fit / 100%"
            >
              {zoomMode === 'fit' ? `Fit (${Math.round(autoFitScale * 100)}%)` : `${zoomMode}%`}
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomMode !== 'fit' && (zoomMode as number) >= 150}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {zoomMode !== 'fit' && (
              <button
                type="button"
                onClick={() => setZoomMode('fit')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                title="Reset to Fit"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title="Print invoice (Cmd+P)"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Download PDF button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="p-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 disabled:opacity-50"
            title="Download PDF"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#FF7916]" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Close Preview (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Modal Body: Document Sheet Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto rounded-3xl p-4 sm:p-6 flex justify-center items-start print:p-0 print:overflow-visible print-canvas-wrapper"
      >
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

      {/* 3. Modal Bottom Action Bar */}
      <div className="mt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-2.5 shadow-xl flex items-center justify-between gap-4 max-w-6xl w-full mx-auto print:hidden">
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Standard A4 Document (210 × 297 mm)</span>
          <span>•</span>
          <span>Ready to print or issue</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl"
          >
            Continue Editing
          </Button>

          {onSaveAndSend && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onSaveAndSend();
              }}
              icon={<Send className="w-4 h-4" />}
              className="bg-[#FF7916] hover:bg-[#ea580c] text-white shadow-sm shadow-[#FF7916]/25 rounded-xl font-bold px-4"
            >
              Save & Issue Invoice
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
