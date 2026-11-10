import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Invoice, InvoiceStatus, LineItem, InvoiceTotals, PaymentRecord } from '../types';
import { SAMPLE_INVOICES } from './sampleData';
import { generateInvoiceNumber } from '../lib/generateInvoiceNumber';
import { getTodayDateString, getDefaultDueDate } from '../lib/dates';
import { calculateTotals } from '../lib/calculateTotals';
import { useBusinessStore } from './businessStore';
import { useSubscriptionStore } from './subscriptionStore';

interface InvoiceFilterOptions {
  status?: InvoiceStatus | 'all';
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  businessId?: string;
}

interface InvoiceState {
  invoices: Invoice[];

  // Core CRUD
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string, prefix?: string) => Invoice | null;
  getInvoice: (id: string) => Invoice | undefined;
  getInvoicesByBusiness: (businessId?: string) => Invoice[];

  // Status & Payment Tracking
  updateStatus: (id: string, status: InvoiceStatus, paidAmount?: number) => void;
  recordPayment: (id: string, amount: number) => void;
  addPaymentRecord: (
    invoiceId: string,
    payment: Omit<PaymentRecord, 'id' | 'invoiceId' | 'createdAt' | 'receiptNumber'>
  ) => PaymentRecord | null;
  deletePaymentRecord: (invoiceId: string, paymentId: string) => void;

  // Search & Filtering
  filterInvoices: (options: InvoiceFilterOptions) => Invoice[];

  // Calculation helpers
  calculateInvoiceTotals: (items: LineItem[], discount: number, taxRate: number) => InvoiceTotals;
  getNextInvoiceNumber: (prefix?: string) => string;

  // Reset & Maintenance
  resetInvoices: () => void;
  clearInvoices: () => void;
}

