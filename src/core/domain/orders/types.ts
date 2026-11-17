/**
 * Dominio: Pedidos de Clientes
 * Máquina de estados: BORRADOR -> CONFIRMADO -> EN_PREPARACION -> DESPACHADO -> CERRADO / CANCELADO
 */

export type OrderStatus =
  | 'BORRADOR'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'DESPACHADO_PARCIAL'
  | 'DESPACHADO_TOTAL'
  | 'CERRADO'
  | 'CANCELADO';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  quantityRequested: number;
  quantityDispatched: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  companyId: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  status: OrderStatus;
  warehouseId: string;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  confirmedAt?: string;
  dispatchedAt?: string;
  createdAt: string;
  updatedAt: string;
}
