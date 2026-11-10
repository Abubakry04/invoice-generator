import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { cloudSyncManager } from '../../services/api/cloudSyncManager';
import { SyncStatus } from '../../types';

export const CloudSyncBadge: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>(cloudSyncManager.getStatus());
  const [lastSynced, setLastSynced] = useState<string | null>(cloudSyncManager.getLastSyncedAt());
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    return cloudSyncManager.subscribe((newStatus, lastSyncTime) => {
      setStatus(newStatus);
      setLastSynced(lastSyncTime);
    });
  }, []);

  const handleManualSync = async () => {
    if (status === 'syncing') return;
    setIsRotating(true);
    await cloudSyncManager.triggerFullSync();
    setTimeout(() => setIsRotating(false), 500);
  };

  const formattedTime = lastSynced
    ? new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <button
      type="button"
      onClick={handleManualSync}
      className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
      title={
        status === 'syncing'
          ? 'Syncing changes to cloud...'
          : status === 'offline'
          ? 'Offline mode: changes saved locally in browser'
          : status === 'error'
          ? 'Sync error. Click to retry.'
          : `Cloud synced at ${formattedTime || 'just now'}. Click to trigger sync.`
      }
      aria-label="Cloud sync status"
    >
      {status === 'syncing' || isRotating ? (
        <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
      ) : status === 'offline' ? (
        <CloudOff className="w-4 h-4 text-slate-400" />
      ) : status === 'error' ? (
        <AlertCircle className="w-4 h-4 text-rose-500" />
      ) : (
        <div className="relative">
          <Cloud className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      )}
    </button>
  );
};

