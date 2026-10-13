const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Función auxiliar unificada para procesar compras
async function handleCheckout(req, res) {
    try {
        const body = req.body || {};

        // Normalización de payload (soporta tanto el nuevo contrato QA como el legado)
        const items = body.items || [];
        const customer = body.customer || {
            name: body.contactName || '',
            email: body.contactEmail || '',
            phone: body.contactPhone || ''
        };
        const shippingAddress = body.shippingAddress || body.address;
        const couponCode = body.couponCode || body.coupon_code || body.promoCode;
        const userId = body.userId || null;

        // 1. Validaciones básicas de entrada (HTTP 400)
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío o no contiene artículos' });
        }

        if (!customer.email || !shippingAddress) {
            return res.status(400).json({ error: 'Faltan datos obligatorios: email de cliente y dirección de envío' });
        }

        // 2. Validación de artículos, verificación de existencia y stock (HTTP 404 / 409)
        const validatedItems = [];
        let calculatedSubtotal = 0;

        for (const item of items) {
            const variantId = item.variantId || item.variant_id;
            const quantity = parseInt(item.quantity || item.qty, 10);

            if (!variantId || isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ error: 'Cada artículo debe tener un variantId válido y una cantidad mayor a cero' });
            }

            const varRes = await pool.query(
                `SELECT pv.id as variant_id, pv.product_id, pv.size, pv.color, pv.stock,
                        p.name as product_name, p.price, p.is_active
                 FROM zz_product_variants pv
                 JOIN zz_products p ON pv.product_id = p.id
                 WHERE pv.id = $1`,
                [variantId]
            );

            if (varRes.rows.length === 0) {
                return res.status(404).json({ error: `La variante con ID ${variantId} no existe en el catálogo` });
            }

            const variant = varRes.rows[0];

            if (variant.is_active === false) {
                return res.status(404).json({ error: `El producto '${variant.product_name}' está inactivo y no se puede comprar` });
            }

            if (variant.stock < quantity) {
                return res.status(409).json({
                    error: `Inventario insuficiente para '${variant.product_name}' (${variant.size} - ${variant.color}). Stock disponible: ${variant.stock}, solicitado: ${quantity}`
                });
            }

            const unitPrice = parseFloat(variant.price);
            const lineTotal = Number((unitPrice * quantity).toFixed(2));
            calculatedSubtotal += lineTotal;

            validatedItems.push({
                variant_id: variant.variant_id,
                product_name: variant.product_name,
                size: variant.size,
                color: variant.color,
                qty: quantity,
                price: unitPrice,
                lineTotal
            });
        }

        calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));

        // 3. Validación y aplicación de cupón si fue provisto (HTTP 422)
        let promoCodeId = null;
        let discountAmount = 0;
        let appliedCoupon = null;

        if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
            const cleanCode = couponCode.trim().toUpperCase();

            const promoRes = await pool.query(
                `SELECT * FROM zz_promo_codes WHERE UPPER(TRIM(code)) = $1`,
                [cleanCode]
            );

            if (promoRes.rows.length === 0) {
                return res.status(422).json({ error: 'Cupón vencido o no válido' });
            }

            const promo = promoRes.rows[0];

            if (!promo.is_active) {
                return res.status(422).json({ error: 'Cupón vencido o no válido' });
            }

            const now = new Date();
            if (promo.valid_from && new Date(promo.valid_from) > now) {
                return res.status(422).json({ error: 'Cupón vencido o no válido' });
            }

            const expirationDate = promo.valid_until || promo.expiration_date;
            if (expirationDate && new Date(expirationDate) < now) {
                return res.status(422).json({ error: 'Cupón vencido o no válido' });
            }

            if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
                return res.status(422).json({ error: 'Cupón vencido o no válido' });
            }

            if (promo.min_order_value && calculatedSubtotal < Number(promo.min_order_value)) {
                return res.status(422).json({ error: `El pedido mínimo para aplicar este cupón es $${promo.min_order_value}` });
            }

            promoCodeId = promo.id;
            appliedCoupon = promo.code;

            if (promo.discount_type === 'percentage') {
                discountAmount = Number(((calculatedSubtotal * Number(promo.discount_value)) / 100).toFixed(2));
            } else {
                discountAmount = Math.min(Number(promo.discount_value), calculatedSubtotal);
            }
        }

        const finalTotal = Math.max(0, Number((calculatedSubtotal - discountAmount).toFixed(2)));

        // 4. Preparar payload de artículos para la función almacenada ACID
        const itemsJson = JSON.stringify(validatedItems.map(i => ({
            variant_id: i.variant_id,
            product_name: i.product_name,
            size: i.size,
            color: i.color,
            qty: i.qty,
            price: i.price
        })));

        const shippingAddressJson = typeof shippingAddress === 'string'
            ? JSON.stringify({ address: shippingAddress, customerName: customer.name })
            : JSON.stringify(shippingAddress);

        // 5. Ejecución del Checkout en PostgreSQL
        const result = await pool.query(
            `SELECT process_checkout($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9::jsonb) as order_id`,
            [
                userId || null,
                calculatedSubtotal,
                discountAmount,
                finalTotal,
                promoCodeId,
                shippingAddressJson,
                customer.email,
                customer.phone || null,
                itemsJson
            ]
        );

        const orderId = result.rows[0].order_id;
        const orderSuffix = String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
        const orderNumber = `ORD-2026-${orderSuffix || Math.floor(1000 + Math.random() * 9000)}`;

        // Registro de pago simulado
        const gatewayResponseSim = { message: 'Prepared for Banco Industrial Gateway' };
        const paymentResult = await pool.query(
            `INSERT INTO zz_payments (order_id, provider, amount, currency, gateway_response)
             VALUES ($1, 'banco_industrial', $2, 'GTQ', $3)
             RETURNING id, transaction_id`,
            [orderId, finalTotal, gatewayResponseSim]
        );

        // 6. Respuesta formal exitosa (HTTP 201)
        res.status(201).json({
            success: true,
            orderNumber,
            orderId,
            status: 'pending',
            subtotal: calculatedSubtotal,
            discountAmount,
            total: finalTotal,
            couponApplied: appliedCoupon,
            customer: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone || null
            },
            shippingAddress,
            items: validatedItems.map(i => ({
                variantId: i.variant_id,
                productName: i.product_name,
                size: i.size,
                color: i.color,
                quantity: i.qty,
                unitPrice: i.price,
                subtotal: i.lineTotal
            })),
            paymentId: paymentResult.rows[0]?.id || null,
            createdAt: new Date().toISOString()
        });

    } catch (err) {
        console.error('Checkout error:', err);
        if (err.message && err.message.includes('Not enough stock')) {
            return res.status(409).json({ error: 'Inventario insuficiente para uno o más artículos en tu carrito.' });
        }
        res.status(500).json({ error: 'Error del servidor al procesar la orden', details: err.message });
    }
}

// POST /api/checkout — Contrato principal QA
router.post('/', handleCheckout);

// POST /api/checkout/process — Compatibilidad de endpoints legados
router.post('/process', handleCheckout);

module.exports = router;
