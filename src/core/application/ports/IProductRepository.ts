import { Product } from '@/core/domain/catalog/types';

export interface ProductWithStock extends Product {
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  warehouseId: string;
}

export interface CreateProductWithStockDTO {
  companyId: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  unitOfMeasure: 'UNIDAD' | 'KG' | 'LITRO' | 'METRO' | 'PACK';
  costPrice: number;
  salePrice: number;
  minStockAlert: number;
  tracksLotsAndExpiry?: boolean;
  initialStock?: number;
  warehouseId?: string;
}

export interface IProductRepository {
  findAll(companyId: string): Promise<Product[]>;
  findAllWithStock(companyId: string): Promise<ProductWithStock[]>;
  findById(id: string): Promise<Product | null>;
  create(data: CreateProductWithStockDTO): Promise<Product>;
}
