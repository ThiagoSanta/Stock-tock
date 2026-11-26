import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

test(
  'Base de Datos: Conexión y verificación de esquema e integridad',
  { skip: !connectionString ? 'DATABASE_URL no configurada en el entorno' : false },
  async (t) => {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  t.after(async () => {
    await pool.end();
  });

  // 1. Verificar conexión activa
  const ping = await pool.query('SELECT 1 as connected, current_database() as db');
  assert.equal(ping.rows[0].connected, 1);
  console.log(`  [OK] Conectado exitosamente a PostgreSQL (${ping.rows[0].db})`);

  // 2. Verificar existencia de tablas críticas del sistema
  const expectedTables = [
    'companies',
    'warehouses',
    'categories',
    'products',
    'product_variants',
    'inventory_stock',
    'stock_movements',
    'stock_lots',
    'customers',
    'customer_payments',
    'suppliers',
    'supplier_payments',
    'purchases',
    'purchase_items',
    'orders',
    'order_items',
    'sales',
    'sale_items',
    'cash_shifts',
    'cash_movements',
    'audit_logs',
  ];

  const tableQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  const tableRes = await pool.query(tableQuery);
  const presentTables = tableRes.rows.map((r) => r.table_name);
  console.log('  Tablas en public:', presentTables.sort().join(', '));

  for (const table of expectedTables) {
    assert.ok(
      presentTables.includes(table),
      `La tabla requerida "${table}" debe existir en public.`
    );
  }
  console.log(`  [OK] ${expectedTables.length} tablas críticas verificadas en public`);

  // 3. Verificar columnas de Punto 5 (Políticas comerciales y clientes)
  const customerCols = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'customers'
  `);
  const custColNames = customerCols.rows.map((r) => r.column_name);
  assert.ok(custColNames.includes('credit_limit'), 'customers.credit_limit debe existir');
  assert.ok(custColNames.includes('price_list'), 'customers.price_list debe existir');

  // 4. Verificar columnas de Punto 3 & 5 en products
  const productCols = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'products'
  `);
  const prodColNames = productCols.rows.map((r) => r.column_name);
  console.log('  Columnas en products:', prodColNames.sort().join(', '));
  assert.ok(prodColNames.includes('wholesale_price'), 'products.wholesale_price debe existir');
  assert.ok(prodColNames.includes('special_price'), 'products.special_price debe existir');
  assert.ok(prodColNames.includes('storage_location'), 'products.storage_location debe existir');
  assert.ok(prodColNames.includes('tracks_lots_and_expiry'), 'products.tracks_lots_and_expiry debe existir');

  // 5. Verificar tabla de auditoría (Punto 6)
  const auditCols = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'audit_logs'
  `);
  const auditColNames = auditCols.rows.map((r) => r.column_name);
  assert.ok(auditColNames.includes('user_name'), 'audit_logs.user_name debe existir');
  assert.ok(auditColNames.includes('user_role'), 'audit_logs.user_role debe existir');
  assert.ok(auditColNames.includes('module'), 'audit_logs.module debe existir');
  assert.ok(auditColNames.includes('action'), 'audit_logs.action debe existir');

  console.log('  [OK] Columnas de negocio y auditoría 100% íntegras');
});
