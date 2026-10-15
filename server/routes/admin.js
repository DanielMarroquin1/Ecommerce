const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('Error de seguridad crítico: La variable de entorno JWT_SECRET es obligatoria.');
}

const { isAdmin } = require('../middlewares/auth');

// ===================== DASHBOARD =====================

// GET /api/admin/dashboard — Summary stats
router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const [productsCount, ordersCount, revenueResult, lowStockResult, recentOrders] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM zz_products'),
            pool.query('SELECT COUNT(*) FROM zz_orders'),
            pool.query("SELECT COALESCE(SUM(total), 0) as revenue FROM zz_orders WHERE status != 'cancelled'"),
            pool.query('SELECT COUNT(*) FROM zz_product_variants WHERE stock <= 5'),
            pool.query(`SELECT id, contact_email, total, status, created_at 
                        FROM zz_orders ORDER BY created_at DESC LIMIT 5`)
        ]);

        res.json({
            totalProducts: parseInt(productsCount.rows[0].count),
            totalOrders: parseInt(ordersCount.rows[0].count),
            totalRevenue: parseFloat(revenueResult.rows[0].revenue),
            lowStockAlerts: parseInt(lowStockResult.rows[0].count),
            recentOrders: recentOrders.rows
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Error cargando el dashboard' });
    }
});

// ===================== PRODUCTS =====================

// GET /api/admin/products
router.get('/products', isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, c.name as category_name
             FROM zz_products p
             LEFT JOIN zz_categories c ON p.category_id = c.id
             ORDER BY p.created_at DESC`
        );

        const products = await Promise.all(
            result.rows.map(async (product) => {
                const variants = await pool.query(
                    'SELECT * FROM zz_product_variants WHERE product_id = $1 ORDER BY size, color',
                    [product.id]
                );
                const images = await pool.query(
                    'SELECT * FROM zz_product_images WHERE product_id = $1 ORDER BY sort_order',
                    [product.id]
                );
                return { ...product, variants: variants.rows, images: images.rows };
            })
        );

        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Error fetching products' });
    }
});

// POST /api/admin/products — Create
router.post('/products', isAdmin, async (req, res) => {
    const { name, slug, description, price, category_id, is_active, is_featured, variants, images } = req.body;

    // Validaciones de negocio (Evitar 500s)
    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    if (price === undefined || isNaN(price) || Number(price) <= 0) {
        return res.status(400).json({ error: 'El precio debe ser un número mayor a 0' });
    }

    if (variants && Array.isArray(variants)) {
        for (const v of variants) {
            if (v.stock !== undefined && (isNaN(v.stock) || Number(v.stock) < 0)) {
                return res.status(400).json({ error: 'El stock de las variantes debe ser mayor o igual a 0' });
            }
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const prodResult = await client.query(
            `INSERT INTO zz_products (name, slug, description, price, category_id, is_active, is_featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name.trim(), slug, description, price, category_id, is_active !== false, is_featured || false]
        );
        const product = prodResult.rows[0];

        if (variants && variants.length > 0) {
            for (const v of variants) {
                await client.query(
                    `INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [product.id, v.size, v.color, v.color_hex, Math.max(0, parseInt(v.stock, 10) || 0)]
                );
            }
        }

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
        console.error('Error creating product:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un producto con el slug especificado' });
        }
        res.status(500).json({ error: 'Error al crear el producto' });
    } finally {
        client.release();
    }
});

// GET /api/admin/products/:id
router.get('/products/:id', isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM zz_products WHERE id = $1`, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        const product = result.rows[0];

        const varRes = await pool.query('SELECT * FROM zz_product_variants WHERE product_id = $1', [product.id]);
        product.variants = varRes.rows;

        const imgRes = await pool.query('SELECT * FROM zz_product_images WHERE product_id = $1 ORDER BY sort_order', [product.id]);
        product.images = imgRes.rows;

        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching product' });
    }
});

// PUT /api/admin/products/:id — Update
router.put('/products/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, slug, description, price, category_id, is_active, is_featured, variants, images } = req.body;

    // Validaciones de negocio (Evitar 500s)
    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    if (price === undefined || isNaN(price) || Number(price) <= 0) {
        return res.status(400).json({ error: 'El precio debe ser un número mayor a 0' });
    }

    if (variants && Array.isArray(variants)) {
        for (const v of variants) {
            if (v.stock !== undefined && (isNaN(v.stock) || Number(v.stock) < 0)) {
                return res.status(400).json({ error: 'El stock de las variantes debe ser mayor o igual a 0' });
            }
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE zz_products SET name=$1, slug=$2, description=$3, price=$4, category_id=$5, is_active=$6, is_featured=$7
             WHERE id=$8`,
            [name.trim(), slug, description, price, category_id, is_active, is_featured, id]
        );

        // Replace variants
        await client.query('DELETE FROM zz_product_variants WHERE product_id = $1', [id]);
        if (variants && variants.length > 0) {
            for (const v of variants) {
                await client.query(
                    `INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [id, v.size, v.color, v.color_hex, Math.max(0, parseInt(v.stock, 10) || 0)]
                );
            }
        }

        // Replace images
        await client.query('DELETE FROM zz_product_images WHERE product_id = $1', [id]);
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                const url = typeof images[i] === 'string' ? images[i] : images[i].url;
                await client.query(
                    `INSERT INTO zz_product_images (product_id, url, alt_text, sort_order) VALUES ($1, $2, $3, $4)`,
                    [id, url, `${name} - Vista ${i + 1}`, i]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating product:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un producto con el slug especificado' });
        }
        res.status(500).json({ error: 'Error al actualizar el producto' });
    } finally {
        client.release();
    }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM zz_products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting product' });
    }
});

