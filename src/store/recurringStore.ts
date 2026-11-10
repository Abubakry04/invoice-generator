import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RecurringSchedule, RecurringFrequency, Invoice } from '../types';
import { useInvoiceStore } from './invoiceStore';
import { useBusinessStore } from './businessStore';
import { getTodayDateString, getDefaultDueDate } from '../lib/dates';
import { calculateTotals } from '../lib/calculateTotals';

export function computeNextRunDate(fromDateStr: string, frequency: RecurringFrequency): string {
  const d = new Date(fromDateStr);
  if (isNaN(d.getTime())) {
    return getTodayDateString();
  }

  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'biweekly') {
    d.setDate(d.getDate() + 14);
  } else if (frequency === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else if (frequency === 'quarterly') {
    d.setMonth(d.getMonth() + 3);
  } else if (frequency === 'annually') {
    d.setFullYear(d.getFullYear() + 1);
  }
  return d.toISOString().slice(0, 10);
}

interface RecurringState {
  schedules: RecurringSchedule[];

  // Actions
  addSchedule: (
    data: Omit<
      RecurringSchedule,
      'id' | 'createdAt' | 'updatedAt' | 'totalGeneratedCount' | 'lastGeneratedAt'
    >
  ) => RecurringSchedule;
  updateSchedule: (id: string, updates: Partial<RecurringSchedule>) => void;
  deleteSchedule: (id: string) => void;
  toggleScheduleStatus: (id: string) => void;
  generateCycle: (scheduleId: string) => Invoice | null;
  checkAndRunDueSchedules: () => { generatedCount: number; invoices: Invoice[] };
}

const INITIAL_SCHEDULES: RecurringSchedule[] = [
  {
    id: 'rec-sample-01',
    businessId: 'biz-default-01',
    invoiceId: 'inv-0001',
    clientName: 'PayWave Fintech Ltd',
    frequency: 'monthly',
    startDate: '2026-09-01',
    nextRunDate: '2026-11-15',
    status: 'active',
    totalGeneratedCount: 2,
    autoSend: true,
    lastGeneratedAt: '2026-10-15T09:00:00.000Z',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-15T09:00:00.000Z',
  },
];

export const useRecurringStore = create<RecurringState>()(
  persist(
    (set, get) => ({
      schedules: INITIAL_SCHEDULES,

      addSchedule: (data) => {
        const id = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const activeBiz = useBusinessStore.getState().getActiveBusiness();

        const newSchedule: RecurringSchedule = {
          ...data,
          id,
          businessId: data.businessId || activeBiz.id,
          totalGeneratedCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        // Also mark invoice as recurring in invoiceStore
        useInvoiceStore.getState().updateInvoice(data.invoiceId, {
          isRecurring: true,
          recurringScheduleId: id,
        });

        set((state) => ({ schedules: [newSchedule, ...state.schedules] }));
        return newSchedule;
      },

      updateSchedule: (id, updates) => {
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        }));
      },

      deleteSchedule: (id) => {
        const schedule = get().schedules.find((s) => s.id === id);
        if (schedule) {
          useInvoiceStore.getState().updateInvoice(schedule.invoiceId, {
            isRecurring: false,
            recurringScheduleId: undefined,
          });
        }
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
        }));
      },

      toggleScheduleStatus: (id) => {
        set((state) => ({
          schedules: state.schedules.map((s) => {
            if (s.id !== id) return s;
            const newStatus = s.status === 'active' ? 'paused' : 'active';
            return { ...s, status: newStatus, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      generateCycle: (scheduleId) => {
        const schedule = get().schedules.find((s) => s.id === scheduleId);
        if (!schedule) return null;

        const invoiceStore = useInvoiceStore.getState();
        const baseInvoice = invoiceStore.getInvoice(schedule.invoiceId);
        if (!baseInvoice) return null;

        const activeBiz = useBusinessStore.getState().getActiveBusiness();
        const nextNum = invoiceStore.getNextInvoiceNumber(activeBiz.invoicePrefix || 'INV-');
        const runDate = schedule.nextRunDate || getTodayDateString();
        const dueDate = getDefaultDueDate(activeBiz.defaultPaymentTermsDays || 14);

        const totals = calculateTotals(baseInvoice.items, baseInvoice.discount, baseInvoice.taxRate);

        // Create new invoice for this cycle
        const createdInvoice = invoiceStore.addInvoice({
          number: nextNum,
          issueDate: runDate,
          dueDate,
          currency: baseInvoice.currency,
          business: { ...baseInvoice.business },
          client: { ...baseInvoice.client },
          items: baseInvoice.items.map((i) => ({
            ...i,
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          })),
          discount: baseInvoice.discount,
          taxRate: baseInvoice.taxRate,
          notes: baseInvoice.notes
            ? `${baseInvoice.notes}\n[Recurring retainer cycle generated on ${runDate}]`
            : `[Recurring retainer cycle generated on ${runDate}]`,
          status: schedule.autoSend ? 'sent' : 'draft',
          template: baseInvoice.template,
          accentColor: baseInvoice.accentColor,
          isRecurring: false, // Child instances are normal invoices
          paidAmount: 0,
          outstandingAmount: totals.total,
        });

        // Compute next run date
        const nextDate = computeNextRunDate(runDate, schedule.frequency);
        const isCompleted = schedule.endDate ? nextDate > schedule.endDate : false;

        set((state) => ({
          schedules: state.schedules.map((s) => {
            if (s.id !== scheduleId) return s;
            return {
              ...s,
              nextRunDate: nextDate,
              status: isCompleted ? 'completed' : s.status,
              totalGeneratedCount: s.totalGeneratedCount + 1,
              lastGeneratedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        return createdInvoice;
      },

      checkAndRunDueSchedules: () => {
        const today = getTodayDateString();
        const activeSchedules = get().schedules.filter(
          (s) => s.status === 'active' && s.nextRunDate <= today
        );

        const generated: Invoice[] = [];
        for (const s of activeSchedules) {
          const inv = get().generateCycle(s.id);
          if (inv) generated.push(inv);
        }

        return { generatedCount: generated.length, invoices: generated };
      },
    }),
    {
      name: 'egolepay-recurring-schedules',
    }
  )
);

