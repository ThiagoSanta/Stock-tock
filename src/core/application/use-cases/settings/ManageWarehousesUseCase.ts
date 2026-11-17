import { ISettingsRepository } from '@/core/application/ports/ISettingsRepository';
import { WarehouseSettings } from '@/core/domain/settings/types';

export interface CreateWarehouseDTO {
  companyId: string;
  name: string;
  code: string;
  address?: string;
  isDefault?: boolean;
}

export class ManageWarehousesUseCase {
  constructor(private settingsRepo: ISettingsRepository) {}

  async create(dto: CreateWarehouseDTO): Promise<WarehouseSettings> {
    if (!dto.name || !dto.code) {
      throw new Error('El nombre y código del depósito son obligatorios.');
    }

    return this.settingsRepo.createWarehouse({
      companyId: dto.companyId,
      name: dto.name.trim(),
      code: dto.code.trim().toUpperCase(),
      address: dto.address?.trim() || undefined,
      isDefault: dto.isDefault ?? false,
      active: true,
    });
  }

  async setDefault(companyId: string, warehouseId: string): Promise<void> {
    return this.settingsRepo.setDefaultWarehouse(companyId, warehouseId);
  }
}