// ===================== ORDERS =====================

// GET /api/admin/orders
router.get('/orders', isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.*, 
                   COALESCE(json_agg(
                       json_build_object('product_name', oi.product_name, 'size', oi.size, 'color', oi.color, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal)
                   ) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
            FROM zz_orders o
            LEFT JOIN zz_order_items oi ON oi.order_id = o.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Error fetching orders' });
    }
});

// GET /api/admin/orders/:id
router.get('/orders/:id', isAdmin, async (req, res) => {
    try {
        const orderResult = await pool.query('SELECT * FROM zz_orders WHERE id = $1', [req.params.id]);
        if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

        const itemsResult = await pool.query('SELECT * FROM zz_order_items WHERE order_id = $1', [req.params.id]);

        res.json({ ...orderResult.rows[0], items: itemsResult.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching order' });
    }
});

// PUT /api/admin/orders/:id/status — Actualizar estado con Máquina de Estados
router.put('/orders/:id/status', isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Estado inválido. Estados soportados: ${validStatuses.join(', ')}` 
            });
        }

        const orderResult = await pool.query('SELECT * FROM zz_orders WHERE id = $1', [req.params.id]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const currentStatus = orderResult.rows[0].status;

        // Si ya tiene el estado solicitado, retornar sin error
        if (currentStatus === status) {
            return res.json(orderResult.rows[0]);
        }

        // Definición estricta de transiciones de estado permitidas
        const ALLOWED_TRANSITIONS = {
            pending: ['paid', 'processing', 'cancelled'],
            paid: ['processing', 'shipped', 'cancelled'],
            processing: ['shipped', 'cancelled'],
            shipped: ['delivered', 'cancelled'],
            delivered: [], // Estado terminal
            cancelled: []  // Estado terminal
        };

        const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
        if (!allowedNextStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Transición de estado no permitida: no se puede cambiar de '${currentStatus}' a '${status}'` 
            });
        }

        const result = await pool.query(
            'UPDATE zz_orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Error del servidor al actualizar estado del pedido' });
    }
});

// ===================== PROMOS =====================

// GET /api/admin/promos
router.get('/promos', isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM zz_promo_codes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching promos' });
    }
});

// POST /api/admin/promos — Crear Cupón con validaciones de negocio y 409 en duplicados
router.post('/promos', isAdmin, async (req, res) => {
    try {
        const { code, discount_type, discount_value, min_order_value, max_uses, valid_until, valid_from } = req.body;

        if (!code || typeof code !== 'string' || !code.trim()) {
            return res.status(400).json({ error: 'El código de cupón es obligatorio' });
        }

        const cleanCode = code.trim().toUpperCase();

        if (!['percentage', 'fixed'].includes(discount_type)) {
            return res.status(400).json({ error: "El tipo de descuento debe ser 'percentage' o 'fixed'" });
        }

        if (discount_value === undefined || isNaN(discount_value) || Number(discount_value) <= 0) {
            return res.status(400).json({ error: 'El valor de descuento debe ser un número mayor a 0' });
        }

        // Validación de porcentaje entre 1 y 100
        if (discount_type === 'percentage') {
            const pct = Number(discount_value);
            if (pct < 1 || pct > 100) {
                return res.status(400).json({ error: 'El porcentaje de descuento debe estar entre 1 y 100' });
            }
        }

        const fromDate = valid_from || req.body.validFrom;
        const toDate = valid_until || req.body.valid_to || req.body.validTo || req.body.expiration_date;

        // Validación de coherencia de fechas (valid_from <= valid_to)
        if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
            return res.status(400).json({ 
                error: 'La fecha de inicio (valid_from) no puede ser posterior a la fecha de vencimiento (valid_until)' 
            });
        }

        // Validación de código duplicado -> HTTP 409 Conflict
        const existingPromo = await pool.query(
            'SELECT id FROM zz_promo_codes WHERE UPPER(TRIM(code)) = $1',
            [cleanCode]
        );
        if (existingPromo.rows.length > 0) {
            return res.status(409).json({ error: 'Ya existe un código de promoción con este nombre' });
        }

        const result = await pool.query(
            `INSERT INTO zz_promo_codes (code, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                cleanCode,
                discount_type,
                discount_value,
                min_order_value || 0,
                max_uses || null,
                fromDate ? new Date(fromDate) : new Date(),
                toDate ? new Date(toDate) : null
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating promo code:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un código de promoción con este nombre' });
        }
        res.status(500).json({ error: 'Error del servidor al crear código promocional' });
    }
});

// PUT /api/admin/promos/:id — Toggle active
router.put('/promos/:id', isAdmin, async (req, res) => {
    try {
        const { is_active } = req.body;
        const result = await pool.query(
            'UPDATE zz_promo_codes SET is_active = $1 WHERE id = $2 RETURNING *',
            [is_active, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error updating promo' });
    }
});

// DELETE /api/admin/promos/:id
router.delete('/promos/:id', isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM zz_promo_codes WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting promo' });
    }
});

// ===================== STOCK =====================

// PUT /api/admin/variants/:id/stock — Actualizar stock con validación de >= 0
router.put('/variants/:id/stock', isAdmin, async (req, res) => {
    const { stock } = req.body;

    if (stock === undefined || isNaN(stock) || Number(stock) < 0) {
        return res.status(400).json({ error: 'El stock debe ser un número entero mayor o igual a 0' });
    }

    try {
        const result = await pool.query(
            'UPDATE zz_product_variants SET stock = $1 WHERE id = $2 RETURNING *',
            [parseInt(stock, 10), req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Variante no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating stock:', err);
        res.status(500).json({ error: 'Error al actualizar inventario' });
    }
});

module.exports = router;
