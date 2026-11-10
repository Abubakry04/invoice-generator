import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { InvoiceEditorPage } from './features/invoices/InvoiceEditorPage';
import { ClientsPage } from './features/clients/ClientsPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SubscriptionPage } from './features/subscription/SubscriptionPage';
import { PublicInvoicePayPage } from './features/public/PublicInvoicePayPage';
import { AuthPage } from './features/auth/AuthPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PlanUpgradeModal } from './components/saas/PlanUpgradeModal';
import { initializeCloudSync } from './services/api/initSync';

export const App: React.FC = () => {
  useEffect(() => {
    initializeCloudSync();
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication & Registration Routes */}
          <Route path="login" element={<AuthPage />} />
          <Route path="register" element={<AuthPage />} />

          {/* Public Client Hosted Invoice & Online Payment Route */}
          <Route path="pay/:id" element={<PublicInvoicePayPage />} />

          {/* SaaS Authenticated Workspace Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/new" element={<InvoiceEditorPage />} />
            <Route path="invoices/:id/edit" element={<InvoiceEditorPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <PlanUpgradeModal />
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
