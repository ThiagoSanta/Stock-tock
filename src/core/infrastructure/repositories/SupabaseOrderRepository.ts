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

    for (const item of dto.items) {
      await this.supabase.from('order_items').insert({
        order_id: orderId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity_requested: item.quantityRequested,
        quantity_dispatched: 0,
        unit_price: item.unitPrice,
        subtotal: item.quantityRequested * item.unitPrice,
      });
    }

    return (await this.findById(orderId)) as Order;
  }

  async confirmOrder(orderId: string, companyId: string): Promise<Order> {
    const order = await this.findById(orderId);
    if (!order) throw new Error('Pedido no encontrado.');
    if (order.status !== 'BORRADOR') throw new Error(`El pedido ya está en estado ${order.status}.`);

    // 1. Validar disponibilidad de stock de todos los ítems antes de reservar
    for (const item of order.items) {
      const { data: stockRow } = await this.supabase
        .from('inventory_stock')
        .select('*')
        .eq('company_id', companyId)
        .eq('warehouse_id', order.warehouseId)
        .eq('product_id', item.productId)
        .single();

      if (!stockRow) {
        throw new Error(`El producto "${item.productName}" no tiene inventario en este depósito.`);
      }

      const available = Number(stockRow.available_stock);
      if (item.quantityRequested > available) {
        throw new Error(
          `No se puede confirmar el pedido. Stock disponible insuficiente para "${item.productName}" (Disponible: ${available}, Requerido: ${item.quantityRequested}).`
        );
      }
    }

    // 2. Incrementar reservas y asentar Kardex
    for (const item of order.items) {
      const { data: stockRow } = await this.supabase
        .from('inventory_stock')
        .select('*')
        .eq('company_id', companyId)
        .eq('warehouse_id', order.warehouseId)
        .eq('product_id', item.productId)
        .single();

      const physical = Number(stockRow.physical_stock);
      const newReserved = Number(stockRow.reserved_stock) + item.quantityRequested;
      const newAvailable = physical - newReserved;

      await this.supabase
        .from('inventory_stock')
        .update({
          reserved_stock: newReserved,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stockRow.id);

      await this.supabase.from('stock_movements').insert({
        company_id: companyId,
        warehouse_id: order.warehouseId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        movement_type: 'RESERVA_PEDIDO',
        quantity: item.quantityRequested,
        balance_physical_after: physical,
        balance_reserved_after: newReserved,
        balance_available_after: newAvailable,
        reference_type: 'ORDER',
        reference_id: orderId,
        notes: `Reserva para Pedido #${order.orderNumber}`,
      });
    }

    // 3. Actualizar estado del pedido a CONFIRMADO
    await this.supabase
      .from('orders')
      .update({
        status: 'CONFIRMADO',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return (await this.findById(orderId)) as Order;
  }

  async dispatchOrder(orderId: string, companyId: string): Promise<{ order: Order; sale: Sale }> {
    const order = await this.findById(orderId);
    if (!order) throw new Error('Pedido no encontrado.');
    if (order.status !== 'CONFIRMADO' && order.status !== 'EN_PREPARACION') {
      throw new Error(`El pedido debe estar confirmado para poder despacharlo (Estado actual: ${order.status}).`);
    }

    // 1. Deducir stock físico y liberar reserva
    let totalCost = 0;
    for (const item of order.items) {
      const { data: stockRow } = await this.supabase
        .from('inventory_stock')
        .select('*')
        .eq('company_id', companyId)
        .eq('warehouse_id', order.warehouseId)
        .eq('product_id', item.productId)
        .single();

      const { data: prodData } = await this.supabase
        .from('products')
        .select('cost_price')
        .eq('id', item.productId)
        .single();

      const costPrice = Number(prodData?.cost_price || 0);
      totalCost += costPrice * item.quantityRequested;

      const newPhysical = Number(stockRow.physical_stock) - item.quantityRequested;
      const newReserved = Number(stockRow.reserved_stock) - item.quantityRequested;
      const newAvailable = newPhysical - newReserved;

      await this.supabase
        .from('inventory_stock')
        .update({
          physical_stock: newPhysical,
          reserved_stock: newReserved,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stockRow.id);

      await this.supabase.from('stock_movements').insert({
        company_id: companyId,
        warehouse_id: order.warehouseId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        movement_type: 'SALIDA_VENTA',
        quantity: -item.quantityRequested,
        balance_physical_after: newPhysical,
        balance_reserved_after: newReserved,
        balance_available_after: newAvailable,
        unit_cost: costPrice,
        reference_type: 'ORDER',
        reference_id: orderId,
        notes: `Despacho de Pedido #${order.orderNumber}`,
      });
    }

    // 2. Crear la venta formal
    const saleNumber = `VTA-PED-${order.orderNumber.replace('PED-', '')}`;
    const { data: saleData } = await this.supabase
      .from('sales')
      .insert({
        company_id: companyId,
        warehouse_id: order.warehouseId,
        customer_id: order.customerId || null,
        order_id: order.id,
        sale_number: saleNumber,
        origin: 'PEDIDO_DESPACHADO',
        payment_method: 'TRANSFERENCIA',
        total_amount: order.totalAmount,
        total_cost: totalCost,
        notes: `Venta procedente de Despacho de Pedido #${order.orderNumber}`,
      })
      .select()
      .single();

    // 3. Insertar items de venta
    for (const item of order.items) {
      const { data: p } = await this.supabase.from('products').select('cost_price').eq('id', item.productId).single();
      await this.supabase.from('sale_items').insert({
        sale_id: saleData.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: item.quantityRequested,
        unit_price: item.unitPrice,
        historical_cost_price: Number(p?.cost_price || 0),
        subtotal: item.subtotal,
      });
    }

    // 4. Actualizar pedido a DESPACHADO_TOTAL
    await this.supabase
      .from('orders')
      .update({
        status: 'DESPACHADO_TOTAL',
        dispatched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    const updatedOrder = (await this.findById(orderId)) as Order;

    const sale: Sale = {
      id: saleData.id,
      companyId: saleData.company_id,
      saleNumber: saleData.sale_number,
      origin: 'PEDIDO_DESPACHADO',
      orderId: order.id,
      customerName: order.customerName,
      items: [],
      totalAmount: Number(saleData.total_amount),
      totalCost: Number(saleData.total_cost),
      estimatedGrossMargin: Number(saleData.total_amount) - Number(saleData.total_cost),
      paymentMethod: 'TRANSFERENCIA',
      notes: saleData.notes,
      createdAt: saleData.created_at,
    };

    return { order: updatedOrder, sale };
  }

  async cancelOrder(orderId: string, companyId: string): Promise<Order> {
    const order = await this.findById(orderId);
    if (!order) throw new Error('Pedido no encontrado.');
    if (order.status === 'DESPACHADO_TOTAL' || order.status === 'CANCELADO') {
      throw new Error(`No se puede cancelar un pedido en estado ${order.status}.`);
    }

    // Si estaba confirmado, liberamos la reserva de stock
    if (order.status === 'CONFIRMADO' || order.status === 'EN_PREPARACION') {
      for (const item of order.items) {
        const { data: stockRow } = await this.supabase
          .from('inventory_stock')
          .select('*')
          .eq('company_id', companyId)
          .eq('warehouse_id', order.warehouseId)
          .eq('product_id', item.productId)
          .single();

        const physical = Number(stockRow.physical_stock);
        const newReserved = Math.max(0, Number(stockRow.reserved_stock) - item.quantityRequested);
        const newAvailable = physical - newReserved;

        await this.supabase
          .from('inventory_stock')
          .update({
            reserved_stock: newReserved,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stockRow.id);

        await this.supabase.from('stock_movements').insert({
          company_id: companyId,
          warehouse_id: order.warehouseId,
          product_id: item.productId,
          variant_id: item.variantId || null,
          movement_type: 'LIBERACION_PEDIDO',
          quantity: -item.quantityRequested,
          balance_physical_after: physical,
          balance_reserved_after: newReserved,
          balance_available_after: newAvailable,
          reference_type: 'ORDER',
          reference_id: orderId,
          notes: `Liberación de reserva por Cancelación de Pedido #${order.orderNumber}`,
        });
      }
    }

    await this.supabase
      .from('orders')
      .update({
        status: 'CANCELADO',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

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
