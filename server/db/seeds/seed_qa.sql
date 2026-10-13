-- ============================================================================
-- BASE DE DATOS QA COMPLETA (seed_qa.sql) - SPRINT 13/10
-- zzaly E-Commerce Architecture
-- Incluye: Extensiones, Enums, Todas las Tablas de Producción + QA,
--          Triggers, Funciones Almacenadas (ACID), Índices y Datasets QA.
-- Compatible con: Supabase SQL Editor / PostgreSQL 14+
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTENSIONES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. ENUMS DE PRODUCCIÓN
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. TABLAS DE PRODUCCIÓN Y QA
-- ============================================================================

-- 3.1 Categorías
CREATE TABLE IF NOT EXISTS zz_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Productos
CREATE TABLE IF NOT EXISTS zz_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category_id INTEGER REFERENCES zz_categories(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Variantes de Inventario (Talla / Color)
CREATE TABLE IF NOT EXISTS zz_product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES zz_products(id) ON DELETE CASCADE,
    size VARCHAR(10) NOT NULL,
    color VARCHAR(50) NOT NULL,
    color_hex VARCHAR(7),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    sku VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, size, color)
);

-- 3.4 Imágenes de Productos
CREATE TABLE IF NOT EXISTS zz_product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES zz_products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 Cupones y Promociones
CREATE TABLE IF NOT EXISTS zz_promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_value DECIMAL(10, 2) DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 Órdenes de Compra
CREATE TABLE IF NOT EXISTS zz_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    promo_code_id INTEGER REFERENCES zz_promo_codes(id) ON DELETE SET NULL,
    shipping_address JSONB NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 Líneas de la Orden (Snapshot de Items)
