import { createClient } from '@/utils/supabase/client';
import { Product } from '@/core/domain/catalog/types';
import {
  IProductRepository,
  ProductWithStock,
  CreateProductWithStockDTO,
} from '@/core/application/ports/IProductRepository';

export class SupabaseProductRepository implements IProductRepository {
  private supabase = createClient();

  async findAll(companyId: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }

    return (data || []).map((row) => this.mapRowToProduct(row));
  }

  async findAllWithStock(companyId: string): Promise<ProductWithStock[]> {
    const { data: prods, error: pErr } = await this.supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (pErr) throw new Error(pErr.message);

    const { data: stocks, error: sErr } = await this.supabase
      .from('inventory_stock')
      .select('*')
      .eq('company_id', companyId);

    if (sErr) throw new Error(sErr.message);

    const stockMap = new Map<string, { physical: number; reserved: number; available: number; warehouseId: string }>();
    for (const s of stocks || []) {
      const prev = stockMap.get(s.product_id) || {
        physical: 0,
        reserved: 0,
        available: 0,
        warehouseId: s.warehouse_id || '',
      };
      prev.physical += Number(s.physical_stock || 0);
      prev.reserved += Number(s.reserved_stock || 0);
      prev.available += Number(s.available_stock || 0);
      if (!prev.warehouseId && s.warehouse_id) prev.warehouseId = s.warehouse_id;
      stockMap.set(s.product_id, prev);
    }

    return (prods || []).map((prod) => {
      const agg = stockMap.get(prod.id);
      return {
        ...this.mapRowToProduct(prod),
        physicalStock: agg ? agg.physical : 0,
        reservedStock: agg ? agg.reserved : 0,
        availableStock: agg ? agg.available : 0,
        warehouseId: agg ? agg.warehouseId : '',
      };
    });
  }

  async getProductsWithStock(companyId: string): Promise<ProductWithStock[]> {
    return this.findAllWithStock(companyId);
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapRowToProduct(data);
  }

  async create(dto: CreateProductWithStockDTO): Promise<Product> {
    // 1. Obtener el depósito por defecto si no se especificó uno
    let warehouseId = dto.warehouseId;
    if (!warehouseId) {
      const { data: wh } = await this.supabase
        .from('warehouses')
        .select('id')
        .eq('company_id', dto.companyId)
        .eq('is_default', true)
        .single();

      warehouseId = wh?.id;
    }

    // 2. Insertar el producto
    const { data: productData, error: prodErr } = await this.supabase
      .from('products')
      .insert({
        company_id: dto.companyId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        sku: dto.sku.trim().toUpperCase(),
        barcode: dto.barcode?.trim() || null,
        unit_of_measure: dto.unitOfMeasure,
        cost_price: dto.costPrice,
        sale_price: dto.salePrice,
        wholesale_price: dto.wholesalePrice ?? null,
        special_price: dto.specialPrice ?? null,
        min_stock_alert: dto.minStockAlert,
        storage_location: dto.storageLocation?.trim() || null,
        tracks_lots_and_expiry: dto.tracksLotsAndExpiry ?? false,
      })
      .select()
      .single();

    if (prodErr) throw new Error(`Error al crear producto: ${prodErr.message}`);

    const newProductId = productData.id;
    const initialQty = dto.initialStock ?? 0;

    // 3. Crear el registro en inventory_stock
    if (warehouseId) {
      const { error: stockErr } = await this.supabase
        .from('inventory_stock')
        .insert({
          company_id: dto.companyId,
          warehouse_id: warehouseId,
          product_id: newProductId,
          physical_stock: initialQty,
          reserved_stock: 0,
        });

      if (stockErr) console.error('Error inicializando stock:', stockErr);

      // 4. Registrar movimiento en Kardex si hubo stock inicial
      if (initialQty > 0) {
        await this.supabase.from('stock_movements').insert({
          company_id: dto.companyId,
          warehouse_id: warehouseId,
          product_id: newProductId,
          movement_type: 'INGRESO_AJUSTE',
          quantity: initialQty,
          balance_physical_after: initialQty,
          balance_reserved_after: 0,
          balance_available_after: initialQty,
          unit_cost: dto.costPrice,
          notes: 'Inventario inicial al dar de alta el producto',
        });
      }
    }

    return this.mapRowToProduct(productData);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      companyId: row.company_id,
      categoryId: row.category_id,
      name: row.name,
      description: row.description,
      sku: row.sku,
      barcode: row.barcode,
      unitOfMeasure: row.unit_of_measure,
      costPrice: Number(row.cost_price),
      salePrice: Number(row.sale_price),
      wholesalePrice: row.wholesale_price ? Number(row.wholesale_price) : undefined,
      specialPrice: row.special_price ? Number(row.special_price) : undefined,
      minStockAlert: Number(row.min_stock_alert),
      maxStock: row.max_stock ? Number(row.max_stock) : undefined,
      storageLocation: row.storage_location || undefined,
      tracksLotsAndExpiry: row.tracks_lots_and_expiry,
      hasVariants: row.has_variants,
      imageUrl: row.image_url,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
