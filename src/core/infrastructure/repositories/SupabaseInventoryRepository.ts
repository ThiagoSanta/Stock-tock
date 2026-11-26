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
    const { data: movId, error: rpcErr } = await this.supabase.rpc('rpc_adjust_stock', {
      p_company_id: dto.companyId,
      p_warehouse_id: dto.warehouseId,
      p_product_id: dto.productId,
      p_variant_id: dto.variantId || null,
      p_type: dto.type,
      p_quantity: dto.quantity,
      p_reason: dto.reason.trim(),
    });

    if (rpcErr || !movId) {
      throw new Error(rpcErr?.message || 'Error al registrar el ajuste de stock.');
    }

    const { data: movData, error: movErr } = await this.supabase
      .from('stock_movements')
      .select('*')
      .eq('id', movId)
      .single();

    if (movErr || !movData) {
      throw new Error(`Error consultando el movimiento registrado: ${movErr?.message}`);
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

  async transferStock(dto: import('@/core/application/ports/IInventoryRepository').TransferStockDTO): Promise<import('@/core/application/ports/IInventoryRepository').TransferStockResult> {
    const { data, error } = await this.supabase.rpc('rpc_transfer_stock', {
      p_company_id: dto.companyId,
      p_origin_warehouse_id: dto.originWarehouseId,
      p_destination_warehouse_id: dto.destinationWarehouseId,
      p_product_id: dto.productId,
      p_variant_id: dto.variantId || null,
      p_quantity: dto.quantity,
      p_reason: dto.reason?.trim() || null,
    });

    if (error || !data) {
      throw new Error(error?.message || 'Error al ejecutar la transferencia entre depósitos.');
    }

    return {
      transferNumber: data.transferNumber,
      productId: dto.productId,
      quantity: dto.quantity,
      originWarehouseId: dto.originWarehouseId,
      destinationWarehouseId: dto.destinationWarehouseId,
      createdAt: data.createdAt || new Date().toISOString(),
    };
  }
}
