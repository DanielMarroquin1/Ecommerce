const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('Error de seguridad crítico: La variable de entorno JWT_SECRET es obligatoria.');
}
const JWT_EXPIRY = '24h';

// POST /api/auth/login — Autenticación unificada para Administradores y Clientes
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const normalizedEmail = String(email).toLowerCase().trim();

        let userRecord = null;
        let userRole = 'customer';

        // 1. Intentar buscar en zz_users (modelo unificado QA con roles: admin, customer)
        try {
            const userRes = await pool.query(
                'SELECT id, email, password_hash, name, role FROM zz_users WHERE LOWER(email) = $1',
                [normalizedEmail]
            );
            if (userRes.rows.length > 0) {
                userRecord = userRes.rows[0];
                userRole = userRecord.role || 'customer';
            }
        } catch (e) {
            // Si la tabla zz_users no existe aún, se recurre a zz_admins
        }

        // 2. Fallback a zz_admins si no se encontró en zz_users
        if (!userRecord) {
            const adminRes = await pool.query(
                'SELECT id, email, password_hash, name FROM zz_admins WHERE LOWER(email) = $1',
                [normalizedEmail]
            );
            if (adminRes.rows.length > 0) {
                userRecord = adminRes.rows[0];
                userRole = 'admin';
            }
        }

        if (!userRecord) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const valid = await bcrypt.compare(password, userRecord.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const tokenPayload = {
            id: userRecord.id,
            email: userRecord.email,
            name: userRecord.name,
            role: userRole
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        const userData = {
            id: userRecord.id,
            email: userRecord.email,
            name: userRecord.name,
            role: userRole
        };

        res.json({
            token,
            user: userData,
            // Soporte de compatibilidad hacia atrás con el panel admin existente
            ...(userRole === 'admin' ? { admin: userData } : {})
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// POST /api/auth/verify — Verificación de token JWT
router.post('/verify', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ valid: false });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
            valid: true,
            user: decoded,
            admin: decoded.role === 'admin' ? decoded : undefined
        });
    } catch (err) {
        res.status(401).json({ valid: false });
    }
});

module.exports = router;
