import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { InvoiceEditorPage } from './features/invoices/InvoiceEditorPage';
import { ClientsPage } from './features/clients/ClientsPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { SettingsPage } from './features/settings/SettingsPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/new" element={<InvoiceEditorPage />} />
            <Route path="invoices/:id/edit" element={<InvoiceEditorPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
