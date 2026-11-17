import { createClient } from '@/utils/supabase/client';
import { Purchase, Supplier, PurchaseStatus } from '@/core/domain/purchases/types';
import {
  IPurchaseRepository,
  CreatePurchaseDTO,
  CreateSupplierDTO,
} from '@/core/application/ports/IPurchaseRepository';

export class SupabasePurchaseRepository implements IPurchaseRepository {
  private supabase = createClient();

  async createPurchase(dto: CreatePurchaseDTO): Promise<Purchase> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const purchaseNumber = `COM-${Date.now().toString().slice(-4)}${randomSuffix}`;
    const totalAmount = dto.items.reduce((acc, it) => acc + it.quantityOrdered * it.unitCost, 0);

    const { data: purchaseData, error: pErr } = await this.supabase
      .from('purchases')
      .insert({
        company_id: dto.companyId,
        warehouse_id: dto.warehouseId,
        supplier_id: dto.supplierId || null,
        purchase_number: purchaseNumber,
        status: 'EMITIDA',
        total_amount: totalAmount,
        notes: dto.notes || `Proveedor: ${dto.supplierName}`,
      })
      .select()
      .single();

    if (pErr || !purchaseData) {
      throw new Error(`Error al emitir orden de compra: ${pErr?.message}`);
    }

    const purchaseId = purchaseData.id;

    for (const item of dto.items) {
      await this.supabase.from('purchase_items').insert({
        purchase_id: purchaseId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity_ordered: item.quantityOrdered,
        quantity_received: 0,
        unit_cost: item.unitCost,
        subtotal: item.quantityOrdered * item.unitCost,
      });
    }

    return (await this.findById(purchaseId)) as Purchase;
  }

  async receivePurchase(purchaseId: string, companyId: string): Promise<Purchase> {
    const purchase = await this.findById(purchaseId);
    if (!purchase) throw new Error('Orden de compra no encontrada.');
    if (purchase.status !== 'EMITIDA' && purchase.status !== 'BORRADOR') {
      throw new Error(`La compra ya se encuentra en estado ${purchase.status}.`);
    }

    for (const item of purchase.items) {
      // 1. Obtener datos actuales del producto (costo promedio actual)
      const { data: prodData } = await this.supabase
        .from('products')
        .select('cost_price')
        .eq('id', item.productId)
        .single();

      const currentCost = Number(prodData?.cost_price || 0);

      // 2. Obtener existencias actuales en el depósito
      const { data: stockRow } = await this.supabase
        .from('inventory_stock')
        .select('*')
        .eq('company_id', companyId)
        .eq('warehouse_id', purchase.warehouseId)
        .eq('product_id', item.productId)
        .single();

      const currentPhysical = stockRow ? Number(stockRow.physical_stock) : 0;
      const currentReserved = stockRow ? Number(stockRow.reserved_stock) : 0;

      const newQty = item.quantityOrdered;
      const newCost = item.unitCost;

      // 3. Fórmula del Costo Promedio Ponderado (PPP)
      const totalUnits = currentPhysical + newQty;
      const weightedCost =
        totalUnits > 0
          ? ((currentPhysical * currentCost) + (newQty * newCost)) / totalUnits
          : newCost;

      const roundedPPP = Math.round(weightedCost * 100) / 100;

      // 4. Actualizar costo promedio ponderado en catálogo
      await this.supabase
        .from('products')
        .update({
          cost_price: roundedPPP,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.productId);

      // 5. Incrementar inventario físico
      const updatedPhysical = currentPhysical + newQty;
      const updatedAvailable = updatedPhysical - currentReserved;

      if (stockRow) {
        await this.supabase
          .from('inventory_stock')
          .update({
            physical_stock: updatedPhysical,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stockRow.id);
      } else {
        await this.supabase.from('inventory_stock').insert({
          company_id: companyId,
          warehouse_id: purchase.warehouseId,
          product_id: item.productId,
          physical_stock: updatedPhysical,
          reserved_stock: 0,
        });
      }

      // 6. Asentar en Kardex inmutable
      await this.supabase.from('stock_movements').insert({
        company_id: companyId,
        warehouse_id: purchase.warehouseId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        movement_type: 'INGRESO_COMPRA',
        quantity: newQty,
        balance_physical_after: updatedPhysical,
        balance_reserved_after: currentReserved,
        balance_available_after: updatedAvailable,
        unit_cost: newCost,
        reference_type: 'PURCHASE',
        reference_id: purchaseId,
        notes: `Recepción Orden #${purchase.purchaseNumber}. Nuevo costo PPP: $${roundedPPP}`,
      });

      // 7. Actualizar ítems recibidos
      await this.supabase
        .from('purchase_items')
        .update({ quantity_received: newQty })
        .eq('id', item.id);
    }

    // 8. Marcar compra como RECEPCION_TOTAL
    await this.supabase
      .from('purchases')
      .update({
        status: 'RECEPCION_TOTAL',
        received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchaseId);

    return (await this.findById(purchaseId)) as Purchase;
  }

  async findPurchases(companyId: string, status?: PurchaseStatus): Promise<Purchase[]> {
    let query = this.supabase
      .from('purchases')
      .select('*, items:purchase_items(*, product:products(name))')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => this.mapRowToPurchase(row));
  }

  async findById(purchaseId: string): Promise<Purchase | null> {
    const { data, error } = await this.supabase
      .from('purchases')
      .select('*, items:purchase_items(*, product:products(name))')
      .eq('id', purchaseId)
      .single();

    if (error || !data) return null;
    return this.mapRowToPurchase(data);
  }

  async findSuppliers(companyId: string): Promise<Supplier[]> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      taxId: row.tax_id,
      contactName: row.contact_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      active: row.active,
      createdAt: row.created_at,
    }));
  }

  async createSupplier(dto: CreateSupplierDTO): Promise<Supplier> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .insert({
        company_id: dto.companyId,
        name: dto.name.trim(),
        tax_id: dto.taxId?.trim() || null,
        contact_name: dto.contactName?.trim() || null,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
      })
      .select()
      .single();

    if (error || !data) throw new Error(`Error al crear proveedor: ${error?.message}`);

    return {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      taxId: data.tax_id,
      contactName: data.contact_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      active: data.active,
      createdAt: data.created_at,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToPurchase(row: any): Purchase {
    return {
      id: row.id,
      companyId: row.company_id,
      warehouseId: row.warehouse_id,
      purchaseNumber: row.purchase_number,
      supplierId: row.supplier_id,
      supplierName: row.notes?.replace('Proveedor: ', '') || 'Proveedor Genérico',
      status: row.status,
      items: (row.items || []).map((it: any) => ({
        id: it.id,
        purchaseId: it.purchase_id,
        productId: it.product_id,
        variantId: it.variant_id,
        productName: it.product?.name || 'Producto',
        quantityOrdered: Number(it.quantity_ordered),
        quantityReceived: Number(it.quantity_received || 0),
        unitCost: Number(it.unit_cost),
        subtotal: Number(it.subtotal),
      })),
      totalAmount: Number(row.total_amount),
      notes: row.notes,
      receivedAt: row.received_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
