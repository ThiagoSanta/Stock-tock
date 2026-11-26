import { createClient } from '@/utils/supabase/client';
import { IAlertRepository } from '@/core/application/ports/IAlertRepository';
import { SystemAlert, InventoryExportRow } from '@/core/domain/alerts/types';

export class SupabaseAlertRepository implements IAlertRepository {
  private supabase = createClient();

  async getSystemAlerts(companyId: string): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    // 1. Quiebres y Alertas de Stock Mínimo/Sobrestock
    const { data: stockRows, error: stockErr } = await this.supabase
      .from('inventory_stock')
      .select(`
        id,
        physical_stock,
        reserved_stock,
        available_stock,
        products (
          id,
          name,
          sku,
          min_stock_alert,
          max_stock
        ),
        warehouses (
          id,
          name
        )
      `)
      .eq('company_id', companyId);

    if (stockErr) console.error('Error fetching inventory for alerts:', stockErr);

    (stockRows || []).forEach((row: any) => {
      const prod = row.products;
      const wh = row.warehouses;
      if (!prod || !wh) return;

      const available = Number(row.available_stock || 0);
      const physical = Number(row.physical_stock || 0);
      const minAlert = Number(prod.min_stock_alert || 0);
      const maxStock = prod.max_stock ? Number(prod.max_stock) : null;

      if (available <= 0) {
        alerts.push({
          id: `out-${row.id}`,
          type: 'STOCK_OUT',
          severity: 'CRITICAL',
          title: `Quiebre de stock: ${prod.name}`,
          description: `El stock disponible en ${wh.name} es de 0 unidades (${row.reserved_stock} un. reservadas). No se pueden emitir nuevas ventas.`,
          warehouseName: wh.name,
          productId: prod.id,
          productName: prod.name,
          actionUrl: '/compras',
          actionLabel: 'Crear Orden de Compra',
          createdAt: new Date().toISOString(),
        });
      } else if (minAlert > 0 && available <= minAlert) {
        alerts.push({
          id: `low-${row.id}`,
          type: 'LOW_STOCK',
          severity: 'WARNING',
          title: `Stock por debajo del mínimo: ${prod.name}`,
          description: `Disponible: ${available} un. (umbral mínimo configurado: ${minAlert} un.) en ${wh.name}.`,
          warehouseName: wh.name,
          productId: prod.id,
          productName: prod.name,
          actionUrl: '/compras',
          actionLabel: 'Reabastecer',
          createdAt: new Date().toISOString(),
        });
      }

      if (maxStock !== null && physical > maxStock) {
        alerts.push({
          id: `over-${row.id}`,
          type: 'OVER_STOCK',
          severity: 'INFO',
          title: `Sobrestock detectado: ${prod.name}`,
          description: `Stock físico (${physical} un.) supera la capacidad máxima recomendada (${maxStock} un.) en ${wh.name}.`,
          warehouseName: wh.name,
          productId: prod.id,
          productName: prod.name,
          actionUrl: '/inventario',
          actionLabel: 'Revisar Inventario',
          createdAt: new Date().toISOString(),
        });
      }
    });

    // 2. Pedidos confirmados pendientes de despacho (Regla MANUAL de reserva)
    const { data: pendingOrders, error: orderErr } = await this.supabase
      .from('orders')
      .select('id, order_number, confirmed_at, total_amount, warehouses(name), customers(name)')
      .eq('company_id', companyId)
      .eq('status', 'CONFIRMADO');

    if (orderErr) console.error('Error fetching pending orders for alerts:', orderErr);

    (pendingOrders || []).forEach((ord: any) => {
      const confirmedDate = ord.confirmed_at ? new Date(ord.confirmed_at) : new Date();
      const hoursPending = Math.round((Date.now() - confirmedDate.getTime()) / (1000 * 60 * 60));
      const customerName = ord.customers?.name || 'Cliente sin nombre';
      const whName = ord.warehouses?.name || 'Depósito';

      alerts.push({
        id: `ord-${ord.id}`,
        type: 'PENDING_ORDER_RESERVATION',
        severity: hoursPending > 24 ? 'CRITICAL' : 'WARNING',
        title: `Pedido ${ord.order_number} reteniendo stock reservado`,
        description: `Confirmado para ${customerName} hace ${hoursPending} horas en ${whName}. Recuerde que la reserva no se libera automáticamente (Regla MANUAL).`,
        orderId: ord.id,
        orderNumber: ord.order_number,
        actionUrl: '/pedidos',
        actionLabel: 'Despachar o Cancelar',
        createdAt: ord.confirmed_at || new Date().toISOString(),
      });
    });

    return alerts.sort((a, b) => {
      const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
      return order[a.severity] - order[b.severity];
    });
  }

  async getInventoryExportData(companyId: string): Promise<InventoryExportRow[]> {
    const { data, error } = await this.supabase
      .from('inventory_stock')
      .select(`
        physical_stock,
        reserved_stock,
        available_stock,
        products (
          id,
          name,
          sku,
          cost_price,
          sale_price,
          min_stock_alert,
          max_stock
        ),
        warehouses (
          name
        )
      `)
      .eq('company_id', companyId);

    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => {
      const prod = row.products || {};
      const wh = row.warehouses || {};
      const physical = Number(row.physical_stock || 0);
      const reserved = Number(row.reserved_stock || 0);
      const available = Number(row.available_stock || 0);
      const cost = Number(prod.cost_price || 0);
      const sale = Number(prod.sale_price || 0);
      const minAlert = Number(prod.min_stock_alert || 0);
      const maxStock = prod.max_stock ? Number(prod.max_stock) : null;

      let status: 'QUIEBRE' | 'BAJO_STOCK' | 'SOBRESTOCK' | 'OPTIMO' = 'OPTIMO';
      if (available <= 0) status = 'QUIEBRE';
      else if (minAlert > 0 && available <= minAlert) status = 'BAJO_STOCK';
      else if (maxStock !== null && physical > maxStock) status = 'SOBRESTOCK';

      return {
        productId: prod.id || '',
        sku: prod.sku || 'N/A',
        productName: prod.name || 'Sin nombre',
        warehouseName: wh.name || 'Depósito',
        physicalStock: physical,
        reservedStock: reserved,
        availableStock: available,
        minStockAlert: minAlert,
        costPrice: cost,
        salePrice: sale,
        totalValuation: physical * cost,
        status,
      };
    });
  }
}
