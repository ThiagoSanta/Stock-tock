import { createClient } from '@/utils/supabase/client';
import { Sale } from '@/core/domain/sales/types';
import {
  ISaleRepository,
  CreateDirectSaleDTO,
  SaleWithDetails,
} from '@/core/application/ports/ISaleRepository';

export class SupabaseSaleRepository implements ISaleRepository {
  private supabase = createClient();

  async createDirectSale(dto: CreateDirectSaleDTO): Promise<Sale> {
    for (const item of dto.items) {
      const { data: stockRow, error: stockErr } = await this.supabase
        .from('inventory_stock')
        .select('*')
        .eq('company_id', dto.companyId)
        .eq('warehouse_id', dto.warehouseId)
        .eq('product_id', item.productId)
        .single();

      if (stockErr || !stockRow) {
        throw new Error(`El producto "${item.productName}" no tiene registro de stock en este depósito.`);
      }

      const available = Number(stockRow.available_stock);
      if (item.quantity > available) {
        throw new Error(
          `Stock insuficiente para "${item.productName}". Disponible: ${available} un., solicitado: ${item.quantity} un.`
        );
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const saleNumber = `VTA-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const totalAmount = dto.items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const totalCost = dto.items.reduce((acc, it) => acc + it.quantity * it.costPrice, 0);

    const { data: saleData, error: saleErr } = await this.supabase
      .from('sales')
      .insert({
        company_id: dto.companyId,
        warehouse_id: dto.warehouseId,
        customer_id: dto.customerId || null,
        sale_number: saleNumber,
        origin: 'VENTA_DIRECTA_MOSTRADOR',
        payment_method: dto.paymentMethod,
        total_amount: totalAmount,
        total_cost: totalCost,
        notes: dto.notes || `Cliente: ${dto.customerName || 'Consumidor Final'}`,
      })
      .select()
      .single();

    if (saleErr || !saleData) {
      throw new Error(`Error al registrar la venta: ${saleErr?.message}`);
    }

    const saleId = saleData.id;

    for (const item of dto.items) {
      await this.supabase.from('sale_items').insert({
        sale_id: saleId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        historical_cost_price: item.costPrice,
        subtotal: item.quantity * item.unitPrice,
      });

      const { data: currentStock } = await this.supabase
        .from('inventory_stock')
        .select('*')
        .eq('company_id', dto.companyId)
        .eq('warehouse_id', dto.warehouseId)
        .eq('product_id', item.productId)
        .single();

      const newPhysical = Number(currentStock.physical_stock) - item.quantity;
      const reserved = Number(currentStock.reserved_stock);
      const newAvailable = newPhysical - reserved;

      await this.supabase
        .from('inventory_stock')
        .update({
          physical_stock: newPhysical,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentStock.id);

      await this.supabase.from('stock_movements').insert({
        company_id: dto.companyId,
        warehouse_id: dto.warehouseId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        movement_type: 'SALIDA_VENTA',
        quantity: -item.quantity,
        balance_physical_after: newPhysical,
        balance_reserved_after: reserved,
        balance_available_after: newAvailable,
        unit_cost: item.costPrice,
        reference_type: 'SALE',
        reference_id: saleId,
        notes: `Venta Directa de Mostrador #${saleNumber}`,
      });
    }

    return {
      id: saleData.id,
      companyId: saleData.company_id,
      saleNumber: saleData.sale_number,
      origin: saleData.origin,
      customerName: dto.customerName || 'Consumidor Final',
      items: dto.items.map((it, idx) => ({
        id: `${saleId}-${idx}`,
        saleId: saleId,
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        historicalCostPrice: it.costPrice,
        subtotal: it.quantity * it.unitPrice,
      })),
      totalAmount: Number(saleData.total_amount),
      totalCost: Number(saleData.total_cost),
      estimatedGrossMargin: Number(saleData.total_amount) - Number(saleData.total_cost),
      paymentMethod: saleData.payment_method,
      notes: saleData.notes,
      createdAt: saleData.created_at,
    };
  }

  async findRecentSales(companyId: string, limit = 10): Promise<Sale[]> {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row) => this.mapRowToSale(row));
  }

  async findAllSales(companyId: string, options?: { origin?: string }): Promise<SaleWithDetails[]> {
    let query = this.supabase
      .from('sales')
      .select('*, items:sale_items(*, product:products(name)), warehouse:warehouses(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (options?.origin && options.origin !== 'ALL') {
      query = query.eq('origin', options.origin);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row: any) => {
      const amount = Number(row.total_amount);
      const cost = Number(row.total_cost || 0);
      const margin = amount - cost;
      const marginPct = amount > 0 ? (margin / amount) * 100 : 0;

      return {
        ...this.mapRowToSale(row),
        marginPercentage: Math.round(marginPct * 10) / 10,
        warehouseName: row.warehouse?.name || 'Depósito Central',
      };
    });
  }

  async findSaleById(saleId: string): Promise<SaleWithDetails | null> {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*, items:sale_items(*, product:products(name)), warehouse:warehouses(name)')
      .eq('id', saleId)
      .single();

    if (error || !data) return null;

    const amount = Number(data.total_amount);
    const cost = Number(data.total_cost || 0);
    const margin = amount - cost;
    const marginPct = amount > 0 ? (margin / amount) * 100 : 0;

    return {
      ...this.mapRowToSale(data),
      marginPercentage: Math.round(marginPct * 10) / 10,
      warehouseName: data.warehouse?.name || 'Depósito Central',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToSale(row: any): Sale {
    const amount = Number(row.total_amount);
    const cost = Number(row.total_cost || 0);

    return {
      id: row.id,
      companyId: row.company_id,
      saleNumber: row.sale_number,
      origin: row.origin,
      orderId: row.order_id,
      customerId: row.customer_id,
      customerName: row.notes?.replace('Cliente: ', '').replace('Venta procedente de Despacho de Pedido #', 'Pedido #') || 'Consumidor Final',
      items: (row.items || []).map((it: any) => ({
        id: it.id,
        saleId: it.sale_id,
        productId: it.product_id,
        variantId: it.variant_id,
        productName: it.product?.name || 'Producto',
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        historicalCostPrice: Number(it.historical_cost_price),
        subtotal: Number(it.subtotal),
      })),
      totalAmount: amount,
      totalCost: cost,
      estimatedGrossMargin: amount - cost,
      paymentMethod: row.payment_method,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}
