import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthProvider, useAuth } from '@/utils/security/AuthContext';
import { UserRoleProvider, useUserRole } from '@/utils/security/UserRoleContext';
import type { RolePermissions } from '@/core/domain/security/types';
import { ThemeProvider } from '@/utils/theme/ThemeContext';
import { LoginPage } from '@/pages/LoginPage';

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

function RequirePermission({
  permission,
  children,
}: {
  permission: keyof RolePermissions;
  children: React.ReactNode;
}) {
  const { permissions } = useUserRole();
  if (!permissions[permission]) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-6 h-6 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <UserRoleProvider>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="productos" element={<ProductsPage />} />
          <Route path="inventario" element={<InventoryPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route
            path="ventas"
            element={
              <RequirePermission permission="canMakeSales">
                <SalesPage />
              </RequirePermission>
            }
          />
          <Route
            path="compras"
            element={
              <RequirePermission permission="canAccessPurchases">
                <PurchasesPage />
              </RequirePermission>
            }
          />
          <Route path="contactos" element={<ContactsPage />} />
          <Route path="alertas" element={<AlertsPage />} />
          <Route
            path="configuracion"
            element={
              <RequirePermission permission="canAccessSettings">
                <SettingsPage />
              </RequirePermission>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </UserRoleProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
