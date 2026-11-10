// Core Domain & SaaS Data Models for EgolePay

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled';

export type InvoiceTemplate = 'classic' | 'modern' | 'minimal';

export type ItemType = 'product' | 'service';

export type SubscriptionPlanId = 'free' | 'starter' | 'business';

export type PlanFeatureKey =
  | 'multi_currency'
  | 'premium_templates'
  | 'custom_accent'
  | 'payment_portal'
  | 'custom_logo'
  | 'multi_business'
  | 'export_data';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
}

export interface BusinessDetails {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo?: string;
  website?: string;
  taxId?: string;
  bankDetails?: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  taxId?: string;
  bankDetails?: string;
  logo?: string;
  defaultCurrency: string;
  defaultTaxRate: number;
  defaultPaymentTermsDays: number;
  invoicePrefix: string;
  accentColor: string;
  defaultTemplate: InvoiceTemplate;
  createdAt: string;
  business?: BusinessDetails; // nested compatibility accessor
}

export interface Customer {
  id: string;
  businessId?: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export type PaymentMethod = 'bank_transfer' | 'card' | 'cash' | 'pos' | 'other';

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  receiptNumber?: string;
  createdAt: string;
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

export interface RecurringSchedule {
  id: string;
  businessId?: string;
  invoiceId: string; // Template invoice ID
  clientName: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  nextRunDate: string;
  status: 'active' | 'paused' | 'completed';
  lastGeneratedAt?: string;
  totalGeneratedCount: number;
  autoSend?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDetails {
  id?: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
}

export interface Invoice {
  id: string;
  businessId?: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  business: BusinessDetails;
  client: ClientDetails;
  items: LineItem[];
  discount: number;
  taxRate: number;
  notes?: string;
  status: InvoiceStatus;
  paidAmount?: number;
  outstandingAmount?: number;
  payments?: PaymentRecord[];
  isRecurring?: boolean;
  recurringScheduleId?: string;
  template?: InvoiceTemplate;
  accentColor?: string;
  publicPaymentToken?: string;
  paymentLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductItem {
  id: string;
  businessId?: string;
  name: string;
  description?: string;
  unitPrice: number;
  type: ItemType;
  taxRate?: number;
  stock?: number;
  lowStockThreshold?: number;
  sku?: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  invoiceLimit: number;
  features: string[];
}

export interface SubscriptionState {
  planId: SubscriptionPlanId;
  status: 'active' | 'trial' | 'past_due' | 'cancelled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  invoicesCreatedThisMonth: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

// Backward compatibility alias for Settings
export interface Settings {
  business: BusinessDetails;
  defaultCurrency: string;
  defaultTaxRate: number;
  defaultPaymentTermsDays?: number;
  invoicePrefix: string;
  accentColor: string;
  defaultTemplate: InvoiceTemplate;
}

export type Client = Customer;
