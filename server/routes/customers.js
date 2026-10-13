const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('Error de seguridad crítico: La variable de entorno JWT_SECRET es obligatoria.');
}

// Middleware de Autenticación de Cliente / Usuario
const requireCustomerAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autorización requerido (Authorization: Bearer <token>)' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// GET /api/customers/me/orders — Historial de órdenes del cliente autenticado
router.get('/me/orders', requireCustomerAuth, async (req, res) => {
    try {
        const customerEmail = req.user.email;
        const customerId = req.user.id;

        const ordersResult = await pool.query(
            `SELECT o.id, o.status, o.subtotal, o.discount_amount, o.total,
                    o.shipping_address, o.contact_email, o.created_at
             FROM zz_orders o
             WHERE LOWER(o.contact_email) = LOWER($1)
             ORDER BY o.created_at DESC`,
            [customerEmail]
        );

        const orders = await Promise.all(
            ordersResult.rows.map(async (order) => {
                const itemsResult = await pool.query(
                    `SELECT id, product_name, size, color, quantity, unit_price, subtotal
                     FROM zz_order_items
                     WHERE order_id = $1
                     ORDER BY id ASC`,
                    [order.id]
                );

                const orderSuffix = String(order.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
                const orderNumber = `ORD-2026-${orderSuffix || '0000'}`;

                return {
                    orderId: order.id,
                    orderNumber,
                    createdAt: order.created_at,
                    status: order.status,
                    subtotal: parseFloat(order.subtotal),
                    discountAmount: parseFloat(order.discount_amount || 0),
                    total: parseFloat(order.total),
                    shippingAddress: order.shipping_address,
                    items: itemsResult.rows.map(item => ({
                        productName: item.product_name,
                        size: item.size,
                        color: item.color,
                        quantity: item.quantity,
                        unitPrice: parseFloat(item.unit_price),
                        subtotal: parseFloat(item.subtotal)
                    }))
                };
            })
        );

        res.json({
            count: orders.length,
            orders
        });

    } catch (err) {
        console.error('Error fetching customer orders:', err);
        res.status(500).json({ error: 'Error del servidor al obtener las órdenes' });
    }
});

module.exports = router;
