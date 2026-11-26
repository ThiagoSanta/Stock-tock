import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ Error: Debes definir la variable de entorno DATABASE_URL para ejecutar la migración.');
  process.exit(1);
}

const connectionUrls = [databaseUrl];

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
