const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('./pool');

async function runSeedQA() {
    const client = await pool.connect();
    try {
        console.log('🔄 Ejecutando provisión completa de Base de Datos QA (Tablas, Triggers, Procedures y Seeds)...');

        const sqlPath = path.join(__dirname, 'seeds/seed_qa.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        const res = await client.query(sqlContent);

        // Si la última consulta retorna filas (el SELECT de verificación final)
        const summaryRows = Array.isArray(res) ? res[res.length - 1].rows : res.rows;

        console.log('\n✅ Base de Datos QA completada con éxito:');
        console.table(summaryRows);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error ejecutando seed_qa.sql:', err.message);
        process.exit(1);
    } finally {
        client.release();
    }
}

runSeedQA();
