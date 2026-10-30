const pool = require('../db/pool');

/**
 * Servicio de Procesamiento Seguro de Compras (Checkout)
 */
class CheckoutService {
    /**
     * Procesa una orden con cálculo 100% del lado del servidor,
     * verificación de inventario, validación de cupones,
     * protección de idempotencia (CP-23) y número de orden legible.
     */
    async processOrder({ items, customer, shippingAddress, couponCode, promoCodeId: inputPromoCodeId, userId, idempotencyKey }) {
        // ====================================================================
        // 1. MECANISMO DE IDEMPOTENCIA (CP-23)
        // ====================================================================
        const cleanIdempotencyKey = idempotencyKey && typeof idempotencyKey === 'string'
            ? idempotencyKey.trim()
            : null;

        if (cleanIdempotencyKey) {
            const existingOrderRes = await pool.query(
                `SELECT o.id, o.order_number, o.status, o.subtotal, o.discount_amount, o.total,
                        o.shipping_address, o.contact_email, o.contact_phone, o.created_at,
                        p.id as payment_id, pr.code as promo_code
                 FROM zz_orders o
                 LEFT JOIN zz_payments p ON p.order_id = o.id
                 LEFT JOIN zz_promo_codes pr ON pr.id = o.promo_code_id
                 WHERE o.idempotency_key = $1`,
                [cleanIdempotencyKey]
            );

            if (existingOrderRes.rows.length > 0) {
                const existing = existingOrderRes.rows[0];
                const itemsRes = await pool.query(
                    `SELECT variant_id, product_name, size, color, quantity, unit_price, subtotal
                     FROM zz_order_items WHERE order_id = $1 ORDER BY id ASC`,
                    [existing.id]
                );

                const parsedAddress = typeof existing.shipping_address === 'string'
                    ? JSON.parse(existing.shipping_address)
                    : existing.shipping_address;

                return {
                    statusCode: 200,
                    idempotent: true,
                    data: {
                        success: true,
                        idempotent: true,
                        orderNumber: existing.order_number,
                        orderId: existing.id,
                        status: existing.status,
                        subtotal: parseFloat(existing.subtotal),
                        discountAmount: parseFloat(existing.discount_amount || 0),
                        total: parseFloat(existing.total),
                        couponApplied: existing.promo_code || null,
                        customer: {
                            name: parsedAddress?.customerName || customer.name,
                            email: existing.contact_email,
                            phone: existing.contact_phone
                        },
                        shippingAddress: parsedAddress?.address || shippingAddress,
                        items: itemsRes.rows.map(i => ({
                            variantId: i.variant_id,
                            productName: i.product_name,
                            size: i.size,
                            color: i.color,
                            quantity: i.quantity,
                            unitPrice: parseFloat(i.unit_price),
                            subtotal: parseFloat(i.subtotal)
                        })),
                        paymentId: existing.payment_id || null,
                        createdAt: existing.created_at
                    }
                };
            }
        }

        // ====================================================================
        // 2. CÁLCULO SEGURO DEL LADO DEL SERVIDOR Y VERIFICACIÓN DE INVENTARIO
        // ====================================================================
        const validatedItems = [];
        let calculatedSubtotal = 0;

        for (const item of items) {
            const variantId = item.variantId;
            const quantity = item.quantity;

            const varRes = await pool.query(
                `SELECT pv.id as variant_id, pv.product_id, pv.size, pv.color, pv.stock,
                        p.name as product_name, p.price, p.is_active
                 FROM zz_product_variants pv
                 JOIN zz_products p ON pv.product_id = p.id
                 WHERE pv.id = $1`,
                [variantId]
            );

            if (varRes.rows.length === 0) {
                const err = new Error(`La variante con ID ${variantId} no existe en el catálogo`);
                err.statusCode = 404;
                throw err;
            }

            const variant = varRes.rows[0];

            if (variant.is_active === false) {
                const err = new Error(`El producto '${variant.product_name}' está inactivo y no se puede comprar`);
                err.statusCode = 404;
                throw err;
            }

            if (variant.stock < quantity) {
                const err = new Error(
                    `Inventario insuficiente para '${variant.product_name}' (${variant.size} - ${variant.color}). Stock disponible: ${variant.stock}, solicitado: ${quantity}`
                );
                err.statusCode = 409;
                throw err;
            }

            // PRECIO AUTORITATIVO OBTENIDO EXCLUSIVAMENTE DE LA BASE DE DATOS
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

        // ====================================================================
        // 3. VALIDACIÓN DE CUPÓN Y RECÁLCULO SEGURO DE DESCUENTO
        // ====================================================================
        let promoCodeId = null;
        let discountAmount = 0;
        let appliedCoupon = null;

        let promoRes = null;
        if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
            const cleanCode = couponCode.trim().toUpperCase();
            promoRes = await pool.query(
                `SELECT * FROM zz_promo_codes WHERE UPPER(TRIM(code)) = $1`,
                [cleanCode]
            );
        } else if (inputPromoCodeId) {
            promoRes = await pool.query(
                `SELECT * FROM zz_promo_codes WHERE id = $1`,
                [inputPromoCodeId]
            );
        }

        if (promoRes) {
            if (promoRes.rows.length === 0) {
                const err = new Error('Cupón vencido o no válido');
                err.statusCode = 422;
                throw err;
            }

            const promo = promoRes.rows[0];

            if (!promo.is_active) {
                const err = new Error('Cupón vencido o no válido');
                err.statusCode = 422;
                throw err;
            }

            const now = new Date();
            if (promo.valid_from && new Date(promo.valid_from) > now) {
                const err = new Error('Cupón vencido o no válido');
                err.statusCode = 422;
                throw err;
            }

            const expirationDate = promo.valid_until || promo.expiration_date;
            if (expirationDate && new Date(expirationDate) < now) {
                const err = new Error('Cupón vencido o no válido');
                err.statusCode = 422;
                throw err;
            }

            if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
                const err = new Error('Cupón vencido o no válido');
                err.statusCode = 422;
                throw err;
            }

            if (promo.min_order_value && calculatedSubtotal < Number(promo.min_order_value)) {
                const err = new Error(`El pedido mínimo para aplicar este cupón es $${promo.min_order_value}`);
                err.statusCode = 422;
                throw err;
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

        // ====================================================================
        // 4. IDENTIFICADOR DE ORDEN LEGIBLE (ORD-YYYYMM-XXXX) Y CLIENTE ASOCIADO
        // ====================================================================
        const now = new Date();
        const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
        const readableOrderNumber = `ORD-${yyyymm}-${randomChars}`;

        // Intentar enlazar con cliente registrado si existe en zz_customers
        let customerId = null;
        try {
            const customerRes = await pool.query(
                `SELECT id FROM zz_customers WHERE LOWER(email) = LOWER($1)`,
                [customer.email]
            );
            if (customerRes.rows.length > 0) {
                customerId = customerRes.rows[0].id;
            }
        } catch (e) {
            // Continuar si la tabla aún se está sincronizando
        }

        // ====================================================================
        // 5. EJECUCIÓN TRANSACCIONAL ACID EN BASE DE DATOS
        // ====================================================================
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

        let orderId;
        try {
            const result = await pool.query(
                `SELECT process_checkout($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9::jsonb, $10, $11, $12) as order_id`,
                [
                    userId || null,
                    calculatedSubtotal,
                    discountAmount,
                    finalTotal,
                    promoCodeId,
                    shippingAddressJson,
                    customer.email,
                    customer.phone,
                    itemsJson,
                    customerId,
                    readableOrderNumber,
                    cleanIdempotencyKey
                ]
            );
            orderId = result.rows[0].order_id;
        } catch (dbErr) {
            // Si la clave de idempotencia colisiona por concurrencia
            if (cleanIdempotencyKey && dbErr.code === '23505') {
                const recheck = await pool.query(
                    `SELECT id, order_number, status, subtotal, discount_amount, total, created_at
                     FROM zz_orders WHERE idempotency_key = $1`,
                    [cleanIdempotencyKey]
                );
                if (recheck.rows.length > 0) {
                    return {
                        statusCode: 200,
                        idempotent: true,
                        data: {
                            success: true,
                            idempotent: true,
                            orderNumber: recheck.rows[0].order_number,
                            orderId: recheck.rows[0].id,
                            status: recheck.rows[0].status,
                            subtotal: parseFloat(recheck.rows[0].subtotal),
                            discountAmount: parseFloat(recheck.rows[0].discount_amount || 0),
                            total: parseFloat(recheck.rows[0].total),
                            customer,
                            shippingAddress
                        }
                    };
                }
            }
            throw dbErr;
        }

        // Registrar pago simulado (Gateway Banco Industrial)
        const gatewayResponseSim = { message: 'Prepared for Banco Industrial Gateway' };
        const paymentResult = await pool.query(
            `INSERT INTO zz_payments (order_id, provider, amount, currency, gateway_response)
             VALUES ($1, 'banco_industrial', $2, 'GTQ', $3)
             RETURNING id, transaction_id`,
            [orderId, finalTotal, gatewayResponseSim]
        );

        return {
            statusCode: 201,
            data: {
                success: true,
                orderNumber: readableOrderNumber,
                orderId,
                status: 'pending',
                subtotal: calculatedSubtotal,
                discountAmount,
                total: finalTotal,
                couponApplied: appliedCoupon,
                customer: {
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone
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
            }
        };
    }
}

module.exports = new CheckoutService();
