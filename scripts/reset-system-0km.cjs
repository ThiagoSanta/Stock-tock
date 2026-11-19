/**
 * Script de Limpieza y Puesta a Punto (0km) — Stock·tock
 *
 * Elimina todas las operaciones transaccionales de prueba y deja el sistema
 * listo para entrar a producción real con stock y balances en cero o base.
 *
 * Preserva:
 *  - Configuración de empresa (companies)
 *  - Sucursales y depósitos (warehouses)
 *  - Categorías y catálogo maestro (categories, products, product_variants)
 *  - Contactos (customers, suppliers)
 *
 * Limpia:
 *  - sales, sale_items
 *  - orders, order_items
 *  - purchases, purchase_items
 *  - stock_movements (Kardex)
 *  - stock_lots (Lotes de prueba)
 *  - cash_shifts, cash_movements (Caja chica y arqueos de turno)
 *  - customer_payments, supplier_payments (Pagos en cta. cte.)
 *  - audit_logs (Logs de pruebas iniciales)
 *  - inventory_stock (Resetea stock físico, reservado y disponible a 0)
 *
 * Uso:
 *   node scripts/reset-system-0km.cjs --dry-run   (Simular sin borrar)
 *   node scripts/reset-system-0km.cjs --confirm   (Ejecución definitiva)
 */

const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.pthvajglmftdppgsyjba:j4v%21%2B%40SYwNEKgSi@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const isDryRun = process.argv.includes('--dry-run');
const isConfirmed = process.argv.includes('--confirm');

async function runReset() {
  console.log('===========================================================');
  console.log('   STOCK·TOCK — PUESTA A PUNTO DEL SISTEMA (0KM)           ');
  console.log('===========================================================');

  if (!isDryRun && !isConfirmed) {
    console.warn('\n⚠️  MODO DE SEGURIDAD ACTIVO:');
    console.warn('   Para ejecutar la limpieza de base de datos, debés pasar el flag:');
    console.warn('   node scripts/reset-system-0km.cjs --confirm\n');
    console.warn('   O para simular sin modificar datos:');
    console.warn('   node scripts/reset-system-0km.cjs --dry-run\n');
    process.exit(0);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    console.log('\n[1/4] Conectado a PostgreSQL. Analizando registros actuales...');

    const tablesToCount = [
      'sales',
      'sale_items',
      'orders',
      'order_items',
      'purchases',
      'purchase_items',
      'stock_movements',
      'stock_lots',
      'cash_shifts',
      'cash_movements',
      'customer_payments',
      'supplier_payments',
      'audit_logs',
      'inventory_stock',
      'products',
      'customers',
      'suppliers',
    ];

    const counts = {};
    for (const tbl of tablesToCount) {
      try {
        const res = await client.query(`SELECT COUNT(*)::int as total FROM ${tbl}`);
        counts[tbl] = res.rows[0].total;
      } catch {
        counts[tbl] = 0;
      }
    }

    console.log('\n📊 Conteo actual de registros:');
    console.log(`   • Ventas registradas:           ${counts.sales || 0} (${counts.sale_items || 0} ítems)`);
    console.log(`   • Pedidos de clientes:          ${counts.orders || 0} (${counts.order_items || 0} ítems)`);
    console.log(`   • Compras a proveedores:        ${counts.purchases || 0} (${counts.purchase_items || 0} ítems)`);
    console.log(`   • Movimientos Kardex:           ${counts.stock_movements || 0}`);
    console.log(`   • Lotes de stock:               ${counts.stock_lots || 0}`);
    console.log(`   • Turnos y gastos de caja:      ${counts.cash_shifts || 0} turnos, ${counts.cash_movements || 0} movimientos`);
    console.log(`   • Pagos de clientes/prov:       ${counts.customer_payments || 0} clientes, ${counts.supplier_payments || 0} prov.`);
    console.log(`   • Registros de auditoría:       ${counts.audit_logs || 0}`);
    console.log('   ───────────────────────────────────────────────────────');
    console.log(`   🔒 Catálogo a preservar:        ${counts.products || 0} productos`);
    console.log(`   🔒 Contactos a preservar:       ${counts.customers || 0} clientes, ${counts.suppliers || 0} proveedores`);

    if (isDryRun) {
      console.log('\n🔍 [DRY-RUN] Simulación exitosa. No se realizaron cambios en la base.');
      return;
    }

    console.log('\n[2/4] Iniciando transacción de limpieza atómica (BEGIN)...');
    await client.query('BEGIN');

    // Limpieza de tablas transaccionales (hijas primero por FK)
    const cleanupQueries = [
      'DELETE FROM sale_items',
      'DELETE FROM sales',
      'DELETE FROM order_items',
      'DELETE FROM orders',
      'DELETE FROM purchase_items',
      'DELETE FROM purchases',
      'DELETE FROM stock_movements',
      'DELETE FROM stock_lots',
      'DELETE FROM cash_movements',
      'DELETE FROM cash_shifts',
      'DELETE FROM customer_payments',
      'DELETE FROM supplier_payments',
      'DELETE FROM audit_logs',
      // Resetear stocks en inventario físico y disponible a 0
      'UPDATE inventory_stock SET physical_stock = 0, reserved_stock = 0, available_stock = 0',
    ];

    for (const sql of cleanupQueries) {
      const res = await client.query(sql);
      const actionName = sql.split(' ')[0] + ' ' + (sql.split(' ')[2] || sql.split(' ')[1]);
      console.log(`   ✓ ${actionName.padEnd(28)} -> Afectadas: ${res.rowCount}`);
    }

    // Registrar log de auditoría inicial de sistema 0km
    await client.query(`
      INSERT INTO audit_logs (company_id, user_name, user_role, module, action, details)
      SELECT id, 'SISTEMA', 'ADMIN', 'CONFIGURACION', 'SISTEMA_REINICIADO_0KM', 'Limpieza completa de transacciones de prueba para inicio de operaciones en producción.'
      FROM companies
      LIMIT 1
    `);

    console.log('\n[3/4] Confirmando transacción (COMMIT)...');
    await client.query('COMMIT');

    console.log('\n[4/4] ✅ SISTEMA 0KM LISTO PARA OPERAR');
    console.log('   • Todas las transacciones de prueba fueron eliminadas.');
    console.log('   • El catálogo, productos, clientes y proveedores están intactos.');
    console.log('   • El stock físico y disponible fue reiniciado a 0.');
    console.log('   • El sistema está listo para registrar el inventario inicial y abrir caja.');
    console.log('===========================================================\n');
  } catch (err) {
    console.error('\n❌ ERROR durante la limpieza. Revirtiendo transacción (ROLLBACK)...', err);
    try {
      await client.query('ROLLBACK');
    } catch {
      // rollback silent
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runReset();
