require('dotenv').config();
const { Pool } = require('pg');
const dns = require('dns');
const path = require('path');

// Force IPv4 resolution (fixes Render ENETUNREACH to Supabase IPv6)
dns.setDefaultResultOrder('ipv4first');

// Asegura la carga de variables de entorno desde el archivo .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'zzaly'}`;

// Lógica de SSL configurable y condicional según entorno:
// 1. Si DB_SSL está explícitamente definido ('true' o 'false'), se respeta con máxima prioridad.
// 2. Si no está definido, se activa automáticamente en QA, producción y staging,
//    y se desactiva en desarrollo local.
// Nota: rejectUnauthorized: false permite conexión con el pooler de Supabase sin problemas de CA local.
let ssl;
if (process.env.DB_SSL !== undefined) {
  ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;
} else {
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  const isCloudEnv = ['production', 'qa', 'staging'].includes(env);
  ssl = isCloudEnv ? { rejectUnauthorized: false } : false;
}

const pool = new Pool({
  connectionString,
  ssl,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
