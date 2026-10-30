export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export type InvoiceTemplate = 'classic' | 'modern' | 'minimal';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface BusinessDetails {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo?: string;
  bankDetails?: string;
}

export interface ClientDetails {
  name: string;
  address: string;
  email: string;
  phone?: string;
}

export interface Invoice {
  id: string;
  number: string; // INV-0001, INV-0002...
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  currency: string; // default NGN
  business: BusinessDetails;
  client: ClientDetails;
  items: LineItem[];
  discount: number; // percent e.g. 5 for 5%
  taxRate: number; // percent, default 7.5
  notes?: string;
  status: InvoiceStatus;
  template?: InvoiceTemplate;
  accentColor?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  createdAt: string;
}

export interface Settings {
  business: BusinessDetails;
  defaultCurrency: string;
  defaultTaxRate: number;
  invoicePrefix: string;
  accentColor: string;
  defaultTemplate: InvoiceTemplate;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
}
