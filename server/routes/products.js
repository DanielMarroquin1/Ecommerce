const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require(path.join(__dirname, '..', 'db', 'pool'));

// GET /api/products — Catálogo público de productos con filtros
router.get('/', async (req, res) => {
    try {
        const { category, size, color, min_price, max_price, featured, search } = req.query;

        // FILTRO ESTRICTO: Solo productos con is_active = true
        let query = `
      SELECT DISTINCT p.id, p.name, p.slug, p.description, p.price,
             p.is_featured, p.is_active, p.created_at,
             c.name as category_name, c.slug as category_slug
      FROM zz_products p
      LEFT JOIN zz_categories c ON p.category_id = c.id
      LEFT JOIN zz_product_variants pv ON pv.product_id = p.id
      WHERE p.is_active = true
    `;
        const params = [];
        let paramIndex = 1;

        if (category) {
            query += ` AND c.slug = $${paramIndex++}`;
            params.push(category);
        }

        // Filtro Talla + Color: Condición de stock > 0
        if (size && color) {
            query += ` AND pv.size = $${paramIndex++} AND pv.color = $${paramIndex++} AND pv.stock > 0`;
            params.push(size, color);
        } else {
            if (size) {
                query += ` AND pv.size = $${paramIndex++} AND pv.stock > 0`;
                params.push(size);
            }
            if (color) {
                query += ` AND pv.color = $${paramIndex++} AND pv.stock > 0`;
                params.push(color);
            }
        }

        if (min_price) {
            query += ` AND p.price >= $${paramIndex++}`;
            params.push(parseFloat(min_price));
        }
        if (max_price) {
            query += ` AND p.price <= $${paramIndex++}`;
            params.push(parseFloat(max_price));
        }
        if (featured === 'true') {
            query += ` AND p.is_featured = true`;
        }
        if (search) {
            query += ` AND (p.name ILIKE $${paramIndex++} OR p.description ILIKE $${paramIndex++})`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY p.created_at DESC`;

        const result = await pool.query(query, params);

        // Fetch de imágenes y variantes para cada producto
        const products = await Promise.all(
            result.rows.map(async (product) => {
                const images = await pool.query(
                    'SELECT id, url, alt_text, sort_order FROM zz_product_images WHERE product_id = $1 ORDER BY sort_order',
                    [product.id]
                );
                const variants = await pool.query(
                    'SELECT id, size, color, color_hex, stock FROM zz_product_variants WHERE product_id = $1 ORDER BY size, color',
                    [product.id]
                );
                const totalStock = variants.rows.reduce((sum, v) => sum + (v.stock || 0), 0);
                return {
                    ...product,
                    images: images.rows,
                    variants: variants.rows,
                    stock: totalStock,
                    in_stock: totalStock > 0,
                    sizes: [...new Set(variants.rows.map((v) => v.size))],
                    colors: [...new Map(variants.rows.map((v) => [v.color, { name: v.color, hex: v.color_hex }])).values()],
                };
            })
        );

        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ error: 'Error al cargar los productos', details: err.message });
    }
});

// GET /api/products/:id — Detalle de un producto individual
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const isNumeric = /^\d+$/.test(id);

        const result = isNumeric
            ? await pool.query(
                `SELECT p.*, c.name as category_name, c.slug as category_slug
                 FROM zz_products p
                 LEFT JOIN zz_categories c ON p.category_id = c.id
                 WHERE p.id = $1 OR p.slug = $2`,
                [parseInt(id, 10), id]
            )
            : await pool.query(
                `SELECT p.*, c.name as category_name, c.slug as category_slug
                 FROM zz_products p
                 LEFT JOIN zz_categories c ON p.category_id = c.id
                 WHERE p.slug = $1`,
                [id]
            );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado o inactivo' });
        }

        const product = result.rows[0];

        // Validar is_active: si es false, responder HTTP 404 Not Found inmediatamente
        if (product.is_active === false) {
            return res.status(404).json({ error: 'Producto no encontrado o inactivo' });
        }

        const images = await pool.query(
            'SELECT id, url, alt_text, sort_order FROM zz_product_images WHERE product_id = $1 ORDER BY sort_order',
            [product.id]
        );
        const variants = await pool.query(
            'SELECT id, size, color, color_hex, stock FROM zz_product_variants WHERE product_id = $1 ORDER BY size, color',
            [product.id]
        );

        res.json({
            ...product,
            images: images.rows,
            variants: variants.rows,
            sizes: [...new Set(variants.rows.map((v) => v.size))],
            colors: [...new Map(variants.rows.map((v) => [v.color, { name: v.color, hex: v.color_hex }])).values()],
        });
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Error del servidor al obtener el producto' });
    }
});

module.exports = router;
