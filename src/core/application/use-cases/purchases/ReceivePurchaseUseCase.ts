import { IPurchaseRepository } from '../../ports/IPurchaseRepository';
import { Purchase } from '@/core/domain/purchases/types';

export class ReceivePurchaseUseCase {
  constructor(private purchaseRepository: IPurchaseRepository) {}

  async execute(purchaseId: string, companyId: string): Promise<Purchase> {
    if (!purchaseId || !companyId) {
      throw new Error('Parámetros inválidos para recibir la orden de compra.');
    }

    return await this.purchaseRepository.receivePurchase(purchaseId, companyId);
  }
}
