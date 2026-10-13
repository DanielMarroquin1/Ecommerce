const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// POST /api/promos/validate — Validación exhaustiva de cupones
router.post('/validate', async (req, res) => {
    try {
        let { code, subtotal } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Cupón vencido o no válido' });
        }

        // Limpiar espacios en blanco (.trim()) y normalizar a mayúsculas
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) {
            return res.status(400).json({ error: 'Cupón vencido o no válido' });
        }

        // Búsqueda en base de datos
        const result = await pool.query(
            `SELECT * FROM zz_promo_codes WHERE UPPER(TRIM(code)) = $1`,
            [cleanCode]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Cupón vencido o no válido' });
        }

        const promo = result.rows[0];

        // 1. Validar que el cupón esté activo
        if (!promo.is_active) {
            return res.status(400).json({ error: 'Cupón vencido o no válido' });
        }

        // 2. Validar vigencia temporal estricta:
        //    fecha_actual >= valid_from Y fecha_actual <= valid_until (o expiration_date)
        const now = new Date();
        if (promo.valid_from && new Date(promo.valid_from) > now) {
            return res.status(400).json({ error: 'Cupón vencido o no válido' });
        }

        const expirationDate = promo.valid_until || promo.expiration_date;
        if (expirationDate && new Date(expirationDate) < now) {
            return res.status(400).json({ error: 'Cupón vencido o no válido' });
        }

        // 3. Validar límite de usos máximos
        if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
            return res.status(400).json({ error: 'Cupón vencido o no válido' });
        }

        // 4. Validar subtotal mínimo requerido
        if (subtotal !== undefined && promo.min_order_value && Number(subtotal) < Number(promo.min_order_value)) {
            return res.status(400).json({ error: `El pedido mínimo para este cupón es $${promo.min_order_value}` });
        }

        res.json({
            id: promo.id,
            code: promo.code,
            discount_type: promo.discount_type,
            discount_value: parseFloat(promo.discount_value)
        });

    } catch (err) {
        console.error('Error validating promo code:', err);
        res.status(500).json({ error: 'Error del servidor al validar código' });
    }
});

module.exports = router;
