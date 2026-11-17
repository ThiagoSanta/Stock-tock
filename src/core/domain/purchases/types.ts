/**
 * Dominio: Compras a Proveedores y Reabastecimiento
 */

export type PurchaseStatus =
  | 'BORRADOR'
  | 'EMITIDA'
  | 'RECEPCION_TOTAL'
  | 'CANCELADA';

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  taxId?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  variantId?: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  companyId: string;
  warehouseId: string;
  purchaseNumber: string;
  supplierId?: string;
  supplierName: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  totalAmount: number;
  notes?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}
