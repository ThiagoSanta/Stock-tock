import { createClient } from '@/utils/supabase/client';
import { ISettingsRepository } from '@/core/application/ports/ISettingsRepository';
import { CompanySettings, WarehouseSettings } from '@/core/domain/settings/types';

export class SupabaseSettingsRepository implements ISettingsRepository {
  private supabase = createClient();

  async getCompany(id?: string): Promise<CompanySettings> {
    let query = this.supabase.from('companies').select('*');
    if (id) {
      query = query.eq('id', id);
    }
    const { data, error } = await query.limit(1).single();
    if (error || !data) throw new Error('No se pudo cargar la configuración de la empresa.');

    return {
      id: data.id,
      name: data.name,
      taxId: data.tax_id || undefined,
      primaryCurrency: data.primary_currency,
      logoUrl: data.logo_url || undefined,
      updatedAt: data.updated_at,
    };
  }

  async updateCompany(
    id: string,
    data: Partial<Omit<CompanySettings, 'id' | 'updatedAt'>>
  ): Promise<CompanySettings> {
    const { data: updated, error } = await this.supabase
      .from('companies')
      .update({
        name: data.name,
        tax_id: data.taxId || null,
        logo_url: data.logoUrl || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: updated.id,
      name: updated.name,
      taxId: updated.tax_id || undefined,
      primaryCurrency: updated.primary_currency,
      logoUrl: updated.logo_url || undefined,
      updatedAt: updated.updated_at,
    };
  }

  async getWarehouses(companyId: string): Promise<WarehouseSettings[]> {
    const { data, error } = await this.supabase
      .from('warehouses')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((w: any) => ({
      id: w.id,
      companyId: w.company_id,
      name: w.name,
      code: w.code,
      address: w.address || undefined,
      isDefault: w.is_default,
      active: w.active,
      createdAt: w.created_at,
    }));
  }

  async createWarehouse(
    data: Omit<WarehouseSettings, 'id' | 'createdAt'>
  ): Promise<WarehouseSettings> {
    if (data.isDefault) {
      await this.supabase
        .from('warehouses')
        .update({ is_default: false })
        .eq('company_id', data.companyId);
    }

    const { data: created, error } = await this.supabase
      .from('warehouses')
      .insert({
        company_id: data.companyId,
        name: data.name,
        code: data.code,
        address: data.address || null,
        is_default: data.isDefault,
        active: data.active,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: created.id,
      companyId: created.company_id,
      name: created.name,
      code: created.code,
      address: created.address || undefined,
      isDefault: created.is_default,
      active: created.active,
      createdAt: created.created_at,
    };
  }

  async setDefaultWarehouse(companyId: string, warehouseId: string): Promise<void> {
    // 1. Quitar default a todos
    await this.supabase
      .from('warehouses')
      .update({ is_default: false })
      .eq('company_id', companyId);

    // 2. Asignar default al seleccionado
    const { error } = await this.supabase
      .from('warehouses')
      .update({ is_default: true })
      .eq('id', warehouseId);

    if (error) throw new Error(error.message);
  }
}
