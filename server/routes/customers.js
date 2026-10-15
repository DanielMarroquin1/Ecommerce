const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');
const { requireAuth } = require('../middlewares/auth');
const { validateCustomerRegister, validateCustomerLogin } = require('../middlewares/validation');

/**
 * POST /api/customers/register — Registro de clientes en zz_customers
 * Valida política de contraseñas, hashea con bcrypt (12 rounds) y emite token
 */
router.post('/register', validateCustomerRegister, async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const result = await customerService.register({ name, email, password, phone });
        res.status(201).json(result);
    } catch (err) {
        console.error('Customer register error:', err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || 'Error al registrar cliente' });
    }
});

/**
 * POST /api/customers/login — Autenticación exclusiva de clientes contra zz_customers
 * Valida credenciales, emite JWT y devuelve usuario con campo 'role: customer'
 */
router.post('/login', validateCustomerLogin, async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await customerService.login({ email, password });
        res.status(200).json(result);
    } catch (err) {
        console.error('Customer login error:', err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || 'Error al iniciar sesión' });
    }
});

/**
 * GET /api/customers/me/orders — Historial de órdenes del cliente autenticado
 * Extrae id y email desde el token verificado por requireAuth
 */
router.get('/me/orders', requireAuth, async (req, res) => {
    try {
        const result = await customerService.getCustomerOrders(req.user);
        res.status(200).json(result);
    } catch (err) {
        console.error('Customer orders error:', err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || 'Error al obtener órdenes del cliente' });
    }
});

module.exports = router;
