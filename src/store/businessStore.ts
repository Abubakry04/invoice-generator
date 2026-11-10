import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BusinessProfile } from '../types';
import { SAMPLE_LOGO_DATA_URI } from './sampleData';

interface BusinessState {
  businesses: BusinessProfile[];
  activeBusinessId: string;

  // Selectors & Actions
  getActiveBusiness: () => BusinessProfile;
  updateActiveBusiness: (updates: Partial<BusinessProfile>) => void;
  setActiveBusiness: (businessId: string) => void;
  addBusiness: (business: Omit<BusinessProfile, 'id' | 'createdAt'>) => BusinessProfile;
  resetToDefault: () => void;
}

const DEFAULT_BUSINESS: BusinessProfile = {
  id: 'biz-default-01',
  name: 'EgolePay LTD',
  email: 'hello@egolepay.com',
  phone: '+234 913 933 0394',
  address: '41, Industrial Avenue, Sabo, Yaba, Lagos, Nigeria',
  website: 'https://egolepay.com',
  taxId: 'TIN-98765432-0001',
  bankDetails:
    'Guaranty Trust Bank (GTBank)\nAccount Name: EgolePay LTD\nAccount No: 0123456789\nSort Code: 058152062',
  logo: SAMPLE_LOGO_DATA_URI,
  defaultCurrency: 'NGN',
  defaultTaxRate: 7.5,
  defaultPaymentTermsDays: 14,
  invoicePrefix: 'INV-',
  accentColor: '#FF7916',
  defaultTemplate: 'minimal',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const SECONDARY_BUSINESS: BusinessProfile = {
  id: 'biz-demo-02',
  name: 'Studio Apex Creative Ltd',
  email: 'billing@studioapex.design',
  phone: '+234 802 334 5566',
  address: '14 Admiralty Way, Lekki Phase 1, Lagos',
  website: 'https://studioapex.design',
  taxId: 'TIN-11223344-0002',
  bankDetails:
    'Access Bank PLC\nAccount Name: Studio Apex Creative Ltd\nAccount No: 0987654321',
  defaultCurrency: 'USD',
  defaultTaxRate: 5.0,
  defaultPaymentTermsDays: 30,
  invoicePrefix: 'APX-',
  accentColor: '#2563eb',
  defaultTemplate: 'minimal',
  createdAt: '2026-02-01T00:00:00.000Z',
};

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      businesses: [DEFAULT_BUSINESS, SECONDARY_BUSINESS],
      activeBusinessId: DEFAULT_BUSINESS.id,

      getActiveBusiness: () => {
        const { businesses, activeBusinessId } = get();
        return (
          businesses.find((b) => b.id === activeBusinessId) ||
          businesses[0] ||
          DEFAULT_BUSINESS
        );
      },

      updateActiveBusiness: (updates) => {
        set((state) => ({
          businesses: state.businesses.map((b) =>
            b.id === state.activeBusinessId ? { ...b, ...updates } : b
          ),
        }));
      },

      setActiveBusiness: (businessId: string) => {
        set({ activeBusinessId: businessId });
      },

      addBusiness: (businessData) => {
        const newBiz: BusinessProfile = {
          ...businessData,
          id: `biz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          businesses: [...state.businesses, newBiz],
          activeBusinessId: newBiz.id,
        }));
        return newBiz;
      },

      resetToDefault: () => {
        set({
          businesses: [DEFAULT_BUSINESS, SECONDARY_BUSINESS],
          activeBusinessId: DEFAULT_BUSINESS.id,
        });
      },
    }),
    {
      name: 'egolepay-business',
    }
  )
);

