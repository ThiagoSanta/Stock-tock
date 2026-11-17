import { IProductRepository, ProductWithStock } from '../../ports/IProductRepository';

export class GetProductsWithStockUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(companyId: string): Promise<ProductWithStock[]> {
    if (!companyId) {
      throw new Error('El ID de empresa es obligatorio para consultar el catálogo.');
    }

    return await this.productRepository.findAllWithStock(companyId);
  }
}
