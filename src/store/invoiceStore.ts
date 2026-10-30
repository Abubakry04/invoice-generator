import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Invoice, InvoiceStatus } from '../types';
import { SAMPLE_INVOICES } from './sampleData';
import { generateInvoiceNumber } from '../lib/generateInvoiceNumber';
import { getTodayDateString, getDefaultDueDate } from '../lib/dates';

interface InvoiceState {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string, prefix?: string) => Invoice | null;
  updateStatus: (id: string, status: InvoiceStatus) => void;
  getInvoice: (id: string) => Invoice | undefined;
  resetInvoices: () => void;
  clearInvoices: () => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoices: SAMPLE_INVOICES,

      addInvoice: (invoiceData) => {
        const newInvoice: Invoice = {
          ...invoiceData,
          id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        };
        set((state) => ({ invoices: [newInvoice, ...state.invoices] }));
        return newInvoice;
      },

      updateInvoice: (id, updates) =>
        set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
        })),

      deleteInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        })),

      duplicateInvoice: (id, prefix = 'INV-') => {
        const source = get().invoices.find((inv) => inv.id === id);
        if (!source) return null;

        const allNumbers = get().invoices.map((inv) => inv.number);
        const nextNumber = generateInvoiceNumber(allNumbers, prefix);

        const duplicated: Invoice = {
          ...source,
          id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          number: nextNumber,
          issueDate: getTodayDateString(),
          dueDate: getDefaultDueDate(14),
          status: 'draft',
          items: source.items.map((item) => ({
            ...item,
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          })),
        };

        set((state) => ({ invoices: [duplicated, ...state.invoices] }));
        return duplicated;
      },

      updateStatus: (id, status) =>
        set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv)),
        })),

      getInvoice: (id) => get().invoices.find((inv) => inv.id === id),

      resetInvoices: () => set({ invoices: SAMPLE_INVOICES }),

      clearInvoices: () => set({ invoices: [] }),
    }),
    {
      name: 'Egolepay-invoices',
    }
  )
);
