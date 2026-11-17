import { createClient } from '@/utils/supabase/client';
import { Sale } from '@/core/domain/sales/types';
import { ISaleRepository, CreateDirectSaleDTO } from '@/core/application/ports/ISaleRepository';

export class SupabaseSaleRepository implements ISaleRepository {
  private supabase = createClient();

  async createDirectSale(dto: CreateDirectSaleDTO): Promise<Sale> {
    // 1. Validar disponibilidad de stock de cada ítem antes de ejecutar la venta
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

    // 2. Generar número de venta único
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const saleNumber = `VTA-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const totalAmount = dto.items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const totalCost = dto.items.reduce((acc, it) => acc + it.quantity * it.costPrice, 0);

    // 3. Insertar la venta
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

    // 4. Procesar cada ítem (Guardar histórico, descontar stock físico y asentar Kardex)
    for (const item of dto.items) {
      // 4.1. Insertar ítem de venta
      await this.supabase.from('sale_items').insert({
        sale_id: saleId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        historical_cost_price: item.costPrice,
        subtotal: item.quantity * item.unitPrice,
      });

      // 4.2. Obtener saldo actual para descontar
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

      // 4.3. Actualizar stock físico (la BD tiene CHECK para evitar negativos)
      const { error: updErr } = await this.supabase
        .from('inventory_stock')
        .update({
          physical_stock: newPhysical,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentStock.id);

      if (updErr) {
        throw new Error(`Error actualizando inventario: ${updErr.message}`);
      }

      // 4.4. Asentar en Kardex inmutable
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

    return data.map((row) => ({
      id: row.id,
      companyId: row.company_id,
      saleNumber: row.sale_number,
      origin: row.origin,
      customerName: row.notes?.replace('Cliente: ', '') || 'Consumidor Final',
      items: [],
      totalAmount: Number(row.total_amount),
      totalCost: Number(row.total_cost),
      estimatedGrossMargin: Number(row.estimated_gross_margin || 0),
      paymentMethod: row.payment_method,
      notes: row.notes,
      createdAt: row.created_at,
    }));
  }
}
