import { StockMovement, StockMovementType } from '@/core/domain/inventory/types';

export interface InventoryStockDetailed {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitOfMeasure: string;
  costPrice: number;
  salePrice: number;
  warehouseId: string;
  warehouseName: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  minStockAlert: number;
  totalValuation: number;
}

export interface StockMovementDetailed {
  id: string;
  createdAt: string;
  movementType: StockMovementType;
  productId: string;
  productName: string;
  sku: string;
  warehouseName: string;
  quantity: number;
  balancePhysicalAfter: number;
  balanceAvailableAfter: number;
  unitCost?: number;
  notes?: string;
  referenceType?: string;
}

export interface AdjustStockDTO {
  companyId: string;
  warehouseId: string;
  productId: string;
  variantId?: string;
  type: 'INGRESO_AJUSTE' | 'SALIDA_AJUSTE';
  quantity: number;
  reason: string;
}

export interface IInventoryRepository {
  getStockBalance(companyId: string, warehouseId?: string): Promise<InventoryStockDetailed[]>;
  getKardexMovements(
    companyId: string,
    options?: { limit?: number; type?: string; productId?: string }
  ): Promise<StockMovementDetailed[]>;
  adjustStock(dto: AdjustStockDTO): Promise<StockMovement>;
}
