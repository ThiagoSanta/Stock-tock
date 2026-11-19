/**
 * Dominio: Seguridad, Roles de Usuario y Auditoría Inmutable
 */

export type UserRole = 'ADMIN' | 'CASHIER' | 'WAREHOUSE';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  avatarColor: string; // Tailwind color class ej: 'bg-indigo-600'
}

export interface RolePermissions {
  canViewFinancials: boolean;   // Costos de compra PPP, márgenes brutos, valuación total
  canEditPrices: boolean;       // Cambiar precios de venta y listas
  canManageUsers: boolean;      // Crear usuarios, ver auditoría de seguridad
  canMakeSales: boolean;        // Operar punto de venta (POS) y caja
  canManageInventory: boolean;  // Ajustar stock, transferencias, crear lotes
  canAccessPurchases: boolean;  // Ver y registrar compras a proveedores
  canAccessSettings: boolean;   // Configurar depósitos, empresa, backups
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    canViewFinancials: true,
    canEditPrices: true,
    canManageUsers: true,
    canMakeSales: true,
    canManageInventory: true,
    canAccessPurchases: true,
    canAccessSettings: true,
  },
  CASHIER: {
    canViewFinancials: false, // NO ve costos ni márgenes
    canEditPrices: false,     // NO puede cambiar precios
    canManageUsers: false,
    canMakeSales: true,       // Opera mostrador y ventas
    canManageInventory: false,
    canAccessPurchases: false, // NO ve compras a proveedores
    canAccessSettings: false,
  },
  WAREHOUSE: {
    canViewFinancials: false, // NO ve márgenes ni costos
    canEditPrices: false,
    canManageUsers: false,
    canMakeSales: false,      // No cobra ventas de mostrador
    canManageInventory: true, // Manejo total de stock, lotes y traslados
    canAccessPurchases: true, // Recibe mercadería física
    canAccessSettings: false,
  },
};

export interface AuditLogEntry {
  id: string;
  companyId: string;
  userName: string;
  userRole: UserRole;
  module: 'INVENTARIO' | 'CATALOGO' | 'VENTAS' | 'CAJA' | 'CLIENTES' | 'PROVEEDORES' | 'SEGURIDAD';
  action: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  createdAt: string;
}
