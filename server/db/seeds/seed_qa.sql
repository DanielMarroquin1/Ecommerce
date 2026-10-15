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
    CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid' AFTER 'pending';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN OTHERS THEN null;
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
    customer_id INTEGER,
    order_number VARCHAR(100),
    idempotency_key VARCHAR(255),
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

-- 3.11 Clientes (zz_customers)
CREATE TABLE IF NOT EXISTS zz_customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
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
    p_items JSONB,
    p_customer_id INTEGER DEFAULT NULL,
    p_order_number VARCHAR DEFAULT NULL,
    p_idempotency_key VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item RECORD;
    v_stock INTEGER;
BEGIN
    -- Control de idempotencia a nivel transaccional
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_order_id FROM zz_orders WHERE idempotency_key = p_idempotency_key;
        IF v_order_id IS NOT NULL THEN
            RETURN v_order_id;
        END IF;
    END IF;

    -- 1. Crear Orden con número legible y clave de idempotencia
    INSERT INTO zz_orders (
        user_id, subtotal, discount_amount, total, promo_code_id,
        shipping_address, contact_email, contact_phone,
        customer_id, order_number, idempotency_key
    )
    VALUES (
        p_user_id, p_subtotal, p_discount_amount, p_total, p_promo_code_id,
        p_shipping_address, p_contact_email, p_contact_phone,
        p_customer_id, p_order_number, p_idempotency_key
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
    ('qa.cliente01@zzaly.test', '$2b$10$NOXxXl51HEgq/FLWGqVjJ.LBQXOsER6qyh9mS.630ZmBJ7Y6oOFSe', 'QA Cliente 01', 'customer'),
    ('cliente.qa@zzaly.com', '$2b$10$NOXxXl51HEgq/FLWGqVjJ.LBQXOsER6qyh9mS.630ZmBJ7Y6oOFSe', 'Cliente QA', 'customer')
ON CONFLICT (email) 
DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

INSERT INTO zz_customers (email, password_hash, name, phone, role)
VALUES 
    ('qa.cliente01@zzaly.test', '$2b$10$NOXxXl51HEgq/FLWGqVjJ.LBQXOsER6qyh9mS.630ZmBJ7Y6oOFSe', 'QA Cliente 01', '55512345', 'customer'),
    ('cliente.qa@zzaly.com', '$2b$10$NOXxXl51HEgq/FLWGqVjJ.LBQXOsER6qyh9mS.630ZmBJ7Y6oOFSe', 'Cliente QA', '55512345', 'customer')
ON CONFLICT (email) 
DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
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

    -- VERANO25: 25% descuento, VENCIDO (expirado hace 5 días)
    ('VERANO25', 'percentage', 25.00, 0.00, 1000, 0, NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days', TRUE),

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
-- 10. PRODUCTOS BASE ACTIVOS Y CASOS CONCRETOS QA
-- ============================================================================

-- 10.1 Vestido Floral Lía (Q350.00) — Caso Concreto QA
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Vestido Floral Lía', 'vestido-floral-lia', 'Vestido floral elegante con corte estilizado y caída fresca.', 350.00, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'vestidos'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 350.00, name = 'Vestido Floral Lía';

-- 10.2 Blusa Seda Ana (Q175.00) — Caso Concreto QA
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Blusa Seda Ana', 'blusa-seda-ana', 'Blusa de seda natural de alta calidad y tacto suave.', 175.00, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'blusas'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 175.00, name = 'Blusa Seda Ana';

-- 10.3 Pantalón Casual Vera (Q150.00 exacto) — Caso Concreto QA
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Pantalón Casual Vera', 'pantalon-casual-vera', 'Pantalón casual de corte recto para uso diario con acabados de primera.', 150.00, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'pantalones'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 150.00, name = 'Pantalón Casual Vera';

-- 10.4 Vestido Midi Elegante (Base)
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Vestido Midi Elegante', 'vestido-midi-elegante', 'Un elegante vestido midi con caída fluida, perfecto para cualquier ocasión.', 89.99, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'vestidos'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 89.99;

-- 10.5 Blusa de Seda Natural (Base)
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Blusa de Seda Natural', 'blusa-seda-natural', 'Blusa confeccionada en seda natural con botones de nácar.', 69.99, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'blusas'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 69.99;

-- 10.6 Pantalón Wide Leg (Base)
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Pantalón Wide Leg', 'pantalon-wide-leg', 'Pantalón de pierna ancha con tiro alto confeccionado en tela premium.', 79.99, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'pantalones'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 79.99;

-- 10.7 Falda Plisada Midi (Base)
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Falda Plisada Midi', 'falda-plisada-midi', 'Falda plisada de largo midi con cintura elástica.', 59.99, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'faldas'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 59.99;

-- 10.8 Abrigo Camel Oversize (Base)
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Abrigo Camel Oversize', 'abrigo-camel-oversize', 'Abrigo oversize en tono camel con solapas amplias y lana mixta.', 189.99, id, TRUE, TRUE
FROM zz_categories WHERE slug = 'abrigos'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 189.99;

-- 10.9 Bolso Tote de Cuero (Base)
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Bolso Tote de Cuero', 'bolso-tote-cuero', 'Bolso tote amplio en cuero genuino con asas reforzadas.', 149.99, id, FALSE, TRUE
FROM zz_categories WHERE slug = 'accesorios'
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, price = 149.99;

-- ============================================================================
-- 11. PRODUCTOS INACTIVOS DE PRUEBA (QA-INACTIVE)
-- ============================================================================

-- 11.1 Blusa Retirada QA (Inactiva) — Caso Concreto QA
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Blusa Retirada QA', 'blusa-retirada-qa', 'Blusa inactiva de control para validar 404 en detalle y exclusión en catálogo.', 99.99, id, FALSE, FALSE
FROM zz_categories WHERE slug = 'blusas'
ON CONFLICT (slug) DO UPDATE SET is_active = FALSE, name = 'Blusa Retirada QA';

-- 11.2 Vestido Descatalogado QA (Inactivo)
INSERT INTO zz_products (name, slug, description, price, category_id, is_featured, is_active)
SELECT 'Vestido Descatalogado QA', 'vestido-descatalogado-qa', 'Producto de prueba inactivo para validación de filtros y 404.', 99.99, id, FALSE, FALSE
FROM zz_categories WHERE slug = 'vestidos'
ON CONFLICT (slug) DO UPDATE SET is_active = FALSE;

-- ============================================================================
-- 12. VARIANTES DE PRODUCTOS (CASOS CONCRETOS QA)
-- ============================================================================

-- 12.1 Variantes de Vestido Floral Lía: Talla L/Negro en Stock 0 (Caso Concreto)
DO $$
DECLARE
    v_prod_id INTEGER;
BEGIN
    SELECT id INTO v_prod_id FROM zz_products WHERE slug = 'vestido-floral-lia';
    IF v_prod_id IS NOT NULL THEN
        INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock, sku)
        VALUES 
            (v_prod_id, 'L', 'Negro', '#111111', 0, 'VFL-L-NEG-OUT'),  -- TALLA L/NEGRO EN STOCK 0
            (v_prod_id, 'M', 'Negro', '#111111', 10, 'VFL-M-NEG'),
            (v_prod_id, 'S', 'Negro', '#111111', 8, 'VFL-S-NEG')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex;
    END IF;
END $$;

-- 12.2 Variantes de Blusa Seda Ana: Talla S en Stock 5 (Caso Concreto)
DO $$
DECLARE
    v_prod_id INTEGER;
BEGIN
    SELECT id INTO v_prod_id FROM zz_products WHERE slug = 'blusa-seda-ana';
    IF v_prod_id IS NOT NULL THEN
        INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock, sku)
        VALUES 
            (v_prod_id, 'S', 'Negro', '#111111', 5, 'BSA-S-NEG-5'),    -- TALLA S EN STOCK 5
            (v_prod_id, 'M', 'Negro', '#111111', 12, 'BSA-M-NEG')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex;
    END IF;
