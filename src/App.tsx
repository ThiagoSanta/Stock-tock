import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { SalesPage } from '@/pages/SalesPage';
import { PurchasesPage } from '@/pages/PurchasesPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { SettingsPage } from '@/pages/SettingsPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="productos" element={<ProductsPage />} />
        <Route path="inventario" element={<InventoryPage />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="ventas" element={<SalesPage />} />
        <Route path="compras" element={<PurchasesPage />} />
        <Route path="contactos" element={<ContactsPage />} />
        <Route path="alertas" element={<AlertsPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
