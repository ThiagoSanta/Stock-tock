import { IOrderRepository } from '../../ports/IOrderRepository';
import { Order } from '@/core/domain/orders/types';

export class ConfirmOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, companyId: string): Promise<Order> {
    if (!orderId || !companyId) {
      throw new Error('Parámetros inválidos para confirmar el pedido.');
    }

    return await this.orderRepository.confirmOrder(orderId, companyId);
  }
}
