import { ISaleRepository, SaleWithDetails } from '../../ports/ISaleRepository';

export class GetSaleReceiptUseCase {
  constructor(private saleRepository: ISaleRepository) {}

  async execute(saleId: string): Promise<SaleWithDetails> {
    if (!saleId) throw new Error('El ID de venta es obligatorio.');
    const sale = await this.saleRepository.findSaleById(saleId);
    if (!sale) throw new Error('Venta no encontrada.');
    return sale;
  }
}
