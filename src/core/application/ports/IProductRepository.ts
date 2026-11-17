import { Product } from '@/core/domain/catalog/types';

export interface CreateProductDTO {
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
}

export interface IProductRepository {
  findAll(companyId: string): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(data: CreateProductDTO): Promise<Product>;
}
