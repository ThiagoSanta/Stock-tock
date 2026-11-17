import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

// Try pooler first (works with both IPv4 and IPv6)
const connectionUrls = [
  'postgresql://postgres.pthvajglmftdppgsyjba:j4v%21%2B%40SYwNEKgSi@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
  'postgresql://postgres.pthvajglmftdppgsyjba:j4v%21%2B%40SYwNEKgSi@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
  'postgresql://postgres:j4v%21%2B%40SYwNEKgSi@db.pthvajglmftdppgsyjba.supabase.co:5432/postgres',
];

async function runMigration() {
  const sqlPath = path.resolve('docs/04-modelo-datos-supabase.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  let connected = false;
  let lastError = null;

  for (const connectionString of connectionUrls) {
    console.log(`Intentando conectar a: ${connectionString.split('@')[1]}...`);
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log('✅ Conexión establecida exitosamente con PostgreSQL en Supabase.');
      console.log('Ejecutando script de migración...');
      await client.query(sql);
      console.log('🎉 Migración ejecutada con éxito total: todas las tablas y datos semilla creados.');
      await client.end();
      connected = true;
      break;
    } catch (err) {
      console.log(`Fallo al conectar o ejecutar con este endpoint: ${err.message}`);
      lastError = err;
      try { await client.end(); } catch {}
    }
  }

  if (!connected) {
    console.error('No se pudo conectar a ninguno de los endpoints:', lastError);
    process.exit(1);
  }
}

runMigration();
