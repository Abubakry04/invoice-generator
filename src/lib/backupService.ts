import { useInvoiceStore } from '../store/invoiceStore';
import { useCustomerStore } from '../store/customerStore';
import { useProductStore } from '../store/productStore';
import { useBusinessStore } from '../store/businessStore';
import { useRecurringStore } from '../store/recurringStore';
import { Customer, Invoice, ProductItem, BusinessProfile, RecurringSchedule } from '../types';

export interface WorkspaceBackupData {
  version: string;
  exportedAt: string;
  invoices: Invoice[];
  customers: Customer[];
  products: ProductItem[];
  businesses: BusinessProfile[];
  activeBusinessId: string | null;
  recurringSchedules: RecurringSchedule[];
}

/**
 * Generates and downloads a complete JSON snapshot of all workspace data
 */
export function exportWorkspaceBackup(): void {
  const invoices = useInvoiceStore.getState().invoices;
  const customers = useCustomerStore.getState().customers;
  const products = useProductStore.getState().products;
  const { businesses, activeBusinessId } = useBusinessStore.getState();
  const schedules = useRecurringStore.getState().schedules;

  const backup: WorkspaceBackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    invoices,
    customers,
    products,
    businesses,
    activeBusinessId: activeBusinessId || null,
    recurringSchedules: schedules,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `egolepay-workspace-backup-${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and restores workspace data from an imported backup JSON file
 */
export function restoreWorkspaceBackup(jsonString: string): {
  success: boolean;
  message: string;
  counts?: { invoices: number; clients: number; products: number };
} {
  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid backup file: file content must be a JSON object.' };
    }

    const invoicesList = Array.isArray(data.invoices) ? data.invoices : [];
    const customersList = Array.isArray(data.customers)
      ? data.customers
      : Array.isArray(data.clients)
      ? data.clients
      : [];

    if (invoicesList.length === 0 && customersList.length === 0) {
      return { success: false, message: 'Invalid backup format: missing invoices or customers collection.' };
    }

    // Restore to stores
    useInvoiceStore.setState({ invoices: invoicesList });
    useCustomerStore.setState({ customers: customersList });

    if (Array.isArray(data.products)) {
      useProductStore.setState({ products: data.products });
    }

    if (Array.isArray(data.businesses) && data.businesses.length > 0) {
      useBusinessStore.setState({
        businesses: data.businesses,
        activeBusinessId: data.activeBusinessId || data.businesses[0].id,
      });
    }

    if (Array.isArray(data.recurringSchedules)) {
      useRecurringStore.setState({ schedules: data.recurringSchedules });
    }

    return {
      success: true,
      message: 'Workspace restored successfully.',
      counts: {
        invoices: invoicesList.length,
        clients: customersList.length,
        products: Array.isArray(data.products) ? data.products.length : 0,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to restore backup: ${(err as Error).message}`,
    };
  }
}
