import { IPurchaseRepository, CreatePurchaseDTO } from '../../ports/IPurchaseRepository';
import { Purchase } from '@/core/domain/purchases/types';

export class CreatePurchaseUseCase {
  constructor(private purchaseRepository: IPurchaseRepository) {}

  async execute(dto: CreatePurchaseDTO): Promise<Purchase> {
    if (!dto.companyId) {
      throw new Error('El ID de empresa es obligatorio.');
    }

    if (!dto.supplierName || dto.supplierName.trim().length === 0) {
      throw new Error('Debe indicarse el nombre del proveedor.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('La orden de compra debe incluir al menos un producto.');
    }

    for (const item of dto.items) {
      if (item.quantityOrdered <= 0) {
        throw new Error(`La cantidad a pedir de "${item.productName}" debe ser mayor a 0.`);
      }
      if (item.unitCost < 0) {
        throw new Error(`El costo de "${item.productName}" no puede ser negativo.`);
      }
    }

    return await this.purchaseRepository.createPurchase(dto);
  }
}
