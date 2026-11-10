import { z } from 'zod';

export const lineItemSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  description: z.string().min(1, 'Item description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Price must be 0 or higher'),
});

export const invoiceFormSchema = z.object({
  number: z.string().min(1, 'Invoice number is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  currency: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled']),
  template: z.enum(['modern', 'classic', 'minimal']),
  accentColor: z.string(),
  business: z.object({
    name: z.string().min(1, 'Business name is required'),
    address: z.string().default(''),
    email: z.string().default(''),
    phone: z.string().default(''),
    logo: z.string().optional().default(''),
    bankDetails: z.string().optional().default(''),
  }),
  client: z.object({
    name: z.string().min(1, 'Client name is required'),
    email: z.string().default(''),
    address: z.string().default(''),
    phone: z.string().optional().default(''),
  }),
  items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
  discount: z.coerce.number().min(0, 'Min 0%').max(100, 'Max 100%'),
  taxRate: z.coerce.number().min(0, 'Min 0%'),
  notes: z.string().optional().default(''),
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
