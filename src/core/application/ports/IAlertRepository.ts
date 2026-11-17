import { SystemAlert, InventoryExportRow } from '@/core/domain/alerts/types';

export interface IAlertRepository {
  getSystemAlerts(companyId: string): Promise<SystemAlert[]>;
  getInventoryExportData(companyId: string): Promise<InventoryExportRow[]>;
}
