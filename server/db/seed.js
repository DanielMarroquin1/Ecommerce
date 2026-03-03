const pool = require('./pool');
const fs = require('fs');
const path = require('path');

async function seed() {
    const client = await pool.connect();
    try {
        // Run schema
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(schema);
        console.log('✓ Schema created');

        // Seed categories
        await client.query(`
      INSERT INTO zz_categories (name, slug) VALUES
        ('Vestidos', 'vestidos'),
        ('Blusas', 'blusas'),
        ('Pantalones', 'pantalones'),
        ('Faldas', 'faldas'),
        ('Abrigos', 'abrigos'),
        ('Accesorios', 'accesorios')
      ON CONFLICT (slug) DO NOTHING
    `);
        console.log('✓ Categories seeded');

        // Seed promo codes
        await client.query(`
            INSERT INTO zz_promo_codes (code, discount_type, discount_value, max_uses, valid_until)
            VALUES 
            ('WELCOME10', 'percentage', 10.00, 100, NOW() + INTERVAL '30 days'),
            ('DESCUENTO50', 'fixed', 50.00, 50, NOW() + INTERVAL '7 days')
            ON CONFLICT (code) DO NOTHING
        `);
        console.log('✓ Promo codes seeded');

        // Seed products
        const products = [
            { name: 'Vestido Midi Elegante', slug: 'vestido-midi-elegante', description: 'Un elegante vestido midi con caída fluida, perfecto para cualquier ocasión. Tela ligera y cómoda con un corte favorecedor que estiliza la silueta.', price: 89.99, category: 'vestidos', featured: true },
            { name: 'Vestido Largo Satinado', slug: 'vestido-largo-satinado', description: 'Vestido largo de satén con escote en V y espalda descubierta. Ideal para eventos especiales y noches elegantes.', price: 129.99, category: 'vestidos', featured: true },
            { name: 'Blusa de Seda Natural', slug: 'blusa-seda-natural', description: 'Blusa confeccionada en seda natural con botones de nácar. Suave al tacto y con un brillo sutil que eleva cualquier outfit.', price: 69.99, category: 'blusas', featured: true },
            { name: 'Blusa Crop con Lazada', slug: 'blusa-crop-lazada', description: 'Blusa crop top con lazada decorativa en el cuello. Diseño juvenil y moderno con mangas abullonadas.', price: 49.99, category: 'blusas', featured: false },
            { name: 'Pantalón Wide Leg', slug: 'pantalon-wide-leg', description: 'Pantalón de pierna ancha con tiro alto. Confeccionado en tela premium que drapeada elegantemente con cada paso.', price: 79.99, category: 'pantalones', featured: true },
            { name: 'Pantalón Palazzo Lino', slug: 'pantalon-palazzo-lino', description: 'Pantalón palazzo en lino puro, perfecto para los días cálidos. Cintura elástica y bolsillos laterales.', price: 69.99, category: 'pantalones', featured: false },
            { name: 'Falda Plisada Midi', slug: 'falda-plisada-midi', description: 'Falda plisada de largo midi con cintura elástica. La caída de los pliegues crea un movimiento elegante y femenino.', price: 59.99, category: 'faldas', featured: true },
            { name: 'Falda Mini Estructurada', slug: 'falda-mini-estructurada', description: 'Mini falda con estructura A-line y cierre lateral oculto. Diseño clásico reinventado con acabados modernos.', price: 54.99, category: 'faldas', featured: false },
            { name: 'Abrigo Camel Oversize', slug: 'abrigo-camel-oversize', description: 'Abrigo oversize en tono camel con solapas amplias. Confeccionado en lana mixta para máximo abrigo con estilo.', price: 189.99, category: 'abrigos', featured: true },
            { name: 'Blazer Entallado', slug: 'blazer-entallado', description: 'Blazer entallado con botón único y bolsillos de solapa. Forro interior suave. Un básico sofisticado para tu armario.', price: 119.99, category: 'abrigos', featured: true },
            { name: 'Bolso Tote de Cuero', slug: 'bolso-tote-cuero', description: 'Bolso tote amplio en cuero genuino con asas reforzadas. Interior forrado con bolsillo para laptop. Tu compañero diario.', price: 149.99, category: 'accesorios', featured: false },
            { name: 'Pañuelo de Seda Estampado', slug: 'panuelo-seda-estampado', description: 'Pañuelo cuadrado de seda pura con estampados artísticos exclusivos. Versátil: úsalo en el cuello, cabello o como accesorio de bolso.', price: 39.99, category: 'accesorios', featured: false },
        ];

        for (const p of products) {
            const catResult = await client.query('SELECT id FROM zz_categories WHERE slug = $1', [p.category]);
            const categoryId = catResult.rows[0]?.id;

            const prodResult = await client.query(
                `INSERT INTO zz_products (name, slug, description, price, category_id, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
                [p.name, p.slug, p.description, p.price, categoryId, p.featured]
            );
            const productId = prodResult.rows[0].id;

            // Add variants
            const sizes = ['XS', 'S', 'M', 'L', 'XL'];
            const colors = [
                { name: 'Beige', hex: '#EBDAC9' },
                { name: 'Marrón', hex: '#5D4032' },
                { name: 'Rosa', hex: '#BC967F' },
                { name: 'Negro', hex: '#1a1a1a' },
                { name: 'Blanco', hex: '#f5f5f5' },
            ];

            for (const size of sizes) {
                for (const color of colors.slice(0, 3)) {
                    await client.query(
                        `INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (product_id, size, color) DO NOTHING`,
                        [productId, size, color.name, color.hex, Math.floor(Math.random() * 20) + 1]
                    );
                }
            }

            const localImg = p.name.includes('Vestido') || p.name.includes('Falda') ? '/images/product_dress.png' : '/images/product_blouse.png';
            for (let i = 1; i <= 3; i++) {
                await client.query(
                    `INSERT INTO zz_product_images (product_id, url, alt_text, sort_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
                    [
                        productId,
                        localImg,
                        `${p.name} - Vista ${i}`,
                        i,
                    ]
                );
            }
        }
        console.log('✓ Products, variants, and images seeded');
        console.log('✅ Database seeded successfully!');
    } catch (err) {
        console.error('Seed error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
