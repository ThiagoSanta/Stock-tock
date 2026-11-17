import { IInventoryRepository, InventoryStockDetailed } from '../../ports/IInventoryRepository';

export class GetInventoryBalanceUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async execute(companyId: string, warehouseId?: string): Promise<InventoryStockDetailed[]> {
    if (!companyId) throw new Error('El ID de empresa es obligatorio.');
    return await this.inventoryRepository.getStockBalance(companyId, warehouseId);
  }
}
