-- ==========================================
-- zzaly Robust E-Commerce Schema (Supabase)
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
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

-- Drop old tables
DROP TABLE IF EXISTS zz_payments CASCADE;
DROP TABLE IF EXISTS zz_order_items CASCADE;
DROP TABLE IF EXISTS zz_orders CASCADE;
DROP TABLE IF EXISTS zz_promo_codes CASCADE;
DROP TABLE IF EXISTS zz_product_images CASCADE;
DROP TABLE IF EXISTS zz_product_variants CASCADE;
DROP TABLE IF EXISTS zz_products CASCADE;
DROP TABLE IF EXISTS zz_categories CASCADE;

-- 3. TABLES

-- Categories
CREATE TABLE zz_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE zz_products (
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

-- Variants (Inventory)
CREATE TABLE zz_product_variants (
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

-- Images
CREATE TABLE zz_product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES zz_products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo Codes
CREATE TABLE zz_promo_codes (
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

-- Orders
CREATE TABLE zz_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- For now, without strict auth.users reference (simplification for testing)
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

-- Order Items (Snapshot)
CREATE TABLE zz_order_items (
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

-- Payments (Scaffolding for Banco Industrial)
CREATE TABLE zz_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES zz_orders(id) ON DELETE CASCADE,
    provider VARCHAR(50) DEFAULT 'banco_industrial',
    transaction_id VARCHAR(255) UNIQUE,
    status payment_status DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'GTQ', -- Defaulted to Quetzales for Banco Industrial, but can be USD
    gateway_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- 5. TRANSACTIONAL PROCEDURE FOR CHECKOUT (ACID)
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
    -- 1. Create the Order
    INSERT INTO zz_orders (user_id, subtotal, discount_amount, total, promo_code_id, shipping_address, contact_email, contact_phone)
    VALUES (p_user_id, p_subtotal, p_discount_amount, p_total, p_promo_code_id, p_shipping_address, p_contact_email, p_contact_phone)
    RETURNING id INTO v_order_id;

    -- 2. Process items securely
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(variant_id INTEGER, product_name VARCHAR, size VARCHAR, color VARCHAR, qty INTEGER, price DECIMAL)
    LOOP
        -- Lock the row for update
        SELECT stock INTO v_stock FROM zz_product_variants WHERE id = v_item.variant_id FOR UPDATE;
        
        IF v_stock < v_item.qty THEN
            RAISE EXCEPTION 'Not enough stock for variant ID %', v_item.variant_id;
        END IF;

        -- Deduct stock
        UPDATE zz_product_variants SET stock = stock - v_item.qty WHERE id = v_item.variant_id;

        -- Insert order item
        INSERT INTO zz_order_items (order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal)
        VALUES (v_order_id, v_item.variant_id, v_item.product_name, v_item.size, v_item.color, v_item.qty, v_item.price, (v_item.qty * v_item.price));
    END LOOP;

    -- 3. Update promo code usage if applicable
    IF p_promo_code_id IS NOT NULL THEN
        UPDATE zz_promo_codes 
        SET used_count = used_count + 1 
        WHERE id = p_promo_code_id;
    END IF;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 6. INDEXES FOR SPEED
CREATE INDEX IF NOT EXISTS idx_products_category ON zz_products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON zz_products(is_active);
CREATE INDEX IF NOT EXISTS idx_variants_product ON zz_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_images_product ON zz_product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_promo_code ON zz_promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_orders_user ON zz_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON zz_payments(order_id);
