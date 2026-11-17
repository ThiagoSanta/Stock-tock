import { createClient } from '@/utils/supabase/client';
import { Product } from '@/core/domain/catalog/types';
import { IProductRepository, CreateProductDTO } from '@/core/application/ports/IProductRepository';

export class SupabaseProductRepository implements IProductRepository {
  private supabase = createClient();

  async findAll(companyId: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(`Error al obtener productos: ${error.message}`);
    }

    return (data || []).map((row) => ({
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
      minStockAlert: Number(row.min_stock_alert),
      maxStock: row.max_stock ? Number(row.max_stock) : undefined,
      tracksLotsAndExpiry: row.tracks_lots_and_expiry,
      hasVariants: row.has_variants,
      imageUrl: row.image_url,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      companyId: data.company_id,
      categoryId: data.category_id,
      name: data.name,
      description: data.description,
      sku: data.sku,
      barcode: data.barcode,
      unitOfMeasure: data.unit_of_measure,
      costPrice: Number(data.cost_price),
      salePrice: Number(data.sale_price),
      wholesalePrice: data.wholesale_price ? Number(data.wholesale_price) : undefined,
      minStockAlert: Number(data.min_stock_alert),
      maxStock: data.max_stock ? Number(data.max_stock) : undefined,
      tracksLotsAndExpiry: data.tracks_lots_and_expiry,
      hasVariants: data.has_variants,
      imageUrl: data.image_url,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async create(dto: CreateProductDTO): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .insert({
        company_id: dto.companyId,
        name: dto.name,
        description: dto.description,
        sku: dto.sku,
        barcode: dto.barcode,
        unit_of_measure: dto.unitOfMeasure,
        cost_price: dto.costPrice,
        sale_price: dto.salePrice,
        min_stock_alert: dto.minStockAlert,
        tracks_lots_and_expiry: dto.tracksLotsAndExpiry ?? false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }

    return this.findById(data.id) as Promise<Product>;
  }
}
