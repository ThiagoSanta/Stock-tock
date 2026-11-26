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
    const { data: saleData, error: rpcErr } = await this.supabase.rpc('rpc_process_direct_sale', {
      p_company_id: dto.companyId,
      p_warehouse_id: dto.warehouseId,
      p_customer_id: dto.customerId || null,
      p_customer_name: dto.customerName || 'Consumidor Final',
      p_payment_method: dto.paymentMethod,
      p_notes: dto.notes || null,
      p_items: dto.items.map((it) => ({
        productId: it.productId,
        variantId: it.variantId || null,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        costPrice: it.costPrice,
      })),
    });

    if (rpcErr || !saleData) {
      throw new Error(rpcErr?.message || 'Error al registrar la venta.');
    }

    const saleId = saleData.id as string;

    return {
      id: saleId,
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
      notes: dto.notes || undefined,
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
      .select('*, items:sale_items(*, product:products(name)), warehouse:warehouses(name), customer:customers(name)')
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
        warehouseId: row.warehouse_id,
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
      warehouseId: data.warehouse_id,
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
      customerName:
        row.customer?.name ||
        row.notes?.replace('Cliente: ', '').replace('Venta procedente de Despacho de Pedido #', 'Pedido #') ||
        'Consumidor Final',
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
