import { supabase, isSupabaseConfigured } from './client';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useCustomerStore } from '../../store/customerStore';
import { useProductStore } from '../../store/productStore';
import { useBusinessStore } from '../../store/businessStore';
import { useAuthStore } from '../../store/authStore';
import { calculateTotals } from '../../lib/calculateTotals';

export interface SyncResult {
  success: boolean;
  message: string;
  invoicesCount?: number;
  clientsCount?: number;
  productsCount?: number;
}

/**
 * Pushes local invoices, clients, and inventory into Supabase
 */
export async function syncLocalToSupabase(): Promise<SyncResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      message: 'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
    };
  }

  const user = useAuthStore.getState().currentUser;
  if (!user) {
    return {
      success: false,
      message: 'User is not authenticated. Please log in before syncing.',
    };
  }

  try {
    const activeBusiness = useBusinessStore.getState().getActiveBusiness();
    const customers = useCustomerStore.getState().customers;
    const products = useProductStore.getState().products;
    const invoices = useInvoiceStore.getState().invoices;

    // 1. Sync Business Profile
    let businessId: string | null = null;
    if (activeBusiness) {
      const { data: bData, error: bError } = await supabase
        .from('businesses')
        .upsert(
          {
            user_id: user.id,
            name: activeBusiness.name,
            email: activeBusiness.email,
            phone: activeBusiness.phone,
            address: activeBusiness.address,
            default_currency: activeBusiness.defaultCurrency,
            default_tax_rate: activeBusiness.defaultTaxRate,
            default_payment_terms_days: activeBusiness.defaultPaymentTermsDays,
            invoice_prefix: activeBusiness.invoicePrefix,
            accent_color: activeBusiness.accentColor,
            bank_account_name: activeBusiness.name,
            payment_instructions: activeBusiness.bankDetails,
          },
          { onConflict: 'id' }
        )
        .select('id')
        .single();

      if (!bError && bData) {
        businessId = bData.id;
      }
    }

    // 2. Sync Customers / Clients
    if (customers.length > 0 && businessId) {
      const clientPayload = customers.map((c) => ({
        business_id: businessId,
        user_id: user.id,
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        address: c.address,
        currency: 'NGN',
        payment_terms_days: 14,
        notes: c.notes || '',
      }));

      await supabase.from('clients').upsert(clientPayload);
    }

    // 3. Sync Products
    if (products.length > 0 && businessId) {
      const productPayload = products.map((p) => ({
        business_id: businessId,
        user_id: user.id,
        name: p.name,
        description: p.description || '',
        sku: `SKU-${p.id.slice(0, 6)}`,
        type: 'service',
        unit_price: p.unitPrice,
        category: 'General',
        stock: 0,
      }));

      await supabase.from('products').upsert(productPayload);
    }

    // 4. Sync Invoices & Line items
    if (invoices.length > 0 && businessId) {
      for (const inv of invoices) {
        const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);

        const { data: invData, error: invError } = await supabase
          .from('invoices')
          .upsert(
            {
              business_id: businessId,
              user_id: user.id,
              number: inv.number,
              issue_date: inv.issueDate,
              due_date: inv.dueDate,
              status: inv.status,
              currency: inv.currency,
              subtotal: totals.subtotal,
              discount_type: 'percentage',
              discount_value: inv.discount || 0,
              tax_rate: inv.taxRate || 0,
              total: totals.total,
              paid_amount: inv.paidAmount || 0,
              outstanding_amount: inv.outstandingAmount || totals.total,
              notes: inv.notes,
              template_id: inv.template || 'modern',
              public_payment_token: inv.publicPaymentToken || undefined,
            },
            { onConflict: 'business_id, number' }
          )
          .select('id')
          .single();

        if (!invError && invData && inv.items && inv.items.length > 0) {
          const itemsPayload = inv.items.map((it, idx) => ({
            invoice_id: invData.id,
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unitPrice,
            amount: it.quantity * it.unitPrice,
            sort_order: idx,
          }));
          await supabase.from('invoice_items').upsert(itemsPayload);
        }
      }
    }

    return {
      success: true,
      message: 'Local workspace data was successfully synced to Supabase.',
      invoicesCount: invoices.length,
      clientsCount: customers.length,
      productsCount: products.length,
    };
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message,
    };
  }
}
