import { SyncStatus } from '../../types';

type SyncListener = (status: SyncStatus, lastSyncedAt: string | null) => void;

class CloudSyncManager {
  private listeners: Set<SyncListener> = new Set();
  private currentStatus: SyncStatus = 'synced';
  private lastSyncedAt: string | null = new Date().toISOString();
  private syncStoresCallback?: () => Promise<void>;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setStatus('syncing');
        this.triggerFullSync();
      });

      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });
    }
  }

  registerSyncCallback(callback: () => Promise<void>) {
    this.syncStoresCallback = callback;
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus, this.lastSyncedAt);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getStatus(): SyncStatus {
    return this.currentStatus;
  }

  getLastSyncedAt(): string | null {
    return this.lastSyncedAt;
  }

  setStatus(status: SyncStatus) {
    this.currentStatus = status;
    if (status === 'synced') {
      this.lastSyncedAt = new Date().toISOString();
    }
    this.listeners.forEach((listener) => listener(this.currentStatus, this.lastSyncedAt));
  }

  async triggerFullSync(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    this.setStatus('syncing');
    try {
      if (this.syncStoresCallback) {
        await this.syncStoresCallback();
      }
      this.setStatus('synced');
    } catch (err) {
      console.warn('Sync warning:', err);
      this.setStatus('error');
    }
  }
}

export const cloudSyncManager = new CloudSyncManager();

