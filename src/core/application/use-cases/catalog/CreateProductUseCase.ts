import { IProductRepository, CreateProductWithStockDTO } from '../../ports/IProductRepository';
import { Product } from '@/core/domain/catalog/types';

export class CreateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(dto: CreateProductWithStockDTO): Promise<Product> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('El nombre del producto es obligatorio.');
    }

    if (!dto.sku || dto.sku.trim().length === 0) {
      throw new Error('El código SKU es obligatorio.');
    }

    if (dto.costPrice < 0 || dto.salePrice < 0) {
      throw new Error('Los precios no pueden ser negativos.');
    }

    if ((dto.initialStock ?? 0) < 0) {
      throw new Error('El stock inicial no puede ser negativo.');
    }

    return await this.productRepository.create(dto);
  }
}
