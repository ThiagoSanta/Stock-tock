import { CompanySettings, WarehouseSettings } from '@/core/domain/settings/types';

export interface ISettingsRepository {
  getCompany(id?: string): Promise<CompanySettings>;
  updateCompany(id: string, data: Partial<Omit<CompanySettings, 'id' | 'updatedAt'>>): Promise<CompanySettings>;
  getWarehouses(companyId: string): Promise<WarehouseSettings[]>;
  createWarehouse(data: Omit<WarehouseSettings, 'id' | 'createdAt'>): Promise<WarehouseSettings>;
  setDefaultWarehouse(companyId: string, warehouseId: string): Promise<void>;
}
