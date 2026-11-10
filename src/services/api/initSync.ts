// Local-first synchronization engine (prepared for future ASP.NET Core API integration)
import { cloudSyncManager } from './cloudSyncManager';

let isInitialized = false;

export function initializeCloudSync() {
  if (isInitialized) return;
  isInitialized = true;

  cloudSyncManager.registerSyncCallback(async () => {
    // In local-first mode, all Zustand Persist stores write directly to LocalStorage
    return Promise.resolve();
  });
}
