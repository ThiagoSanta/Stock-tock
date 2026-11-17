import { createClient } from '@/utils/supabase/client';
import { StockMovement } from '@/core/domain/inventory/types';
import {
  IInventoryRepository,
  InventoryStockDetailed,
  StockMovementDetailed,
  AdjustStockDTO,
} from '@/core/application/ports/IInventoryRepository';

export class SupabaseInventoryRepository implements IInventoryRepository {
  private supabase = createClient();

  async getStockBalance(companyId: string, warehouseId?: string): Promise<InventoryStockDetailed[]> {
    let query = this.supabase
      .from('inventory_stock')
      .select('*, product:products(*), warehouse:warehouses(name)')
      .eq('company_id', companyId);

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row: any) => {
      const prod = row.product || {};
      const wh = row.warehouse || {};
      const physical = Number(row.physical_stock);
      const reserved = Number(row.reserved_stock);
      const available = Number(row.available_stock);
      const cost = Number(prod.cost_price || 0);

      return {
        id: row.id,
        productId: row.product_id,
        productName: prod.name || 'Producto Desconocido',
        sku: prod.sku || 'S/SKU',
        unitOfMeasure: prod.unit_of_measure || 'UNIDAD',
        costPrice: cost,
        salePrice: Number(prod.sale_price || 0),
        warehouseId: row.warehouse_id,
        warehouseName: wh.name || 'Depósito Central',
        physicalStock: physical,
        reservedStock: reserved,
        availableStock: available,
        minStockAlert: Number(prod.min_stock_alert || 0),
        totalValuation: physical * cost,
      };
    });
  }

  async getKardexMovements(
    companyId: string,
    options?: { limit?: number; type?: string; productId?: string }
  ): Promise<StockMovementDetailed[]> {
    let query = this.supabase
      .from('stock_movements')
      .select('*, product:products(name, sku), warehouse:warehouses(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50);

    if (options?.type && options.type !== 'ALL') {
      query = query.eq('movement_type', options.type);
    }
    if (options?.productId) {
      query = query.eq('product_id', options.productId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      movementType: row.movement_type,
      productId: row.product_id,
      productName: row.product?.name || 'Producto',
      sku: row.product?.sku || '',
      warehouseName: row.warehouse?.name || 'Depósito',
      quantity: Number(row.quantity),
      balancePhysicalAfter: Number(row.balance_physical_after),
      balanceAvailableAfter: Number(row.balance_available_after),
      unitCost: row.unit_cost ? Number(row.unit_cost) : undefined,
      notes: row.notes,
      referenceType: row.reference_type,
    }));
  }

  async adjustStock(dto: AdjustStockDTO): Promise<StockMovement> {
    const { data: stockRow } = await this.supabase
      .from('inventory_stock')
      .select('*')
      .eq('company_id', dto.companyId)
      .eq('warehouse_id', dto.warehouseId)
      .eq('product_id', dto.productId)
      .single();

    const currentPhysical = stockRow ? Number(stockRow.physical_stock) : 0;
    const currentReserved = stockRow ? Number(stockRow.reserved_stock) : 0;

    let newPhysical: number;
    let deltaQty: number;

    if (dto.type === 'SALIDA_AJUSTE') {
      const currentAvailable = currentPhysical - currentReserved;
      if (dto.quantity > currentAvailable) {
        throw new Error(
          `Stock insuficiente para el ajuste negativo. Disponible: ${currentAvailable} un., solicitado a descontar: ${dto.quantity} un.`
        );
      }
      newPhysical = currentPhysical - dto.quantity;
      deltaQty = -dto.quantity;
    } else {
      newPhysical = currentPhysical + dto.quantity;
      deltaQty = dto.quantity;
    }

    const newAvailable = newPhysical - currentReserved;

    // Actualizar o crear saldo
    if (stockRow) {
      await this.supabase
        .from('inventory_stock')
        .update({
          physical_stock: newPhysical,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stockRow.id);
    } else {
      await this.supabase.from('inventory_stock').insert({
        company_id: dto.companyId,
        warehouse_id: dto.warehouseId,
        product_id: dto.productId,
        physical_stock: newPhysical,
        reserved_stock: 0,
      });
    }

    // Obtener costo unitario del producto para registrarlo
    const { data: prod } = await this.supabase
      .from('products')
      .select('cost_price')
      .eq('id', dto.productId)
      .single();

    // Asentar en Kardex inmutable
    const { data: movData, error: movErr } = await this.supabase
      .from('stock_movements')
      .insert({
        company_id: dto.companyId,
        warehouse_id: dto.warehouseId,
        product_id: dto.productId,
        variant_id: dto.variantId || null,
        movement_type: dto.type,
        quantity: deltaQty,
        balance_physical_after: newPhysical,
        balance_reserved_after: currentReserved,
        balance_available_after: newAvailable,
        unit_cost: prod ? Number(prod.cost_price) : 0,
        reference_type: 'MANUAL_ADJUSTMENT',
        notes: dto.reason.trim(),
      })
      .select()
      .single();

    if (movErr || !movData) {
      throw new Error(`Error registrando el movimiento de ajuste: ${movErr?.message}`);
    }

    return {
      id: movData.id,
      companyId: movData.company_id,
      warehouseId: movData.warehouse_id,
      productId: movData.product_id,
      variantId: movData.variant_id,
      type: movData.movement_type,
      quantity: Number(movData.quantity),
      balancePhysicalAfter: Number(movData.balance_physical_after),
      referenceType: 'MANUAL_ADJUSTMENT',
      referenceId: movData.id,
      notes: movData.notes,
      userId: movData.user_id,
      createdAt: movData.created_at,
    };
  }
}
