import { IInventoryRepository, StockMovementDetailed } from '../../ports/IInventoryRepository';

export class GetKardexUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async execute(
    companyId: string,
    options?: { limit?: number; type?: string; productId?: string }
  ): Promise<StockMovementDetailed[]> {
    if (!companyId) throw new Error('El ID de empresa es obligatorio.');
    return await this.inventoryRepository.getKardexMovements(companyId, options);
  }
}
