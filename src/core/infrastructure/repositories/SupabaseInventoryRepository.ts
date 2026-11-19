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

  async transferStock(dto: import('@/core/application/ports/IInventoryRepository').TransferStockDTO): Promise<import('@/core/application/ports/IInventoryRepository').TransferStockResult> {
    const transferNumber = `TRF-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Obtener nombres de los depósitos para la auditoría
    const { data: warehouses } = await this.supabase
      .from('warehouses')
      .select('id, name')
      .in('id', [dto.originWarehouseId, dto.destinationWarehouseId]);

    const originWh = warehouses?.find((w) => w.id === dto.originWarehouseId);
    const destWh = warehouses?.find((w) => w.id === dto.destinationWarehouseId);
    const originName = originWh?.name || 'Depósito Origen';
    const destName = destWh?.name || 'Depósito Destino';

    // 2. Verificar existencia y stock disponible en depósito origen
    const { data: originStock } = await this.supabase
      .from('inventory_stock')
      .select('id, physical_stock, reserved_stock, available_stock')
      .eq('company_id', dto.companyId)
      .eq('warehouse_id', dto.originWarehouseId)
      .eq('product_id', dto.productId)
      .maybeSingle();

    const originPhysical = Number(originStock?.physical_stock || 0);
    const originReserved = Number(originStock?.reserved_stock || 0);
    const originAvailable = Number(originStock?.available_stock ?? (originPhysical - originReserved));

    if (originAvailable < dto.quantity) {
      throw new Error(
        `Stock disponible insuficiente en ${originName}. Disponible: ${originAvailable} un., requerido transferir: ${dto.quantity} un.`
      );
    }

    // 3. Obtener costo del producto para auditoría en Kardex
    const { data: prod } = await this.supabase
      .from('products')
      .select('cost_price, name')
      .eq('id', dto.productId)
      .single();

    const unitCost = prod ? Number(prod.cost_price) : 0;
    const prodName = prod?.name || 'Producto';

    // 4. Actualizar depósito origen (Descontar físico)
    const newOriginPhysical = originPhysical - dto.quantity;
    const newOriginAvailable = newOriginPhysical - originReserved;

    if (originStock) {
      await this.supabase
        .from('inventory_stock')
        .update({
          physical_stock: newOriginPhysical,
          updated_at: new Date().toISOString(),
        })
        .eq('id', originStock.id);
    }

    // 5. Asentar movimiento de SALIDA en el Kardex del origen
    await this.supabase.from('stock_movements').insert({
      company_id: dto.companyId,
      warehouse_id: dto.originWarehouseId,
      product_id: dto.productId,
      variant_id: dto.variantId || null,
      movement_type: 'TRANSFERENCIA_SALIDA',
      quantity: -dto.quantity,
      balance_physical_after: newOriginPhysical,
      balance_reserved_after: originReserved,
      balance_available_after: newOriginAvailable,
      unit_cost: unitCost,
      reference_type: 'INTERNAL_TRANSFER',
      reference_id: transferNumber,
      notes: dto.reason?.trim()
        ? `${dto.reason.trim()} (Hacia ${destName})`
        : `Transferencia hacia ${destName}`,
    });

    // 6. Actualizar depósito destino (Incrementar físico)
    const { data: destStock } = await this.supabase
      .from('inventory_stock')
      .select('id, physical_stock, reserved_stock')
      .eq('company_id', dto.companyId)
      .eq('warehouse_id', dto.destinationWarehouseId)
      .eq('product_id', dto.productId)
      .maybeSingle();

    const destCurrentPhysical = Number(destStock?.physical_stock || 0);
    const destCurrentReserved = Number(destStock?.reserved_stock || 0);
    const newDestPhysical = destCurrentPhysical + dto.quantity;
    const newDestAvailable = newDestPhysical - destCurrentReserved;

    if (destStock) {
      await this.supabase
        .from('inventory_stock')
        .update({
          physical_stock: newDestPhysical,
          updated_at: new Date().toISOString(),
        })
        .eq('id', destStock.id);
    } else {
      await this.supabase.from('inventory_stock').insert({
        company_id: dto.companyId,
        warehouse_id: dto.destinationWarehouseId,
        product_id: dto.productId,
        physical_stock: newDestPhysical,
        reserved_stock: 0,
      });
    }

    // 7. Asentar movimiento de ENTRADA en el Kardex del destino
    await this.supabase.from('stock_movements').insert({
      company_id: dto.companyId,
      warehouse_id: dto.destinationWarehouseId,
      product_id: dto.productId,
      variant_id: dto.variantId || null,
      movement_type: 'TRANSFERENCIA_ENTRADA',
      quantity: dto.quantity,
      balance_physical_after: newDestPhysical,
      balance_reserved_after: destCurrentReserved,
      balance_available_after: newDestAvailable,
      unit_cost: unitCost,
      reference_type: 'INTERNAL_TRANSFER',
      reference_id: transferNumber,
      notes: dto.reason?.trim()
        ? `${dto.reason.trim()} (Desde ${originName})`
        : `Recepción desde ${originName}`,
    });

    return {
      transferNumber,
      productId: dto.productId,
      quantity: dto.quantity,
      originWarehouseId: dto.originWarehouseId,
      destinationWarehouseId: dto.destinationWarehouseId,
      createdAt: new Date().toISOString(),
    };
  }
}
