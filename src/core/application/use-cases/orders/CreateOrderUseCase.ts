import { IOrderRepository, CreateOrderDTO } from '../../ports/IOrderRepository';
import { Order } from '@/core/domain/orders/types';

export class CreateOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(dto: CreateOrderDTO): Promise<Order> {
    if (!dto.companyId) {
      throw new Error('El ID de empresa es obligatorio.');
    }

    if (!dto.customerName || dto.customerName.trim().length === 0) {
      throw new Error('Debe indicarse el nombre del cliente.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('El pedido debe incluir al menos un producto.');
    }

    for (const item of dto.items) {
      if (item.quantityRequested <= 0) {
        throw new Error(`La cantidad de "${item.productName}" debe ser mayor a 0.`);
      }
    }

    return await this.orderRepository.createOrder(dto);
  }
}
