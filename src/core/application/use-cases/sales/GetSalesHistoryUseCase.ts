import { ISaleRepository, SaleWithDetails } from '../../ports/ISaleRepository';

export class GetSalesHistoryUseCase {
  constructor(private saleRepository: ISaleRepository) {}

  async execute(companyId: string, options?: { origin?: string }): Promise<SaleWithDetails[]> {
    if (!companyId) {
      throw new Error('El ID de empresa es obligatorio.');
    }

    return await this.saleRepository.findAllSales(companyId, options);
  }
}
