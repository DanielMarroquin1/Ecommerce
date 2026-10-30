const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require(path.join(__dirname, '..', 'db', 'pool'));

// GET /api/products — Catálogo completo con filtros y paginación
router.get('/', async (req, res) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            sort,
            inStock,
            page = 1,
            limit = 12,
            search
        } = req.query;

        // Base query - only active products
        let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM zz_products p
      LEFT JOIN zz_categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
        const params = [];
        let paramIndex = 1;

        // Filter: Category
        if (category) {
            query += ` AND c.slug = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        // Filter: Search
        if (search) {
            query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Filter: Min Price
        if (minPrice) {
            query += ` AND p.price >= $${paramIndex}`;
            params.push(parseFloat(minPrice));
            paramIndex++;
        }

        // Filter: Max Price
        if (maxPrice) {
            query += ` AND p.price <= $${paramIndex}`;
            params.push(parseFloat(maxPrice));
            paramIndex++;
        }

        // Filter: In Stock
        if (inStock === 'true') {
            query += ` AND EXISTS (
        SELECT 1 FROM zz_product_variants pv 
        WHERE pv.product_id = p.id AND pv.stock > 0
      )`;
        }

        // Sorting
        switch (sort) {
            case 'price_asc':
                query += ' ORDER BY p.price ASC';
                break;
            case 'price_desc':
                query += ' ORDER BY p.price DESC';
                break;
            case 'name_asc':
                query += ' ORDER BY p.name ASC';
                break;
            case 'newest':
            default:
                query += ' ORDER BY p.created_at DESC';
                break;
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), offset);

        const result = await pool.query(query, params);

        // Fetch variants and images for all fetched products
        const productIds = result.rows.map(p => p.id);
        let imagesMap = {};
        let variantsMap = {};

        if (productIds.length > 0) {
            const imagesResult = await pool.query(
                `SELECT * FROM zz_product_images WHERE product_id = ANY($1) ORDER BY sort_order`,
                [productIds]
            );
            imagesResult.rows.forEach(img => {
                if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
                imagesMap[img.product_id].push(img);
            });

            const variantsResult = await pool.query(
                `SELECT * FROM zz_product_variants WHERE product_id = ANY($1) ORDER BY size, color`,
                [productIds]
            );
            variantsResult.rows.forEach(v => {
                if (!variantsMap[v.product_id]) variantsMap[v.product_id] = [];
                variantsMap[v.product_id].push(v);
            });
        }

        // Attach images and variants to each product
        const productsWithDetails = result.rows.map(product => {
            const images = imagesMap[product.id] || [];
            const variants = variantsMap[product.id] || [];
            const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
            return {
                ...product,
                images,
                variants,
                stock: totalStock,
                in_stock: totalStock > 0
            };
        });

        // Get total count for pagination
        let countQuery = `
      SELECT COUNT(*) 
      FROM zz_products p
      LEFT JOIN zz_categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
        const countParams = [];
        let countIndex = 1;
        if (category) {
            countQuery += ` AND c.slug = $${countIndex}`;
            countParams.push(category);
            countIndex++;
        }
        if (search) {
            countQuery += ` AND (p.name ILIKE $${countIndex} OR p.description ILIKE $${countIndex})`;
            countParams.push(`%${search}%`);
            countIndex++;
        }
        if (minPrice) {
            countQuery += ` AND p.price >= $${countIndex}`;
            countParams.push(parseFloat(minPrice));
            countIndex++;
        }
        if (maxPrice) {
            countQuery += ` AND p.price <= $${countIndex}`;
            countParams.push(parseFloat(maxPrice));
            countIndex++;
        }
        if (inStock === 'true') {
            countQuery += ` AND EXISTS (
        SELECT 1 FROM zz_product_variants pv 
        WHERE pv.product_id = p.id AND pv.stock > 0
      )`;
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            products: productsWithDetails,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Error del servidor al obtener productos' });
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
            variants: variants.rows
        });
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Error del servidor al obtener el producto' });
    }
});

module.exports = router;