END $$;

-- 12.3 Variantes de Pantalón Casual Vera (Q150.00 exacto)
DO $$
DECLARE
    v_prod_id INTEGER;
BEGIN
    SELECT id INTO v_prod_id FROM zz_products WHERE slug = 'pantalon-casual-vera';
    IF v_prod_id IS NOT NULL THEN
        INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock, sku)
        VALUES 
            (v_prod_id, 'M', 'Negro', '#111111', 15, 'PCV-M-NEG'),
            (v_prod_id, 'L', 'Negro', '#111111', 10, 'PCV-L-NEG')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex;
    END IF;
END $$;

-- 12.4 Variantes de Vestido Midi Elegante (Base)
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
            (v_prod_id, 'XL', 'Negro', '#111111', 0, 'VME-XL-NEG-OUT'),
            (v_prod_id, 'S', 'Beige', '#EBDAC9', 12, 'VME-S-BEI'),
            (v_prod_id, 'M', 'Beige', '#EBDAC9', 8, 'VME-M-BEI')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex;
    END IF;
END $$;

-- 12.5 Variantes de Blusa de Seda Natural (Base)
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
            (v_prod_id, 'L', 'Negro', '#111111', 0, 'BSN-L-NEG-OUT')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex;
    END IF;
END $$;

