import { ISaleRepository, CreateDirectSaleDTO } from '../../ports/ISaleRepository';
import { Sale } from '@/core/domain/sales/types';

export class ProcessDirectSaleUseCase {
  constructor(private saleRepository: ISaleRepository) {}

  async execute(dto: CreateDirectSaleDTO): Promise<Sale> {
    if (!dto.companyId) {
      throw new Error('El ID de empresa es obligatorio.');
    }

    if (!dto.warehouseId) {
      throw new Error('Debe especificarse el depósito de salida.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('La venta debe incluir al menos un producto.');
    }

    for (const item of dto.items) {
      if (item.quantity <= 0) {
        throw new Error(`La cantidad de "${item.productName}" debe ser mayor a 0.`);
      }
      if (item.unitPrice < 0) {
        throw new Error(`El precio de "${item.productName}" no puede ser negativo.`);
      }
    }

    return await this.saleRepository.createDirectSale(dto);
  }
}
