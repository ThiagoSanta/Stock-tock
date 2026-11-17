/**
 * Dominio: Inventario y Movimientos de Stock
 * Regla Inviolable: Stock disponible = Físico - Reservado. Jamás puede ser negativo.
 */

export type StockMovementType =
  | 'INGRESO_COMPRA'
  | 'INGRESO_AJUSTE'
  | 'SALIDA_VENTA'
  | 'SALIDA_AJUSTE'
  | 'RESERVA_PEDIDO'
  | 'LIBERACION_PEDIDO'
  | 'TRANSFERENCIA_SALIDA'
  | 'TRANSFERENCIA_ENTRADA'
  | 'DEVOLUCION_CLIENTE';

export interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code: string;
  isDefault: boolean;
  active: boolean;
}

export interface InventoryStock {
  id: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  variantId?: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  variantId?: string;
  type: StockMovementType;
  quantity: number;
  balancePhysicalAfter: number;
  referenceType?: 'ORDER' | 'SALE' | 'PURCHASE' | 'MANUAL_ADJUSTMENT';
  referenceId?: string;
  notes?: string;
  userId: string;
  createdAt: string;
}
