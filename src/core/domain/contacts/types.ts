/**
 * Dominio: Clientes y Proveedores (Contactos Comerciales)
 */

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  taxId?: string; // DNI o CUIT
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface CustomerWithMetrics extends Customer {
  totalOrdersCount: number;
  totalSpent: number;
  lastPurchaseDate?: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  taxId?: string; // CUIT
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface SupplierWithMetrics extends Supplier {
  totalPurchasesCount: number;
  totalSpent: number;
  lastPurchaseDate?: string;
}
