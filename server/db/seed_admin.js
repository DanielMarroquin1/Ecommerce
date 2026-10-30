require('dotenv').config();
const path = require('path');
const pool = require(path.join(__dirname, 'pool'));
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    // Asegurar que la tabla zz_admins exista
    await pool.query(`
        CREATE TABLE IF NOT EXISTS zz_admins (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL DEFAULT 'Admin',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    const adminPassword = process.env.ADMIN_PASSWORD || 'Zzaly2026!Secure';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin.qa@zzaly.com';
    const adminName = process.env.ADMIN_NAME || 'Administrador QA';

    const hash = await bcrypt.hash(adminPassword, 12);

    // Upsert en zz_admins
    const adminResult = await pool.query(
        `INSERT INTO zz_admins (email, password_hash, name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = $3
         RETURNING id, email, name`,
        [adminEmail, hash, adminName]
    );

    // Upsert en zz_users (si la tabla existe) para compatibilidad unificada de roles
    try {
        await pool.query(
            `INSERT INTO zz_users (email, password_hash, name, role) 
             VALUES ($1, $2, $3, 'admin') 
             ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = 'admin'`,
            [adminEmail, hash, adminName]
        );
    } catch (e) {
        // Ignorar si la tabla zz_users aún no ha sido creada
    }

    console.log('✓ Admin QA creado/actualizado correctamente:', adminResult.rows[0]);
    process.exit(0);
}

seedAdmin().catch(err => {
    console.error('Error al sembrar admin:', err);
    process.exit(1);
});
