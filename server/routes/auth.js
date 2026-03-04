const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'zzaly-super-secret-jwt-key-2026';
const JWT_EXPIRY = '24h';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const result = await pool.query('SELECT * FROM zz_admins WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const admin = result.rows[0];
        const valid = await bcrypt.compare(password, admin.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, name: admin.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        res.json({
            token,
            admin: { id: admin.id, email: admin.email, name: admin.name }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// POST /api/auth/verify
router.post('/verify', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ valid: false });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, admin: { id: decoded.id, email: decoded.email, name: decoded.name } });
    } catch (err) {
        res.status(401).json({ valid: false });
    }
});

module.exports = router;
