import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import { InvoicePDF } from './InvoicePDF';
import { Invoice } from '../../types';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

interface InvoicePDFDownloadButtonProps {
  invoice: Invoice;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export const InvoicePDFDownloadButton: React.FC<InvoicePDFDownloadButtonProps> = ({
  invoice,
  className = '',
  size = 'md',
  variant = 'primary',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const toast = useToast();

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const doc = <InvoicePDF invoice={invoice} accentColor={invoice.accentColor} template={invoice.template} />;
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

      toast.success(`Downloaded ${invoice.number}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
      className={className}
      icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
    >
      {isGenerating ? 'Generating PDF...' : 'Download PDF'}
    </Button>
  );
};
