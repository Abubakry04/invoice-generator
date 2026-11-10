import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer } from '../types';
import { SAMPLE_CLIENTS } from './sampleData';
import { useBusinessStore } from './businessStore';

interface CustomerState {
  customers: Customer[];

  // Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  getCustomersByBusiness: (businessId?: string) => Customer[];
  searchCustomers: (query: string, businessId?: string) => Customer[];
  resetCustomers: () => void;
  clearCustomers: () => void;
}

const INITIAL_CUSTOMERS: Customer[] = SAMPLE_CLIENTS.map((c) => ({
  ...c,
  businessId: 'biz-default-01',
  notes: 'Key enterprise account with recurring billing cycle.',
}));

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: INITIAL_CUSTOMERS,

      addCustomer: (data) => {
        const activeBizId = useBusinessStore.getState().activeBusinessId || 'biz-default-01';
        const newCustomer: Customer = {
          ...data,
          id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          businessId: data.businessId || activeBizId,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ customers: [newCustomer, ...state.customers] }));
        return newCustomer;
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },

      getCustomer: (id) => get().customers.find((c) => c.id === id),

      getCustomersByBusiness: (businessId) => {
        const targetBiz = businessId || useBusinessStore.getState().activeBusinessId;
        return get().customers.filter((c) => c.businessId === targetBiz);
      },

      searchCustomers: (query, businessId) => {
        const targetBiz = businessId || useBusinessStore.getState().activeBusinessId;
        const q = query.trim().toLowerCase();
        return get().customers.filter((c) => {
          if (c.businessId !== targetBiz) return false;
          if (!q) return true;
          return (
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q)) ||
            (c.address && c.address.toLowerCase().includes(q))
          );
        });
      },

      resetCustomers: () => set({ customers: INITIAL_CUSTOMERS }),

      clearCustomers: () => set({ customers: [] }),
    }),
    {
      name: 'egolepay-customers',
    }
  )
);

// Backward-compatible alias for existing components
export interface ClientStoreCompat {
  clients: Customer[];
  addClient: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateClient: (id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void;
  deleteClient: (id: string) => void;
  resetClients: () => void;
  clearClients: () => void;
}

export const useClientStore = (): ClientStoreCompat => {
  const customers = useCustomerStore((state) => state.customers);
  return {
    clients: customers,
    addClient: useCustomerStore.getState().addCustomer,
    updateClient: useCustomerStore.getState().updateCustomer,
    deleteClient: useCustomerStore.getState().deleteCustomer,
    resetClients: useCustomerStore.getState().resetCustomers,
    clearClients: useCustomerStore.getState().clearCustomers,
  };
};
