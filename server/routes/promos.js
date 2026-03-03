const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// POST /api/promos/validate
router.post('/validate', async (req, res) => {
    try {
        const { code, subtotal } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Código requerido' });
        }

        const result = await pool.query(
            `SELECT * FROM zz_promo_codes 
             WHERE code = $1 AND is_active = true 
             AND (valid_until IS NULL OR valid_until > NOW())`,
            [code.toUpperCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Código inválido o expirado' });
        }

        const promo = result.rows[0];

        if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
            return res.status(400).json({ error: 'Este código ha alcanzado su límite de usos' });
        }

        if (subtotal && subtotal < promo.min_order_value) {
            return res.status(400).json({ error: `El pedido mínimo para este código es $${promo.min_order_value}` });
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