CREATE TABLE IF NOT EXISTS zz_order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES zz_orders(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES zz_product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    size VARCHAR(10),
    color VARCHAR(50),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 Pagos (Banco Industrial / Pasarela)
CREATE TABLE IF NOT EXISTS zz_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES zz_orders(id) ON DELETE CASCADE,
    provider VARCHAR(50) DEFAULT 'banco_industrial',
    transaction_id VARCHAR(255) UNIQUE,
    status payment_status DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'GTQ',
    gateway_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 Administradores
CREATE TABLE IF NOT EXISTS zz_admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 Usuarios Generales (Clientes y Administradores unificados)
CREATE TABLE IF NOT EXISTS zz_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TRIGGERS PARA UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_modtime ON zz_categories;
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON zz_categories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_products_modtime ON zz_products;
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON zz_products FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_variants_modtime ON zz_product_variants;
CREATE TRIGGER update_variants_modtime BEFORE UPDATE ON zz_product_variants FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_promo_codes_modtime ON zz_promo_codes;
CREATE TRIGGER update_promo_codes_modtime BEFORE UPDATE ON zz_promo_codes FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_orders_modtime ON zz_orders;
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON zz_orders FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_payments_modtime ON zz_payments;
CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON zz_payments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_users_modtime ON zz_users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON zz_users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ============================================================================
-- 5. PROCEDIMIENTO ALMACENADO TRANSACCIONAL DE CHECKOUT (ACID)
-- ============================================================================
CREATE OR REPLACE FUNCTION process_checkout(
    p_user_id UUID,
    p_subtotal DECIMAL,
    p_discount_amount DECIMAL,
    p_total DECIMAL,
    p_promo_code_id INTEGER,
    p_shipping_address JSONB,
    p_contact_email VARCHAR,
    p_contact_phone VARCHAR,
    p_items JSONB
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item RECORD;
    v_stock INTEGER;
BEGIN
    -- 1. Crear Orden
    INSERT INTO zz_orders (
        user_id, subtotal, discount_amount, total, promo_code_id,
        shipping_address, contact_email, contact_phone
    )
    VALUES (
        p_user_id, p_subtotal, p_discount_amount, p_total, p_promo_code_id,
        p_shipping_address, p_contact_email, p_contact_phone
    )
    RETURNING id INTO v_order_id;

    -- 2. Procesar y verificar stock con bloqueo de fila FOR UPDATE
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        variant_id INTEGER, product_name VARCHAR, size VARCHAR, color VARCHAR, qty INTEGER, price DECIMAL
    )
    LOOP
        SELECT stock INTO v_stock 
        FROM zz_product_variants 
        WHERE id = v_item.variant_id 
        FOR UPDATE;
        
        IF v_stock IS NULL OR v_stock < v_item.qty THEN
            RAISE EXCEPTION 'Not enough stock for variant ID %', v_item.variant_id;
        END IF;

        -- Descontar inventario
        UPDATE zz_product_variants 
        SET stock = stock - v_item.qty 
        WHERE id = v_item.variant_id;

        -- Registrar ítem de la orden
        INSERT INTO zz_order_items (
            order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal
        )
        VALUES (
            v_order_id, v_item.variant_id, v_item.product_name, v_item.size, v_item.color,
            v_item.qty, v_item.price, (v_item.qty * v_item.price)
        );
    END LOOP;

    -- 3. Actualizar conteo de uso del cupón
    IF p_promo_code_id IS NOT NULL THEN
        UPDATE zz_promo_codes 
        SET used_count = used_count + 1 
        WHERE id = p_promo_code_id;
    END IF;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. ÍNDICES DE RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON zz_products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON zz_products(is_active);
CREATE INDEX IF NOT EXISTS idx_variants_product ON zz_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_size_color ON zz_product_variants(size, color);
CREATE INDEX IF NOT EXISTS idx_images_product ON zz_product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_promo_code ON zz_promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_orders_user ON zz_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON zz_orders(contact_email);
CREATE INDEX IF NOT EXISTS idx_payments_order ON zz_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON zz_users(email);
CREATE INDEX IF NOT EXISTS idx_admins_email ON zz_admins(email);

-- ============================================================================
-- 7. CUENTAS DE USUARIO PARA AMBIENTE QA
-- Passwords:
-- Admin: AdminQA_SecurePass2026!     (Hash bcrypt rounds=10)
-- Cliente: ClienteQA_SecurePass2026! (Hash bcrypt rounds=10)
-- ============================================================================
INSERT INTO zz_admins (email, password_hash, name)
VALUES 
    ('admin.qa@zzaly.com', '$2b$10$P8By4pd8ipfnJlISGJkGwOk8YYqQxxInNWE5m4fYeGSLP5bq8a6/u', 'Administrador QA')
ON CONFLICT (email) 
DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name;

INSERT INTO zz_users (email, password_hash, name, role)
VALUES 
    ('admin.qa@zzaly.com', '$2b$10$P8By4pd8ipfnJlISGJkGwOk8YYqQxxInNWE5m4fYeGSLP5bq8a6/u', 'Administrador QA', 'admin'),
    ('cliente.qa@zzaly.com', '$2b$10$NOXxXl51HEgq/FLWGqVjJ.LBQXOsER6qyh9mS.630ZmBJ7Y6oOFSe', 'Cliente QA', 'customer')
ON CONFLICT (email) 
DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- ============================================================================
-- 8. CUPONES DE PRUEBA PARA QA
-- ============================================================================
DELETE FROM zz_promo_codes 
WHERE code IN ('ZZALY10', 'VERANO25', 'FUTURO15', 'INACTIVO5', 'QA100');

INSERT INTO zz_promo_codes (code, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active)
VALUES
    -- ZZALY10: 10% descuento, activo, vigente
    ('ZZALY10', 'percentage', 10.00, 0.00, 1000, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', TRUE),

    -- VERANO25: 25% descuento, activo, vigente
    ('VERANO25', 'percentage', 25.00, 0.00, 1000, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', TRUE),

    -- FUTURO15: 15% descuento, fecha futura (no aplicable aún)
    ('FUTURO15', 'percentage', 15.00, 0.00, 1000, 0, NOW() + INTERVAL '30 days', NOW() + INTERVAL '60 days', TRUE),

    -- INACTIVO5: 5% descuento, inactivo y expirado
    ('INACTIVO5', 'percentage', 5.00, 0.00, 1000, 0, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day', FALSE),

    -- QA100: 100% descuento, activo y vigente (compras sin costo)
    ('QA100', 'percentage', 100.00, 0.00, 500, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', TRUE);

-- ============================================================================
-- 9. DATASETS DS-01 Y DS-02: CATEGORÍAS
-- ============================================================================
INSERT INTO zz_categories (name, slug) VALUES
    ('Vestidos', 'vestidos'),
    ('Blusas', 'blusas'),
    ('Pantalones', 'pantalones'),
    ('Faldas', 'faldas'),
    ('Abrigos', 'abrigos'),
    ('Accesorios', 'accesorios')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- ============================================================================
-- 10. DATASET DS-01: PRODUCTOS BASE ACTIVOS
-- ============================================================================
-- 10.1 Vestido Midi Elegante
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Vestido Midi Elegante', 'vestido-midi-elegante', 'Un elegante vestido midi con caída fluida, perfecto para cualquier ocasión.', 89.99, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'vestidos'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 89.99;

-- 10.2 Blusa de Seda Natural
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Blusa de Seda Natural', 'blusa-seda-natural', 'Blusa confeccionada en seda natural con botones de nácar.', 69.99, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'blusas'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 69.99;

-- 10.3 Pantalón Wide Leg
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Pantalón Wide Leg', 'pantalon-wide-leg', 'Pantalón de pierna ancha con tiro alto confeccionado en tela premium.', 79.99, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'pantalones'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 79.99;

-- 10.4 Falda Plisada Midi
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Falda Plisada Midi', 'falda-plisada-midi', 'Falda plisada de largo midi con cintura elástica.', 59.99, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'faldas'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 59.99;

-- 10.5 Abrigo Camel Oversize
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Abrigo Camel Oversize', 'abrigo-camel-oversize', 'Abrigo oversize en tono camel con solapas amplias y lana mixta.', 189.99, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'abrigos'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 189.99;

-- 10.6 Bolso Tote de Cuero
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Bolso Tote de Cuero', 'bolso-tote-cuero', 'Bolso tote amplio en cuero genuino con asas reforzadas.', 149.99, id, FALSE, TRUE
FROM zz_categories WHERE slug = 'accesorios'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 149.99;

-- ============================================================================
-- 11. DATASET DS-02: PRODUCTO INACTIVO DE PRUEBA (QA-INACTIVE)
-- Producto para validar exclusión en GET /products y HTTP 404 en GET /products/:id
-- ============================================================================
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Vestido Descatalogado QA', 'vestido-descatalogado-qa', 'Producto de prueba inactivo para validación de filtros y 404.', 99.99, id, FALSE, FALSE
FROM zz_categories WHERE slug = 'vestidos'
ON CONFLICT (slug) DO UPDATE SET is_active = FALSE;

-- ============================================================================
-- 12. VARIANTES DE PRODUCTOS CON COLOR NEGRO EXPLÍCITO Y CASOS DE STOCK
-- ============================================================================

-- 12.1 Variantes de Vestido Midi Elegante
DO $$
DECLARE
    v_prod_id INTEGER;
BEGIN
    SELECT id INTO v_prod_id FROM zz_products WHERE slug = 'vestido-midi-elegante';
    IF v_prod_id IS NOT NULL THEN
        INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock, sku)
        VALUES 
            (v_prod_id, 'S', 'Negro', '#111111', 20, 'VME-S-NEG'),
            (v_prod_id, 'M', 'Negro', '#111111', 15, 'VME-M-NEG'),
            (v_prod_id, 'L', 'Negro', '#111111', 10, 'VME-L-NEG'),
            (v_prod_id, 'XL', 'Negro', '#111111', 0, 'VME-XL-NEG-OUT'), -- Agotado para pruebas
            (v_prod_id, 'S', 'Beige', '#EBDAC9', 12, 'VME-S-BEI'),
            (v_prod_id, 'M', 'Beige', '#EBDAC9', 8, 'VME-M-BEI')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex;
    END IF;
END $$;

-- 12.2 Variantes de Blusa de Seda Natural
DO $$
DECLARE
    v_prod_id INTEGER;
BEGIN
    SELECT id INTO v_prod_id FROM zz_products WHERE slug = 'blusa-seda-natural';
    IF v_prod_id IS NOT NULL THEN
        INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock, sku)
        VALUES 
            (v_prod_id, 'S', 'Negro', '#111111', 25, 'BSN-S-NEG'),
            (v_prod_id, 'M', 'Negro', '#111111', 18, 'BSN-M-NEG'),
            (v_prod_id, 'L', 'Negro', '#111111', 0, 'BSN-L-NEG-OUT'), -- Agotado para pruebas
            (v_prod_id, 'S', 'Blanco', '#F5F5F5', 14, 'BSN-S-BLA'),
            (v_prod_id, 'M', 'Blanco', '#F5F5F5', 10, 'BSN-M-BLA')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex;
    END IF;
END $$;

-- 12.3 Variantes de Pantalón Wide Leg
DO $$
DECLARE
    v_prod_id INTEGER;
BEGIN
    SELECT id INTO v_prod_id FROM zz_products WHERE slug = 'pantalon-wide-leg';
    IF v_prod_id IS NOT NULL THEN
        INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock, sku)
        VALUES 
            (v_prod_id, 'S', 'Negro', '#111111', 30, 'PWL-S-NEG'),
            (v_prod_id, 'M', 'Negro', '#111111', 22, 'PWL-M-NEG'),
            (v_prod_id, 'L', 'Negro', '#111111', 15, 'PWL-L-NEG'),
            (v_prod_id, 'S', 'Beige', '#EBDAC9', 10, 'PWL-S-BEI')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex;
    END IF;
END $$;

-- 12.4 Variantes de Falda Plisada Midi
DO $$
DECLARE
    v_prod_id INTEGER;
BEGIN
    SELECT id INTO v_prod_id FROM zz_products WHERE slug = 'falda-plisada-midi';
    IF v_prod_id IS NOT NULL THEN
        INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock, sku)
        VALUES 
            (v_prod_id, 'S', 'Negro', '#111111', 18, 'FPM-S-NEG'),
            (v_prod_id, 'M', 'Negro', '#111111', 12, 'FPM-M-NEG'),
            (v_prod_id, 'L', 'Negro', '#111111', 5, 'FPM-L-NEG')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex;
    END IF;
END $$;

-- 12.5 Variantes de Abrigo Camel Oversize
DO $$
DECLARE
    v_prod_id INTEGER;
BEGIN
    SELECT id INTO v_prod_id FROM zz_products WHERE slug = 'abrigo-camel-oversize';
    IF v_prod_id IS NOT NULL THEN
        INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock, sku)
        VALUES 
            (v_prod_id, 'M', 'Negro', '#111111', 10, 'ACO-M-NEG'),
            (v_prod_id, 'L', 'Negro', '#111111', 8, 'ACO-L-NEG'),
            (v_prod_id, 'M', 'Camel', '#C19A6B', 15, 'ACO-M-CAM')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex;
    END IF;
