const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// POST /api/checkout/process
router.post('/process', async (req, res) => {
    try {
        const {
            userId, // Can be null for guest checkout
            subtotal,
            discountAmount,
            total,
            promoCodeId,
            shippingAddress,
            contactEmail,
            contactPhone,
            items // Array of items
        } = req.body;

        // Validation
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }
        if (!contactEmail || !shippingAddress) {
            return res.status(400).json({ error: 'Faltan datos de envío o contacto' });
        }

        // We prepare items to be sent as JSONB to the stored procedure
        const itemsJson = JSON.stringify(items.map(i => ({
            variant_id: i.variantId,
            product_name: i.name,
            size: i.size,
            color: i.color,
            qty: i.quantity,
            price: i.price
        })));

        // Execute ACID Stored Procedure
        const result = await pool.query(
            `SELECT process_checkout($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb) as order_id`,
            [
                userId || null,
                subtotal,
                discountAmount || 0,
                total,
                promoCodeId || null,
                shippingAddress,
                contactEmail,
                contactPhone,
                itemsJson
            ]
        );

        const orderId = result.rows[0].order_id;

        // Create Payment Intent/Scaffolding for Banco Industrial
        // Here you would normally call Banco Industrial's API
        // For now, we simulate creating a payment record in our DB

        const gatewayResponseSim = { message: "Prepared for Banco Industrial Gateway" };

        const paymentResult = await pool.query(
            `INSERT INTO zz_payments (order_id, provider, amount, currency, gateway_response)
             VALUES ($1, 'banco_industrial', $2, 'GTQ', $3)
             RETURNING id, transaction_id`,
            [orderId, total, gatewayResponseSim]
        );

        res.json({
            success: true,
            message: 'Orden procesada y lista para pago',
            orderId: orderId,
            paymentId: paymentResult.rows[0].id,
            totalToPay: total
        });

    } catch (err) {
        console.error('Checkout error:', err);
        // Look for the specific database exception thrown by our trigger/function
        if (err.message && err.message.includes('Not enough stock')) {
            return res.status(409).json({ error: 'No hay suficiente inventario para uno o más artículos en tu carrito.' });
        }
        res.status(500).json({ error: 'Error interno al procesar el checkout' });
    }
});

module.exports = router;
