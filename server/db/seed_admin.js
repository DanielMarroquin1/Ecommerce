const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require(path.join(__dirname, 'pool'));
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        throw new Error('Error: La variable de entorno ADMIN_PASSWORD es obligatoria.');
    }

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
    console.error('FAILED seedAdmin:', err.message);
    process.exit(1);
});
