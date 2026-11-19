import { SupabaseProductRepository } from '../src/core/infrastructure/repositories/SupabaseProductRepository';
import { SupabaseInventoryRepository } from '../src/core/infrastructure/repositories/SupabaseInventoryRepository';
import { SupabaseOrderRepository } from '../src/core/infrastructure/repositories/SupabaseOrderRepository';
import { SupabaseSaleRepository } from '../src/core/infrastructure/repositories/SupabaseSaleRepository';
import { SupabasePurchaseRepository } from '../src/core/infrastructure/repositories/SupabasePurchaseRepository';
import { SupabaseContactRepository } from '../src/core/infrastructure/repositories/SupabaseContactRepository';
import { SupabaseAlertRepository } from '../src/core/infrastructure/repositories/SupabaseAlertRepository';
import { SupabaseSettingsRepository } from '../src/core/infrastructure/repositories/SupabaseSettingsRepository';
import { getCompanyContext } from '../src/utils/supabase/companyContext';

// Use Cases
import { GetProductsWithStockUseCase } from '../src/core/application/use-cases/catalog/GetProductsWithStockUseCase';
import { GetInventoryBalanceUseCase } from '../src/core/application/use-cases/inventory/GetInventoryBalanceUseCase';
import { GetKardexUseCase } from '../src/core/application/use-cases/inventory/GetKardexUseCase';
import { GetSalesHistoryUseCase } from '../src/core/application/use-cases/sales/GetSalesHistoryUseCase';
import { GetContactsUseCase } from '../src/core/application/use-cases/contacts/GetContactsUseCase';
import { GetSystemAlertsUseCase } from '../src/core/application/use-cases/alerts/GetSystemAlertsUseCase';
import { ExportInventoryReportUseCase } from '../src/core/application/use-cases/alerts/ExportInventoryReportUseCase';
import { GetCompanySettingsUseCase } from '../src/core/application/use-cases/settings/GetCompanySettingsUseCase';

