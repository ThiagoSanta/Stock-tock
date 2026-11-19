import { IInventoryRepository, TransferStockDTO, TransferStockResult } from '../../ports/IInventoryRepository';

export class TransferStockUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async execute(dto: TransferStockDTO): Promise<TransferStockResult> {
    if (!dto.companyId) {
      throw new Error('El ID de empresa es obligatorio.');
    }

    if (!dto.originWarehouseId || !dto.destinationWarehouseId) {
      throw new Error('Debe especificar depósito de origen y depósito de destino.');
    }

    if (dto.originWarehouseId === dto.destinationWarehouseId) {
      throw new Error('El depósito de origen y destino no pueden ser el mismo.');
    }

    if (!dto.productId) {
      throw new Error('Debe seleccionar el producto a transferir.');
    }

    if (!dto.quantity || dto.quantity <= 0) {
      throw new Error('La cantidad a transferir debe ser un número mayor a 0.');
    }

    return await this.inventoryRepository.transferStock(dto);
  }
}
