import { IOrderRepository } from '../../ports/IOrderRepository';
import { Order } from '@/core/domain/orders/types';
import { Sale } from '@/core/domain/sales/types';

export class DispatchOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, companyId: string): Promise<{ order: Order; sale: Sale }> {
    if (!orderId || !companyId) {
      throw new Error('Parámetros inválidos para despachar el pedido.');
    }

    return await this.orderRepository.dispatchOrder(orderId, companyId);
  }
}
