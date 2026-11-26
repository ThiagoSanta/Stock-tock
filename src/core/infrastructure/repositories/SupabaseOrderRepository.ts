import { createClient } from '@/utils/supabase/client';
import { Order, OrderStatus } from '@/core/domain/orders/types';
import { Sale } from '@/core/domain/sales/types';
import { IOrderRepository, CreateOrderDTO } from '@/core/application/ports/IOrderRepository';

export class SupabaseOrderRepository implements IOrderRepository {
  private supabase = createClient();

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PED-${Date.now().toString().slice(-4)}${randomSuffix}`;
    const totalAmount = dto.items.reduce((sum, it) => sum + it.quantityRequested * it.unitPrice, 0);

    const { data: orderData, error: oErr } = await this.supabase
      .from('orders')
      .insert({
        company_id: dto.companyId,
        warehouse_id: dto.warehouseId,
        customer_id: dto.customerId || null,
        order_number: orderNumber,
        status: 'BORRADOR',
        total_amount: totalAmount,
        notes: dto.notes || `Cliente: ${dto.customerName}`,
      })
      .select()
      .single();

    if (oErr || !orderData) {
      throw new Error(`Error al crear pedido: ${oErr?.message}`);
    }

    const orderId = orderData.id;

    if (dto.items.length > 0) {
      const { error: itemsErr } = await this.supabase.from('order_items').insert(
        dto.items.map((item) => ({
          order_id: orderId,
          product_id: item.productId,
          variant_id: item.variantId || null,
          quantity_requested: item.quantityRequested,
          quantity_dispatched: 0,
          unit_price: item.unitPrice,
          subtotal: item.quantityRequested * item.unitPrice,
        }))
      );
      if (itemsErr) {
        throw new Error(`Error al insertar ítems del pedido: ${itemsErr.message}`);
      }
    }

    return (await this.findById(orderId)) as Order;
  }

  async confirmOrder(orderId: string, companyId: string): Promise<Order> {
    const { error } = await this.supabase.rpc('rpc_confirm_order', {
      p_order_id: orderId,
      p_company_id: companyId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return (await this.findById(orderId)) as Order;
  }

  async dispatchOrder(orderId: string, companyId: string): Promise<{ order: Order; sale: Sale }> {
    const { data: saleId, error } = await this.supabase.rpc('rpc_dispatch_order', {
      p_order_id: orderId,
      p_company_id: companyId,
      p_payment_method: 'TRANSFERENCIA',
    });

    if (error || !saleId) {
      throw new Error(error?.message || 'Error al despachar el pedido.');
    }

    const updatedOrder = (await this.findById(orderId)) as Order;
    const { data: saleData, error: saleErr } = await this.supabase
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (saleErr || !saleData) {
      throw new Error(`Error consultando la venta generada: ${saleErr?.message}`);
    }

    const sale: Sale = {
      id: saleData.id,
      companyId: saleData.company_id,
      saleNumber: saleData.sale_number,
      origin: 'PEDIDO_DESPACHADO',
      orderId: updatedOrder.id,
      customerName: updatedOrder.customerName,
      items: [],
      totalAmount: Number(saleData.total_amount),
      totalCost: Number(saleData.total_cost),
      estimatedGrossMargin: Number(saleData.total_amount) - Number(saleData.total_cost),
      paymentMethod: saleData.payment_method,
      notes: saleData.notes,
      createdAt: saleData.created_at,
    };

    return { order: updatedOrder, sale };
  }

  async cancelOrder(orderId: string, companyId: string): Promise<Order> {
    const { error } = await this.supabase.rpc('rpc_cancel_order', {
      p_order_id: orderId,
      p_company_id: companyId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return (await this.findById(orderId)) as Order;
  }

  async findOrders(companyId: string, status?: OrderStatus): Promise<Order[]> {
    let query = this.supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(name))')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => this.mapRowToOrder(row));
  }

  async findById(orderId: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(name))')
      .eq('id', orderId)
      .single();

    if (error || !data) return null;
    return this.mapRowToOrder(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToOrder(row: any): Order {
    return {
      id: row.id,
      companyId: row.company_id,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      customerName: row.notes?.replace('Cliente: ', '') || 'Cliente Genérico',
      status: row.status,
      warehouseId: row.warehouse_id,
      items: (row.items || []).map((it: any) => ({
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        variantId: it.variant_id,
        productName: it.product?.name || 'Producto',
        quantityRequested: Number(it.quantity_requested),
        quantityDispatched: Number(it.quantity_dispatched || 0),
        unitPrice: Number(it.unit_price),
        subtotal: Number(it.subtotal),
      })),
      totalAmount: Number(row.total_amount),
      notes: row.notes,
      confirmedAt: row.confirmed_at,
      dispatchedAt: row.dispatched_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
