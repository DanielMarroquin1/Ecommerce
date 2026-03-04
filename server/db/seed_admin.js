const path = require('path');
const pool = require(path.join(__dirname, 'pool'));
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    const hash = await bcrypt.hash('Zzaly2026!Secure', 12);
    const result = await pool.query(
        `INSERT INTO zz_admins (email, password_hash, name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (email) DO UPDATE SET password_hash = $2 
         RETURNING id, email`,
        ['admin@zzaly.com', hash, 'Admin zzaly']
    );
    console.log('Admin created:', result.rows[0]);
    process.exit(0);
}

seedAdmin().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
});