-- 12.6 Variantes de Blusa Retirada QA (Inactiva)
DO $$
DECLARE
    v_prod_id INTEGER;
BEGIN
    SELECT id INTO v_prod_id FROM zz_products WHERE slug = 'blusa-retirada-qa';
    IF v_prod_id IS NOT NULL THEN
        INSERT INTO zz_product_variants (product_id, size, color, color_hex, stock, sku)
        VALUES 
            (v_prod_id, 'M', 'Negro', '#111111', 5, 'BRQ-M-NEG')
        ON CONFLICT (product_id, size, color) 
        DO UPDATE SET stock = EXCLUDED.stock;
    END IF;
END $$;

-- 12.7 Variantes de Vestido Descatalogado QA
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
SELECT p.id, 
       CASE 
           WHEN p.name ILIKE '%Vestido%' THEN '/images/product_dress.png'
           ELSE '/images/product_blouse.png'
       END, 
       p.name || ' - Vista Principal', 1
FROM zz_products p
WHERE p.is_active = TRUE
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. 3 ÓRDENES DE PRUEBA QA (TOTAL ACUMULADO Q1,015.00, UNA ENTREGADA)
-- Orden 1: Q350.00 | Estado: delivered (Entregada)
-- Orden 2: Q515.00 | Estado: paid (Pagada)
-- Orden 3: Q150.00 | Estado: pending (Pendiente)
-- Total suma: 350.00 + 515.00 + 150.00 = Q1,015.00 exactos
-- ============================================================================
DO $$
DECLARE
    v_cust_id INTEGER;
    v_var_floral INTEGER;
    v_var_ana INTEGER;
    v_var_vera INTEGER;
    v_order1_id UUID := 'c1111111-1111-4111-8111-111111111111';
    v_order2_id UUID := 'c2222222-2222-4222-8222-222222222222';
    v_order3_id UUID := 'c3333333-3333-4333-8333-333333333333';
BEGIN
    SELECT id INTO v_cust_id FROM zz_customers WHERE email = 'qa.cliente01@zzaly.test';
    
    SELECT pv.id INTO v_var_floral 
    FROM zz_product_variants pv 
    JOIN zz_products p ON pv.product_id = p.id 
    WHERE p.slug = 'vestido-floral-lia' AND pv.size = 'M' LIMIT 1;

    SELECT pv.id INTO v_var_ana 
    FROM zz_product_variants pv 
    JOIN zz_products p ON pv.product_id = p.id 
    WHERE p.slug = 'blusa-seda-ana' AND pv.size = 'S' LIMIT 1;

    SELECT pv.id INTO v_var_vera 
    FROM zz_product_variants pv 
    JOIN zz_products p ON pv.product_id = p.id 
    WHERE p.slug = 'pantalon-casual-vera' AND pv.size = 'M' LIMIT 1;

    -- Limpieza previa de estas 3 órdenes específicas si existen
    DELETE FROM zz_order_items WHERE order_id IN (v_order1_id, v_order2_id, v_order3_id);
    DELETE FROM zz_payments WHERE order_id IN (v_order1_id, v_order2_id, v_order3_id);
    DELETE FROM zz_orders WHERE id IN (v_order1_id, v_order2_id, v_order3_id);

    -- 1. Orden 1: Q350.00 — Estado "delivered" (Entregada)
    INSERT INTO zz_orders (
        id, customer_id, order_number, contact_email, contact_phone, 
        shipping_address, subtotal, discount_amount, total, status, created_at
    ) VALUES (
        v_order1_id, v_cust_id, 'ORD-QA-1001', 'qa.cliente01@zzaly.test', '55512345',
        '{"address": "Avenida Reforma 10-00 Zona 9, Ciudad de Guatemala", "customerName": "QA Cliente 01"}'::jsonb,
        350.00, 0.00, 350.00, 'delivered', NOW() - INTERVAL '4 days'
    );
    INSERT INTO zz_order_items (order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal)
    VALUES (v_order1_id, v_var_floral, 'Vestido Floral Lía', 'M', 'Negro', 1, 350.00, 350.00);

    -- 2. Orden 2: Q515.00 — Estado "paid" (Pagada)
    INSERT INTO zz_orders (
        id, customer_id, order_number, contact_email, contact_phone, 
        shipping_address, subtotal, discount_amount, total, status, created_at
    ) VALUES (
        v_order2_id, v_cust_id, 'ORD-QA-1002', 'qa.cliente01@zzaly.test', '55512345',
        '{"address": "Diagonal 6 12-42 Zona 10, Ciudad de Guatemala", "customerName": "QA Cliente 01"}'::jsonb,
        515.00, 0.00, 515.00, 'paid', NOW() - INTERVAL '2 days'
    );
    -- 2x Blusa Seda Ana (2 * 175 = 350) + 1x Top/Accesorio (165) = 515.00
    INSERT INTO zz_order_items (order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal)
    VALUES 
        (v_order2_id, v_var_ana, 'Blusa Seda Ana', 'S', 'Negro', 2, 175.00, 350.00),
        (v_order2_id, v_var_floral, 'Vestido Floral Lía (Especial QA)', 'M', 'Negro', 1, 165.00, 165.00);

    -- 3. Orden 3: Q150.00 — Estado "pending" (Pendiente)
    INSERT INTO zz_orders (
        id, customer_id, order_number, contact_email, contact_phone, 
        shipping_address, subtotal, discount_amount, total, status, created_at
    ) VALUES (
        v_order3_id, v_cust_id, 'ORD-QA-1003', 'qa.cliente01@zzaly.test', '55512345',
        '{"address": "Carretera a El Salvador Km 14.5, Santa Catarina Pinula", "customerName": "QA Cliente 01"}'::jsonb,
        150.00, 0.00, 150.00, 'pending', NOW()
    );
    INSERT INTO zz_order_items (order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal)
    VALUES (v_order3_id, v_var_vera, 'Pantalón Casual Vera', 'M', 'Negro', 1, 150.00, 150.00);

