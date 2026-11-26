import { IAlertRepository } from '@/core/application/ports/IAlertRepository';
import { InventoryExportRow } from '@/core/domain/alerts/types';

export class ExportInventoryReportUseCase {
  constructor(private alertRepo: IAlertRepository) {}

  async getExportData(companyId: string): Promise<InventoryExportRow[]> {
    return this.alertRepo.getInventoryExportData(companyId);
  }

  generateCSV(rows: InventoryExportRow[]): string {
    const headers = [
      'SKU',
      'Producto',
      'Deposito',
      'Stock Fisico',
      'Stock Reservado',
      'Stock Disponible',
      'Alerta Minimo',
      'Costo PPP (ARS)',
      'Precio Venta (ARS)',
      'Valuacion Total (ARS)',
      'Estado Stock',
    ];

    const sanitizeCell = (value: string): string => {
      const escaped = value.replace(/"/g, '""');
      // Neutralizar CSV Formula Injection (=, +, -, @, tab, CR)
      const safe = /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped;
      return `"${safe}"`;
    };

    const lines = rows.map((r) => [
      sanitizeCell(r.sku),
      sanitizeCell(r.productName),
      sanitizeCell(r.warehouseName),
      r.physicalStock,
      r.reservedStock,
      r.availableStock,
      r.minStockAlert,
      r.costPrice.toFixed(2),
      r.salePrice.toFixed(2),
      r.totalValuation.toFixed(2),
      sanitizeCell(r.status),
    ].join(';'));

    return [headers.join(';'), ...lines].join('\r\n');
  }
}
