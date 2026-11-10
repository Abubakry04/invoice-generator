import { Invoice, Client, ProductItem, Settings, SubscriptionPlanId } from '../../types';

export interface CloudApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// Configurable API endpoint (can be configured in .env as VITE_API_BASE_URL)
const REMOTE_API_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL;

class CloudApiClient {
  private isOnlineState = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnlineState = true;
      });
      window.addEventListener('offline', () => {
        this.isOnlineState = false;
      });
    }
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  // Helper to simulate remote API call latency when no remote backend URL is provided
  private async delay(ms = 350): Promise<void> {
    if (!this.isOnlineState) {
      throw new Error('Device is offline. Changes saved locally and will sync once reconnected.');
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- Invoices API ---
  async syncInvoices(organizationId: string, invoices: Invoice[]): Promise<CloudApiResponse<Invoice[]>> {
    if (REMOTE_API_URL) {
      const res = await fetch(`${REMOTE_API_URL}/organizations/${organizationId}/invoices/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices }),
      });
      if (!res.ok) throw new Error('Cloud sync failed');
      return res.json();
    }

    await this.delay(400);
    return {
      success: true,
      data: invoices,
      timestamp: new Date().toISOString(),
    };
  }

  async saveInvoice(organizationId: string, invoice: Invoice): Promise<CloudApiResponse<Invoice>> {
    if (REMOTE_API_URL) {
      const res = await fetch(`${REMOTE_API_URL}/organizations/${organizationId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });
      return res.json();
    }

    await this.delay(300);
    return {
      success: true,
      data: invoice,
      timestamp: new Date().toISOString(),
    };
  }

  async deleteInvoice(organizationId: string, invoiceId: string): Promise<CloudApiResponse<string>> {
    if (REMOTE_API_URL) {
      const res = await fetch(`${REMOTE_API_URL}/organizations/${organizationId}/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      return res.json();
    }

    await this.delay(250);
    return {
      success: true,
      data: invoiceId,
      timestamp: new Date().toISOString(),
    };
  }

  // --- Clients API ---
  async syncClients(organizationId: string, clients: Client[]): Promise<CloudApiResponse<Client[]>> {
    if (REMOTE_API_URL) {
      const res = await fetch(`${REMOTE_API_URL}/organizations/${organizationId}/clients/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients }),
      });
      return res.json();
    }

    await this.delay(350);
    return {
      success: true,
      data: clients,
      timestamp: new Date().toISOString(),
    };
  }

  // --- Products / Inventory API ---
  async syncProducts(organizationId: string, products: ProductItem[]): Promise<CloudApiResponse<ProductItem[]>> {
    if (REMOTE_API_URL) {
      const res = await fetch(`${REMOTE_API_URL}/organizations/${organizationId}/products/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
      return res.json();
    }

    await this.delay(350);
    return {
      success: true,
      data: products,
      timestamp: new Date().toISOString(),
    };
  }

  // --- Settings API ---
  async syncSettings(organizationId: string, settings: Settings): Promise<CloudApiResponse<Settings>> {
    if (REMOTE_API_URL) {
      const res = await fetch(`${REMOTE_API_URL}/organizations/${organizationId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      return res.json();
    }

    await this.delay(300);
    return {
      success: true,
      data: settings,
      timestamp: new Date().toISOString(),
    };
  }

  // --- Subscriptions & Billing API ---
  async updateSubscription(organizationId: string, plan: SubscriptionPlanId): Promise<CloudApiResponse<any>> {
    await this.delay(300);
    return {
      success: true,
      data: {
        plan,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export const cloudApi = new CloudApiClient();

