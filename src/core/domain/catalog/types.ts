/**
 * Dominio: Catálogo de Productos y Variantes
 */

export interface Category {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  name: string; // Ej: "Talle L / Azul"
  costPrice: number;
  salePrice: number;
  active: boolean;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId?: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  unitOfMeasure: 'UNIDAD' | 'KG' | 'LITRO' | 'METRO' | 'PACK';
  costPrice: number; // Costo promedio ponderado a nivel empresa
  salePrice: number;
  wholesalePrice?: number;
  minStockAlert: number;
  maxStock?: number;
  tracksLotsAndExpiry: boolean; // Flag para lotes/vencimientos
  hasVariants: boolean;
  variants?: ProductVariant[];
  imageUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
