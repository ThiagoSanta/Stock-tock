/**
 * Dominio: Ventas y Cobros Declarados
 */

export type PaymentMethod =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'TARJETA_DEBITO'
  | 'TARJETA_CREDITO'
  | 'CHEQUE'
  | 'OTRO';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  historicalCostPrice: number; // Costo al momento de la venta para calcular margen real
  subtotal: number;
}

export interface Sale {
  id: string;
  companyId: string;
  saleNumber: string;
  origin: 'VENTA_DIRECTA_MOSTRADOR' | 'PEDIDO_DESPACHADO';
  orderId?: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number; // Costo histórico total
  estimatedGrossMargin: number; // totalAmount - totalCost
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}
