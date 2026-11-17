import { IAlertRepository } from '@/core/application/ports/IAlertRepository';
import { SystemAlert } from '@/core/domain/alerts/types';

export class GetSystemAlertsUseCase {
  constructor(private alertRepo: IAlertRepository) {}

  async execute(companyId: string): Promise<SystemAlert[]> {
    return this.alertRepo.getSystemAlerts(companyId);
  }
}