const INITIAL_INVOICES: Invoice[] = SAMPLE_INVOICES.map((inv) => {
  const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);
  const isPaid = inv.status === 'paid';
  return {
    ...inv,
    businessId: 'biz-default-01',
    paidAmount: isPaid ? totals.total : 0,
    outstandingAmount: isPaid ? 0 : totals.total,
  };
});

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoices: INITIAL_INVOICES,

      calculateInvoiceTotals: (items, discount, taxRate) => {
        return calculateTotals(items, discount, taxRate);
      },

      getNextInvoiceNumber: (prefix) => {
        const activePrefix =
          prefix || useBusinessStore.getState().getActiveBusiness().invoicePrefix || 'INV-';
        const allNumbers = get().invoices.map((inv) => inv.number);
        return generateInvoiceNumber(allNumbers, activePrefix);
      },

      addInvoice: (invoiceData) => {
        const activeBiz = useBusinessStore.getState().getActiveBusiness();
        const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const publicPaymentToken = `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';

        const totals = calculateTotals(
          invoiceData.items || [],
          invoiceData.discount || 0,
          invoiceData.taxRate || 0
        );

        const isPaid = invoiceData.status === 'paid';
        const paidAmount = invoiceData.paidAmount ?? (isPaid ? totals.total : 0);
        const outstandingAmount = Math.max(0, totals.total - paidAmount);

        const newInvoice: Invoice = {
          ...invoiceData,
          id,
          businessId: invoiceData.businessId || activeBiz.id,
          publicPaymentToken,
          paymentLink: `${origin}/pay/${id}`,
          paidAmount,
          outstandingAmount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ invoices: [newInvoice, ...state.invoices] }));

        // Track usage limit in subscription store
        useSubscriptionStore.getState().recordInvoiceCreation();

        return newInvoice;
      },

      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => {
            if (inv.id !== id) return inv;

            const merged = { ...inv, ...updates, updatedAt: new Date().toISOString() };
            const totals = calculateTotals(merged.items, merged.discount, merged.taxRate);

            if (merged.status === 'paid') {
              merged.paidAmount = totals.total;
              merged.outstandingAmount = 0;
            } else if (merged.status === 'draft' || merged.status === 'cancelled') {
              merged.paidAmount = updates.paidAmount ?? 0;
              merged.outstandingAmount = Math.max(0, totals.total - (merged.paidAmount || 0));
            } else {
              const paid = updates.paidAmount ?? merged.paidAmount ?? 0;
              merged.paidAmount = paid;
              merged.outstandingAmount = Math.max(0, totals.total - paid);
            }

            return merged;
          }),
        }));
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        }));
      },

      duplicateInvoice: (id, prefix) => {
        const source = get().invoices.find((inv) => inv.id === id);
        if (!source) return null;

        const activeBiz = useBusinessStore.getState().getActiveBusiness();
        const nextNumber = get().getNextInvoiceNumber(prefix || activeBiz.invoicePrefix);
        const newId = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const totals = calculateTotals(source.items, source.discount, source.taxRate);

        const duplicated: Invoice = {
          ...source,
          id: newId,
          number: nextNumber,
          issueDate: getTodayDateString(),
          dueDate: getDefaultDueDate(activeBiz.defaultPaymentTermsDays || 14),
          status: 'draft',
          paidAmount: 0,
          outstandingAmount: totals.total,
          publicPaymentToken: `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          paymentLink: `${origin}/pay/${newId}`,
          items: source.items.map((item) => ({
            ...item,
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ invoices: [duplicated, ...state.invoices] }));
        return duplicated;
      },

      getInvoice: (id) => get().invoices.find((inv) => inv.id === id),

      getInvoicesByBusiness: (businessId) => {
        const targetBiz = businessId || useBusinessStore.getState().activeBusinessId;
        return get().invoices.filter((inv) => inv.businessId === targetBiz);
      },

      updateStatus: (id, status, paidAmount) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => {
            if (inv.id !== id) return inv;
            const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);

            let newPaid = inv.paidAmount || 0;
            if (status === 'paid') {
              newPaid = totals.total;
            } else if (status === 'partially_paid' && paidAmount !== undefined) {
              newPaid = paidAmount;
            } else if (status === 'draft') {
              newPaid = 0;
            }

            return {
              ...inv,
              status,
              paidAmount: newPaid,
              outstandingAmount: Math.max(0, totals.total - newPaid),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      recordPayment: (id, amount) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => {
            if (inv.id !== id) return inv;
            const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);
            const currentPaid = inv.paidAmount || 0;
            const updatedPaid = Math.min(totals.total, currentPaid + amount);
            const outstanding = Math.max(0, totals.total - updatedPaid);

            const newStatus: InvoiceStatus =
              outstanding === 0
                ? 'paid'
                : updatedPaid > 0
                ? 'partially_paid'
                : inv.status;

            const newRecord: PaymentRecord = {
              id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              invoiceId: id,
              amount,
              paymentDate: getTodayDateString(),
              paymentMethod: 'bank_transfer',
              receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
              notes: 'Recorded payment',
              createdAt: new Date().toISOString(),
            };

            return {
              ...inv,
              paidAmount: updatedPaid,
              outstandingAmount: outstanding,
              status: newStatus,
              payments: [...(inv.payments || []), newRecord],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addPaymentRecord: (invoiceId, paymentData) => {
        let createdRecord: PaymentRecord | null = null;
        set((state) => ({
          invoices: state.invoices.map((inv) => {
            if (inv.id !== invoiceId) return inv;

            const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);
            const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
            createdRecord = {
              ...paymentData,
              id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              invoiceId,
              receiptNumber,
              createdAt: new Date().toISOString(),
            };

            const existingPayments = inv.payments || [];
            const updatedPayments = [...existingPayments, createdRecord];
            const updatedPaid = updatedPayments.reduce(
              (acc, p) => acc + (Number(p.amount) || 0),
              0
            );
            const outstanding = Math.max(0, totals.total - updatedPaid);

            const newStatus: InvoiceStatus =
              outstanding <= 0.001
                ? 'paid'
                : updatedPaid > 0
                ? 'partially_paid'
                : inv.status;

            return {
              ...inv,
              paidAmount: updatedPaid,
              outstandingAmount: outstanding,
              status: newStatus,
              payments: updatedPayments,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
        return createdRecord;
      },

      deletePaymentRecord: (invoiceId, paymentId) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => {
            if (inv.id !== invoiceId) return inv;

            const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);
            const updatedPayments = (inv.payments || []).filter((p) => p.id !== paymentId);
            const updatedPaid = updatedPayments.reduce(
              (acc, p) => acc + (Number(p.amount) || 0),
              0
            );
            const outstanding = Math.max(0, totals.total - updatedPaid);

            let newStatus: InvoiceStatus = inv.status;
            if (updatedPaid === 0) {
              newStatus = 'sent';
            } else if (outstanding <= 0.001) {
              newStatus = 'paid';
            } else {
              newStatus = 'partially_paid';
            }

            return {
              ...inv,
              paidAmount: updatedPaid,
              outstandingAmount: outstanding,
              status: newStatus,
              payments: updatedPayments,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      filterInvoices: (options) => {
        const targetBiz =
          options.businessId || useBusinessStore.getState().activeBusinessId;
        const q = (options.searchQuery || '').trim().toLowerCase();

        return get().invoices.filter((inv) => {
          if (targetBiz && inv.businessId && inv.businessId !== targetBiz) {
            return false;
          }

          if (options.status && options.status !== 'all' && inv.status !== options.status) {
            return false;
          }

          if (options.startDate && inv.issueDate < options.startDate) {
            return false;
          }

          if (options.endDate && inv.issueDate > options.endDate) {
            return false;
          }

          if (q) {
            const matchNumber = inv.number.toLowerCase().includes(q);
            const matchClient =
              inv.client.name.toLowerCase().includes(q) ||
              inv.client.email.toLowerCase().includes(q);
            const matchItem = inv.items.some((item) =>
              item.description.toLowerCase().includes(q)
            );
            if (!matchNumber && !matchClient && !matchItem) return false;
          }

          return true;
        });
      },

      resetInvoices: () => set({ invoices: INITIAL_INVOICES }),

      clearInvoices: () => set({ invoices: [] }),
    }),
    {
      name: 'egolepay-invoices',
    }
  )
);
