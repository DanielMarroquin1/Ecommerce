const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('../pool');

async function createBackup() {
    console.log('📦 Generando respaldo integral de Base de Datos QA (Supabase)...');

    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup_qa_${timestamp}.sql`);
    const latestBackupFile = path.join(backupDir, 'backup_qa_supabase.sql');

    const tables = [
        'zz_categories',
        'zz_products',
        'zz_product_variants',
        'zz_product_images',
        'zz_promo_codes',
        'zz_admins',
        'zz_users',
        'zz_customers',
        'zz_orders',
        'zz_order_items',
        'zz_payments'
    ];

    let sqlOutput = `-- ============================================================================\n`;
    sqlOutput += `-- RESPALDO DE BASE DE DATOS QA — zzaly E-Commerce\n`;
    sqlOutput += `-- Fecha de Creación: ${new Date().toISOString()}\n`;
    sqlOutput += `-- Host: aws-1-us-west-2.pooler.supabase.com\n`;
    sqlOutput += `-- Base de Datos: postgres (Ambiente QA)\n`;
    sqlOutput += `-- Responsable: Daniel Marroquín (Backend Lead)\n`;
    sqlOutput += `-- ============================================================================\n\n`;
    sqlOutput += `BEGIN;\n\n`;

    for (const table of tables) {
        try {
            const res = await pool.query(`SELECT * FROM ${table}`);
            sqlOutput += `-- ----------------------------------------------------------------------------\n`;
            sqlOutput += `-- Tabla: ${table} (${res.rows.length} registros)\n`;
            sqlOutput += `-- ----------------------------------------------------------------------------\n`;

            if (res.rows.length > 0) {
                for (const row of res.rows) {
                    const columns = Object.keys(row);
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null || val === undefined) return 'NULL';
                        if (typeof val === 'number') return val;
                        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
                        return `'${String(val).replace(/'/g, "''")}'`;
                    });

                    sqlOutput += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
                }
            }
            sqlOutput += `\n`;
        } catch (err) {
            console.warn(`Aviso en tabla ${table}: ${err.message}`);
        }
    }

    sqlOutput += `COMMIT;\n`;

    fs.writeFileSync(backupFile, sqlOutput, 'utf8');
    fs.writeFileSync(latestBackupFile, sqlOutput, 'utf8');

    console.log(`✅ Respaldo exitoso generado en:\n  -> ${latestBackupFile}\n  -> ${backupFile}`);
    process.exit(0);
}

createBackup().catch(err => {
    console.error('Error generando respaldo:', err);
    process.exit(1);
});
