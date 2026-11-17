import { IInventoryRepository, AdjustStockDTO } from '../../ports/IInventoryRepository';
import { StockMovement } from '@/core/domain/inventory/types';

export class AdjustStockUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async execute(dto: AdjustStockDTO): Promise<StockMovement> {
    if (!dto.companyId || !dto.warehouseId || !dto.productId) {
      throw new Error('Empresa, depósito y producto son obligatorios.');
    }

    if (!dto.quantity || dto.quantity <= 0) {
      throw new Error('La cantidad de ajuste debe ser un número positivo mayor a 0.');
    }

    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new Error('El motivo del ajuste es obligatorio y debe tener al menos 5 caracteres.');
    }

    return await this.inventoryRepository.adjustStock(dto);
  }
}
