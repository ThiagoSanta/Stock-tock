import { ISettingsRepository } from '@/core/application/ports/ISettingsRepository';
import { CompanySettings } from '@/core/domain/settings/types';

export interface UpdateCompanyDTO {
  id: string;
  name: string;
  taxId?: string;
  logoUrl?: string;
}

export class UpdateCompanySettingsUseCase {
  constructor(private settingsRepo: ISettingsRepository) {}

  async execute(dto: UpdateCompanyDTO): Promise<CompanySettings> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('El nombre de la empresa no puede estar vacío.');
    }

    return this.settingsRepo.updateCompany(dto.id, {
      name: dto.name.trim(),
      taxId: dto.taxId?.trim() || undefined,
      logoUrl: dto.logoUrl?.trim() || undefined,
    });
  }
}
