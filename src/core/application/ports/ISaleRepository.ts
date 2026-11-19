import { Sale, SaleItem, PaymentMethod } from '@/core/domain/sales/types';

export interface CreateSaleItemDTO {
  productId: string;
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
}

export interface CreateDirectSaleDTO {
  companyId: string;
  warehouseId: string;
  customerName?: string;
  customerId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: CreateSaleItemDTO[];
}

export interface SaleWithDetails extends Sale {
  marginPercentage: number;
  warehouseName?: string;
  warehouseId?: string;
}

export interface ISaleRepository {
  createDirectSale(dto: CreateDirectSaleDTO): Promise<Sale>;
  findRecentSales(companyId: string, limit?: number): Promise<Sale[]>;
  findAllSales(companyId: string, options?: { origin?: string }): Promise<SaleWithDetails[]>;
  findSaleById(saleId: string): Promise<SaleWithDetails | null>;
}