END $$;

-- 12.6 Variantes de Producto Inactivo (para verificar que no se listen)
DO $$
DECLARE
    v_prod_id INTEGER;
BEGIN
    SELECT id INTO v_prod_id FROM zz_products WHERE slug = 'vestido-descatalogado-qa';
    IF v_prod_id IS NOT NULL THEN
        INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock, sku)
        VALUES 
            (v_prod_id, 'M', 'Negro', '#111111', 5, 'VDQ-M-NEG')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock;
    END IF;
END $$;

-- ============================================================================
-- 13. IMÁGENES DE DEMOSTRACIÓN PARA PRODUCTOS
-- ============================================================================
INSERT INTO zz_product_images (product_id, url, alt_text, sort_order)
SELECT p.id, '/images/product_dress.png', p.name || ' - Vista Principal', 1
FROM zz_products p
WHERE p.is_active = TRUE
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- 14. CONSULTA DE VALIDACIÓN DEL ESTADO FINAL DE QA
-- ============================================================================
SELECT 'Tablas creadas y verificadas' as concepto, '10 tablas (zz_*)' as detalle
UNION ALL
SELECT 'Procedimiento process_checkout', 'Instalado con bloqueo FOR UPDATE'
UNION ALL
SELECT 'Triggers de updated_at', 'Activos en 7 tablas'
UNION ALL
SELECT 'Categorías activas', COUNT(*)::text FROM zz_categories
UNION ALL
SELECT 'Productos activos (is_active=TRUE)', COUNT(*)::text FROM zz_products WHERE is_active = TRUE
UNION ALL
SELECT 'Productos inactivos (is_active=FALSE)', COUNT(*)::text FROM zz_products WHERE is_active = FALSE
UNION ALL
SELECT 'Variantes registradas con color Negro', COUNT(*)::text FROM zz_product_variants WHERE color = 'Negro'
UNION ALL
SELECT 'Cupones QA vigentes/prueba', COUNT(*)::text FROM zz_promo_codes WHERE code IN ('ZZALY10', 'VERANO25', 'FUTURO15', 'INACTIVO5', 'QA100')
UNION ALL
SELECT 'Usuarios QA autenticables', COUNT(*)::text FROM zz_users WHERE email IN ('admin.qa@zzaly.com', 'cliente.qa@zzaly.com');
