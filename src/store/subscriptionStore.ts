import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SubscriptionPlan,
  SubscriptionPlanId,
  SubscriptionState,
  PlanFeatureKey,
  InvoiceTemplate,
} from '../types';

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    priceMonthly: 0,
    priceAnnual: 0,
    invoiceLimit: 5,
    features: [
      'Up to 5 invoices / month',
      'Standard PDF downloads',
      'Default currency (NGN)',
      'Minimal invoice template',
      'Local browser data backup',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    priceMonthly: 15,
    priceAnnual: 12,
    invoiceLimit: 50,
    features: [
      'Up to 50 invoices / month',
      'Custom branding & logo',
      'Multi-currency support (USD, EUR, GBP, etc.)',
      'Minimal & Classic invoice templates',
      'Direct customer payment portal & payment links',
      'Payment receipts & reminders',
    ],
  },
  business: {
    id: 'business',
    name: 'Business Plan',
    priceMonthly: 39,
    priceAnnual: 31,
    invoiceLimit: Infinity,
    features: [
      'Unlimited invoices / month',
      'Multi-business / multi-company management',
      'All 3 templates (Minimal, Classic & Modern)',
      'Custom domain & portal branding',
      'Team seats & role permissions',
      'Priority support & CSV/API exports',
    ],
  },
};

export const TEMPLATE_PLAN_PERMISSIONS: Record<SubscriptionPlanId, InvoiceTemplate[]> = {
  free: ['minimal'],
  starter: ['minimal', 'classic'],
  business: ['minimal', 'classic', 'modern'],
};

export const TEMPLATE_REQUIRED_PLAN: Record<
  InvoiceTemplate,
  { plan: SubscriptionPlanId; label: string }
> = {
  minimal: { plan: 'free', label: 'Free' },
  classic: { plan: 'starter', label: 'Starter' },
  modern: { plan: 'business', label: 'Business' },
};

export const PLAN_PERMISSIONS: Record<SubscriptionPlanId, Record<PlanFeatureKey, boolean>> = {
  free: {
    multi_currency: false,
    premium_templates: false,
    custom_accent: false,
    payment_portal: false,
    custom_logo: false,
    multi_business: false,
    export_data: false,
  },
  starter: {
    multi_currency: true,
    premium_templates: true,
    custom_accent: true,
    payment_portal: true,
    custom_logo: true,
    multi_business: false,
    export_data: false,
  },
  business: {
    multi_currency: true,
    premium_templates: true,
    custom_accent: true,
    payment_portal: true,
    custom_logo: true,
    multi_business: true,
    export_data: true,
  },
};

export const FEATURE_REQUIRED_PLAN: Record<PlanFeatureKey, { plan: SubscriptionPlanId; label: string }> = {
  multi_currency: { plan: 'starter', label: 'Multi-Currency Support' },
  premium_templates: { plan: 'starter', label: 'Premium Templates (Classic & Minimal)' },
  custom_accent: { plan: 'starter', label: 'Custom Brand Accent Colors' },
  payment_portal: { plan: 'starter', label: 'Client Payment Links & Online Portal' },
  custom_logo: { plan: 'starter', label: 'Custom Business Logo & Watermark-Free Export' },
  multi_business: { plan: 'business', label: 'Multi-Business Management' },
  export_data: { plan: 'business', label: 'Financial & Accounting Export' },
};

interface SubscriptionStoreState {
  subscription: SubscriptionState;

  // Actions & Selectors
  getCurrentPlan: () => SubscriptionPlan;
  getRemainingInvoices: () => number;
  canCreateInvoice: () => boolean;
  hasFeature: (feature: PlanFeatureKey) => boolean;
  getRequiredPlan: (feature: PlanFeatureKey) => SubscriptionPlanId;
  isTemplateAllowed: (template: InvoiceTemplate) => boolean;
  getRequiredPlanForTemplate: (template: InvoiceTemplate) => SubscriptionPlanId;
  recordInvoiceCreation: () => void;
  upgradePlan: (planId: SubscriptionPlanId) => void;
  resetMonthlyUsage: () => void;
}

export const useSubscriptionStore = create<SubscriptionStoreState>()(
  persist(
    (set, get) => ({
      subscription: {
        planId: 'free',
        status: 'active',
        currentPeriodStart: new Date(Date.now() - 10 * 86400000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 20 * 86400000).toISOString(),
        invoicesCreatedThisMonth: 3,
      },

      getCurrentPlan: () => {
        const { planId } = get().subscription;
        return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
      },

      getRemainingInvoices: () => {
        const plan = get().getCurrentPlan();
        if (plan.invoiceLimit === Infinity) return Infinity;
        const remaining = plan.invoiceLimit - get().subscription.invoicesCreatedThisMonth;
        return Math.max(0, remaining);
      },

      canCreateInvoice: () => {
        const plan = get().getCurrentPlan();
        if (plan.invoiceLimit === Infinity) return true;
        return get().subscription.invoicesCreatedThisMonth < plan.invoiceLimit;
      },

      hasFeature: (feature: PlanFeatureKey) => {
        const { planId } = get().subscription;
        return Boolean(PLAN_PERMISSIONS[planId]?.[feature]);
      },

      getRequiredPlan: (feature: PlanFeatureKey) => {
        return FEATURE_REQUIRED_PLAN[feature]?.plan || 'starter';
      },

      isTemplateAllowed: (template: InvoiceTemplate) => {
        const { planId } = get().subscription;
        const allowed = TEMPLATE_PLAN_PERMISSIONS[planId] || ['minimal'];
        return allowed.includes(template);
      },

      getRequiredPlanForTemplate: (template: InvoiceTemplate) => {
        return TEMPLATE_REQUIRED_PLAN[template]?.plan || 'business';
      },

      recordInvoiceCreation: () => {
        set((state) => ({
          subscription: {
            ...state.subscription,
            invoicesCreatedThisMonth: state.subscription.invoicesCreatedThisMonth + 1,
          },
        }));
      },

      upgradePlan: (planId: SubscriptionPlanId) => {
        set((state) => ({
          subscription: {
            ...state.subscription,
            planId,
            status: 'active',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
          },
        }));
      },

      resetMonthlyUsage: () => {
        set((state) => ({
          subscription: {
            ...state.subscription,
            invoicesCreatedThisMonth: 0,
          },
        }));
      },
    }),
    {
      name: 'egolepay-subscriptions',
    }
  )
);

