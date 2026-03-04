const { Pool } = require('pg');
const dns = require('dns');
const path = require('path');

// Force IPv4 resolution (fixes Render ENETUNREACH to Supabase IPv6)
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbHost = process.env.DB_HOST || 'localhost';

const pool = new Pool({
  host: dbHost,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zzaly',
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
