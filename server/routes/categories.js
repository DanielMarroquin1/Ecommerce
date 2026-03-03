const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, slug FROM zz_categories ORDER BY name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Error al cargar las categorías' });
    }
});

module.exports = router;
