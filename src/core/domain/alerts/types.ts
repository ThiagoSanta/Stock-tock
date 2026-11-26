/**
 * Dominio: Alertas Operativas y Reportes de Auditoría
 */

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type AlertType =
  | 'STOCK_OUT'
  | 'LOW_STOCK'
  | 'OVER_STOCK'
  | 'PENDING_ORDER_RESERVATION';

export interface SystemAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  warehouseName?: string;
  productId?: string;
  productName?: string;
  orderId?: string;
  orderNumber?: string;
  actionUrl: string;
  actionLabel: string;
  createdAt: string;
}

export interface InventoryExportRow {
  productId: string;
  sku: string;
  productName: string;
  warehouseName: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  minStockAlert: number;
  costPrice: number;
  salePrice: number;
  totalValuation: number;
  status: 'QUIEBRE' | 'BAJO_STOCK' | 'SOBRESTOCK' | 'OPTIMO';
}