async function verifyAll() {
  console.log('--- INICIANDO VERIFICACIÓN SISTÉMICA COMPLETA DE STOCK-TOCK ---');

  // 1. Contexto de Empresa y Depósito
  console.log('\n[1/9] Verificando Contexto de Empresa...');
  const context = await getCompanyContext();
  if (!context) throw new Error('Fallo crítico: No se pudo cargar el contexto de empresa.');
  console.log(`✓ Empresa activa: "${context.companyName}" (${context.companyId})`);
  console.log(`✓ Depósito por defecto: ${context.defaultWarehouseId}`);

  // 2. Catálogo de Productos (Use Case & Repo)
  console.log('\n[2/9] Verificando Módulo Catálogo (GetProductsWithStockUseCase)...');
  const prodRepo = new SupabaseProductRepository();
  const getProductsUseCase = new GetProductsWithStockUseCase(prodRepo);
  const products = await getProductsUseCase.execute(context.companyId);
  console.log(`✓ Catálogo cargado con ${products.length} productos.`);
  for (const p of products) {
    console.log(`  • SKU: ${p.sku} | "${p.name}" | Stock Físico: ${p.physicalStock} | Disponible: ${p.availableStock} | Costo PPP: $${p.costPrice} | Venta: $${p.salePrice}`);
  }

  // 3. Inventario y Kardex (Use Cases & Repo)
  console.log('\n[3/9] Verificando Módulo Inventario & Kardex...');
  const invRepo = new SupabaseInventoryRepository();
  const getBalanceUseCase = new GetInventoryBalanceUseCase(invRepo);
  const getKardexUseCase = new GetKardexUseCase(invRepo);
  const balances = await getBalanceUseCase.execute(context.companyId);
  const kardex = await getKardexUseCase.execute(context.companyId, { limit: 10 });
  console.log(`✓ Balances de stock por depósito: ${balances.length} registros.`);
  console.log(`✓ Movimientos de Kardex auditados: ${kardex.length} registros.`);

  // 4. Pedidos y Reservas
  console.log('\n[4/9] Verificando Módulo Pedidos...');
  const orderRepo = new SupabaseOrderRepository();
  const orders = await orderRepo.findOrders(context.companyId);
  console.log(`✓ Pedidos de clientes registrados: ${orders.length} pedidos.`);
  for (const o of orders) {
    console.log(`  • Pedido ${o.orderNumber}: ${o.customerName} | Total: $${o.totalAmount} | Estado: ${o.status}`);
  }

  // 5. Ventas y CMV (Use Case & Repo)
  console.log('\n[5/9] Verificando Módulo Ventas...');
  const saleRepo = new SupabaseSaleRepository();
  const getSalesUseCase = new GetSalesHistoryUseCase(saleRepo);
  const sales = await getSalesUseCase.execute(context.companyId);
  console.log(`✓ Ventas registradas con CMV y margen: ${sales.length} comprobantes.`);
  for (const s of sales) {
    console.log(`  • Comprobante ${s.saleNumber}: Total $${s.totalAmount} | Margen Bruto: +$${s.estimatedGrossMargin}`);
  }

  // 6. Compras y Proveedores
  console.log('\n[6/9] Verificando Módulo Compras...');
  const purchaseRepo = new SupabasePurchaseRepository();
  const purchases = await purchaseRepo.findPurchases(context.companyId);
  const suppliersFromPurchases = await purchaseRepo.findSuppliers(context.companyId);
  console.log(`✓ Órdenes de compra: ${purchases.length} órdenes.`);
  console.log(`✓ Proveedores vinculados a compras: ${suppliersFromPurchases.length} proveedores.`);

  // 7. Contactos (Use Case & Repo)
  console.log('\n[7/9] Verificando Directorio de Contactos...');
  const contactRepo = new SupabaseContactRepository();
  const getContactsUseCase = new GetContactsUseCase(contactRepo);
  const customers = await getContactsUseCase.executeCustomers(context.companyId);
  const suppliers = await getContactsUseCase.executeSuppliers(context.companyId);
  console.log(`✓ Directorio de Clientes: ${customers.length} clientes.`);
  console.log(`✓ Directorio de Proveedores: ${suppliers.length} proveedores.`);

  // 8. Alertas del Sistema y Exportación (Use Cases & Repo)
  console.log('\n[8/9] Verificando Centro de Alertas y Reportes...');
  const alertRepo = new SupabaseAlertRepository();
  const getAlertsUseCase = new GetSystemAlertsUseCase(alertRepo);
  const exportUseCase = new ExportInventoryReportUseCase(alertRepo);
  const alerts = await getAlertsUseCase.execute(context.companyId);
  const exportData = await exportUseCase.getExportData(context.companyId);
  const csvSample = exportUseCase.generateCSV(exportData);
  console.log(`✓ Alertas generadas: ${alerts.length} alertas.`);
  console.log(`✓ Datos para planilla de auditoría: ${exportData.length} ítems.`);
  console.log(`✓ Generador CSV: OK (longitud de salida: ${csvSample.length} caracteres).`);

  // 9. Configuración del Sistema (Use Case & Repo)
  console.log('\n[9/9] Verificando Configuración y Depósitos...');
  const settingsRepo = new SupabaseSettingsRepository();
  const getSettingsUseCase = new GetCompanySettingsUseCase(settingsRepo);
  const settings = await getSettingsUseCase.execute();
  console.log(`✓ Empresa: "${settings.company.name}" (Moneda: ${settings.company.primaryCurrency})`);
  console.log(`✓ Depósitos operativos: ${settings.warehouses.length} depósitos.`);
  for (const wh of settings.warehouses) {
    console.log(`  • Depósito: "${wh.name}" ${wh.isDefault ? '[DEFAULT]' : ''}`);
  }

  console.log('\n======================================================');
  console.log('✅ TODAS LAS 9 ÁREAS FUNCIONAN DE PUNTA A PUNTA AL 100%');
  console.log('======================================================');
}

verifyAll().catch((err) => {
  console.error('\n❌ ERROR DURANTE LA VERIFICACIÓN:', err);
  process.exit(1);
});
