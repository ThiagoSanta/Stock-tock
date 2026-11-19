import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { UserRoleProvider } from '@/utils/security/UserRoleContext';

// Code-splitting por ruta con React.lazy para carga inicial ultrarrápida
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ProductsPage = lazy(() =>
  import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage }))
);
const InventoryPage = lazy(() =>
  import('@/pages/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const OrdersPage = lazy(() =>
  import('@/pages/OrdersPage').then((m) => ({ default: m.OrdersPage }))
);
const SalesPage = lazy(() =>
  import('@/pages/SalesPage').then((m) => ({ default: m.SalesPage }))
);
const PurchasesPage = lazy(() =>
  import('@/pages/PurchasesPage').then((m) => ({ default: m.PurchasesPage }))
);
const ContactsPage = lazy(() =>
  import('@/pages/ContactsPage').then((m) => ({ default: m.ContactsPage }))
);
const AlertsPage = lazy(() =>
  import('@/pages/AlertsPage').then((m) => ({ default: m.AlertsPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

export function App() {
  return (
    <UserRoleProvider>
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
    </UserRoleProvider>
  );
}

export default App;
