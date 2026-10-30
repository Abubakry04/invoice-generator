import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { InvoicePreview } from './InvoicePreview';
import { InvoicePDFDownloadButton } from './InvoicePDFDownloadButton';
import { Invoice } from '../../types';
import { Button } from '../../components/ui/Button';
import { Edit2, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InvoiceViewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ invoice, isOpen, onClose }) => {
  const navigate = useNavigate();
  if (!invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice ${invoice.number}`}
      description="Preview and download your invoice."
      maxWidth="4xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => {
                onClose();
                navigate(`/invoices/${invoice.id}/edit`);
              }}
            >
              Edit Invoice
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </div>
          <InvoicePDFDownloadButton invoice={invoice} size="sm" />
        </div>

        <div className="bg-slate-100/90 dark:bg-slate-950/80 p-4 sm:p-6 rounded-2xl max-h-[75vh] overflow-auto flex justify-center items-start">
          <div className="shrink-0">
            <InvoicePreview invoice={invoice} />
          </div>
        </div>
      </div>
    </Modal>
  );
};
