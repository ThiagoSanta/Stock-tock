import { IOrderRepository } from '../../ports/IOrderRepository';
import { Order } from '@/core/domain/orders/types';

export class CancelOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, companyId: string): Promise<Order> {
    if (!orderId || !companyId) {
      throw new Error('Parámetros inválidos para cancelar el pedido.');
    }

    return await this.orderRepository.cancelOrder(orderId, companyId);
  }
}