END $$;

COMMIT;

-- ============================================================================
-- 15. CONSULTA DE VALIDACIÓN DEL ESTADO FINAL DE QA
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
SELECT 'Vestido Floral Lía (Q350)', COUNT(*)::text FROM zz_products WHERE slug = 'vestido-floral-lia' AND price = 350.00
UNION ALL
SELECT 'Blusa Seda Ana (Q175)', COUNT(*)::text FROM zz_products WHERE slug = 'blusa-seda-ana' AND price = 175.00
UNION ALL
SELECT 'Pantalón Casual Vera (Q150)', COUNT(*)::text FROM zz_products WHERE slug = 'pantalon-casual-vera' AND price = 150.00
UNION ALL
SELECT 'Blusa Retirada QA (Inactiva)', COUNT(*)::text FROM zz_products WHERE slug = 'blusa-retirada-qa' AND is_active = FALSE
UNION ALL
SELECT 'L/Negro Stock 0 en Floral Lía', COUNT(*)::text FROM zz_product_variants pv JOIN zz_products p ON pv.product_id = p.id WHERE p.slug = 'vestido-floral-lia' AND pv.size = 'L' AND pv.color = 'Negro' AND pv.stock = 0
UNION ALL
SELECT 'S/Negro Stock 5 en Seda Ana', COUNT(*)::text FROM zz_product_variants pv JOIN zz_products p ON pv.product_id = p.id WHERE p.slug = 'blusa-seda-ana' AND pv.size = 'S' AND pv.stock = 5
UNION ALL
SELECT 'Cupones QA (ZZALY10, VERANO25, FUTURO15, INACTIVO5, QA100)', COUNT(*)::text FROM zz_promo_codes WHERE code IN ('ZZALY10', 'VERANO25', 'FUTURO15', 'INACTIVO5', 'QA100')
UNION ALL
SELECT 'VERANO25 Vencido (valid_until < NOW)', COUNT(*)::text FROM zz_promo_codes WHERE code = 'VERANO25' AND valid_until < NOW()
UNION ALL
SELECT '3 Órdenes de prueba QA creadas', COUNT(*)::text FROM zz_orders WHERE order_number IN ('ORD-QA-1001', 'ORD-QA-1002', 'ORD-QA-1003')
UNION ALL
SELECT 'Total acumulado 3 órdenes QA', COALESCE(SUM(total), 0)::text FROM zz_orders WHERE order_number IN ('ORD-QA-1001', 'ORD-QA-1002', 'ORD-QA-1003')
UNION ALL
SELECT 'Orden en estado Entregada (delivered)', COUNT(*)::text FROM zz_orders WHERE order_number IN ('ORD-QA-1001', 'ORD-QA-1002', 'ORD-QA-1003') AND status = 'delivered'
UNION ALL
SELECT 'Cuenta QA cliente qa.cliente01@zzaly.test', COUNT(*)::text FROM zz_customers WHERE email = 'qa.cliente01@zzaly.test';

