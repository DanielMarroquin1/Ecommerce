const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const promosRouter = require('./routes/promos');
const checkoutRouter = require('./routes/checkout');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/promos', promosRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 zzaly server running at http://localhost:${PORT}`);
});
