import { Purchase, Supplier, PurchaseStatus } from '@/core/domain/purchases/types';

export interface CreatePurchaseItemDTO {
  productId: string;
  variantId?: string;
  productName: string;
  quantityOrdered: number;
  unitCost: number;
}

export interface CreatePurchaseDTO {
  companyId: string;
  warehouseId: string;
  supplierName: string;
  supplierId?: string;
  notes?: string;
  items: CreatePurchaseItemDTO[];
}

export interface CreateSupplierDTO {
  companyId: string;
  name: string;
  taxId?: string;
  contactName?: string;
  phone?: string;
  email?: string;
}

export interface IPurchaseRepository {
  createPurchase(dto: CreatePurchaseDTO): Promise<Purchase>;
  receivePurchase(purchaseId: string, companyId: string): Promise<Purchase>;
  findPurchases(companyId: string, status?: PurchaseStatus): Promise<Purchase[]>;
  findById(purchaseId: string): Promise<Purchase | null>;
  findSuppliers(companyId: string): Promise<Supplier[]>;
  createSupplier(dto: CreateSupplierDTO): Promise<Supplier>;
}
