import { ISettingsRepository } from '@/core/application/ports/ISettingsRepository';
import { CompanySettings, WarehouseSettings } from '@/core/domain/settings/types';

export class GetCompanySettingsUseCase {
  constructor(private settingsRepo: ISettingsRepository) {}

  async execute(): Promise<{ company: CompanySettings; warehouses: WarehouseSettings[] }> {
    const company = await this.settingsRepo.getCompany();
    const warehouses = await this.settingsRepo.getWarehouses(company.id);
    return { company, warehouses };
  }
}
