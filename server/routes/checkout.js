const express = require('express');
const router = express.Router();
const checkoutService = require('../services/checkoutService');
const { validateCheckout } = require('../middlewares/validation');

/**
 * POST /api/checkout — Endpoint principal de procesamiento seguro de órdenes
 * Utiliza middleware de validación e invoca el servicio de checkout con cálculo server-side
 */
router.post('/', validateCheckout, async (req, res) => {
    try {
        const result = await checkoutService.processOrder(req.normalizedCheckout);
        res.status(result.statusCode).json(result.data);
    } catch (err) {
        console.error('Checkout error:', err);

        const status = err.statusCode || (err.message && err.message.includes('Not enough stock') ? 409 : 500);
        const isCloud = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'qa';
        const errorMessage = status >= 400 && status < 500
            ? err.message
            : (isCloud ? 'Error interno del servidor al procesar la orden' : (err.message || 'Error del servidor al procesar la orden'));

        res.status(status).json({
            error: errorMessage
        });
    }
});

/**
 * POST /api/checkout/process — Compatibilidad de endpoints legados
 */
router.post('/process', validateCheckout, async (req, res) => {
    try {
        const result = await checkoutService.processOrder(req.normalizedCheckout);
        res.status(result.statusCode).json(result.data);
    } catch (err) {
        console.error('Checkout error:', err);

        const status = err.statusCode || (err.message && err.message.includes('Not enough stock') ? 409 : 500);
        const isCloud = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'qa';
        const errorMessage = status >= 400 && status < 500
            ? err.message
            : (isCloud ? 'Error interno del servidor al procesar la orden' : (err.message || 'Error del servidor al procesar la orden'));

        res.status(status).json({
            error: errorMessage
        });
    }
});

module.exports = router;
