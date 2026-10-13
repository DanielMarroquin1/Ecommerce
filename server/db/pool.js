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

// Lógica de SSL condicional según entorno:
// Si NODE_ENV === 'development' o DB_SSL === 'false', SSL se desactiva (false).
// En QA, staging y producción (o si DB_SSL === 'true'), SSL es requerido.
// Nota técnica para pg (node-postgres): rejectUnauthorized: false garantiza
// conexión segura con el pooler de Supabase sin conflictos de certificados CA locales.
const isLocal = process.env.NODE_ENV === 'development' || process.env.DB_SSL === 'false';
const ssl = isLocal ? false : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString,
  ssl,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
