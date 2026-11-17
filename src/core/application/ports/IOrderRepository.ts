import { Order, OrderStatus } from '@/core/domain/catalog/../orders/types';
import { Sale } from '@/core/domain/sales/types';

export interface CreateOrderItemDTO {
  productId: string;
  variantId?: string;
  productName: string;
  quantityRequested: number;
  unitPrice: number;
  costPrice: number;
}

export interface CreateOrderDTO {
  companyId: string;
  warehouseId: string;
  customerName: string;
  customerId?: string;
  notes?: string;
  items: CreateOrderItemDTO[];
}

export interface IOrderRepository {
  createOrder(dto: CreateOrderDTO): Promise<Order>;
  confirmOrder(orderId: string, companyId: string): Promise<Order>;
  dispatchOrder(orderId: string, companyId: string): Promise<{ order: Order; sale: Sale }>;
  cancelOrder(orderId: string, companyId: string): Promise<Order>;
  findOrders(companyId: string, status?: OrderStatus): Promise<Order[]>;
  findById(orderId: string): Promise<Order | null>;
}
