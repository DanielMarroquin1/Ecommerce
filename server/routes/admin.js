const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Simple middleware to check if user is admin (in a real app, verify Supabase JWT)
const isAdmin = (req, res, next) => {
    // Scaffold: Accept any request with a custom header for now
    // if (req.headers['x-admin-token'] !== 'super-secret-zzaly') return res.status(403).json({error: 'Forbidden'});
    next();
};

// GET /api/admin/products - List all products for admin
router.get('/products', isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, c.name as category_name
             FROM zz_products p
             LEFT JOIN zz_categories c ON p.category_id = c.id
             ORDER BY p.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching products' });
    }
});

// POST /api/admin/products - Create a new product (Full Object)
router.post('/products', isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { name, slug, description, price, category_id, is_active, is_featured, variants, images } = req.body;

        // 1. Insert Product
        const prodResult = await client.query(
            `INSERT INTO zz_products (name, slug, description, price, category_id, is_active, is_featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, slug, description, price, category_id, is_active, is_featured]
        );
        const product = prodResult.rows[0];

        // 2. Insert Variants
        if (variants && variants.length > 0) {
            for (const v of variants) {
                await client.query(
                    `INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [product.id, v.size, v.color, v.color_hex, v.stock]
                );
            }
        }

        // 3. Insert Images
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                await client.query(
                    `INSERT INTO zz_product_images (product_id, url, alt_text, sort_order)
                     VALUES ($1, $2, $3, $4)`,
                    [product.id, images[i], `${product.name} - Vista ${i + 1}`, i]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(product);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error creating product', detail: err.message });
    } finally {
        client.release();
    }
});

// GET /api/admin/products/:id - Get full product details
router.get('/products/:id', isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM zz_products WHERE id = $1`, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        const product = result.rows[0];

        const varRes = await pool.query('SELECT * FROM zz_product_variants WHERE product_id = $1', [product.id]);
        product.variants = varRes.rows;

        const imgRes = await pool.query('SELECT * FROM zz_product_images WHERE product_id = $1 ORDER BY sort_order ASC', [product.id]);
        product.images = imgRes.rows;

        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching product' });
    }
});

// PUT /api/admin/variants - Update stock for a variant
router.put('/variants/:id/stock', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    try {
        const result = await pool.query(
            'UPDATE zz_product_variants SET stock = $1 WHERE id = $2 RETURNING *',
            [stock, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error updating stock' });
    }
});

// GET /api/admin/promos - List promo codes
router.get('/promos', isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM zz_promo_codes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching promos' });
    }
});

// POST /api/admin/promos - Create promo code
router.post('/promos', isAdmin, async (req, res) => {
    try {
        const { code, discount_type, discount_value, min_order_value, max_uses, valid_until } = req.body;
        const result = await pool.query(
            `INSERT INTO zz_promo_codes (code, discount_type, discount_value, min_order_value, max_uses, valid_until)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [code.toUpperCase(), discount_type, discount_value, min_order_value || 0, max_uses || null, valid_until || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error creating promo code', details: err.message });
    }
});

// GET /api/admin/orders - List all orders
router.get('/orders', isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM zz_orders ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching orders' });
    }
});

module.exports = router;
