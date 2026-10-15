-- ============================================================================
-- MIGRACIÓN: zz_customers, idempotencia y relación con órdenes
-- Fecha: 13/10/2026
-- ============================================================================

BEGIN;

-- 1. Tabla zz_customers
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

-- Trigger para updated_at en zz_customers
DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_customers_modtime ON zz_customers;
    CREATE TRIGGER update_customers_modtime 
    BEFORE UPDATE ON zz_customers 
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_email ON zz_customers(LOWER(email));

-- Semilla inicial del cliente QA en zz_customers
INSERT INTO zz_customers (name, email, password_hash, phone, role)
VALUES (
    'Cliente QA',
    'cliente.qa@zzaly.com',
    '$2b$10$NOXxXl51HEgq/FLWGqVjJ.LBQXOsER6qyh9mS.630ZmBJ7Y6oOFSe',
    '55512345',
    'customer'
)
ON CONFLICT (email) 
DO UPDATE SET 
    phone = '55512345',
    role = 'customer';

-- 2. Modificaciones a la tabla zz_orders y estados
DO $$ BEGIN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid' AFTER 'pending';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN OTHERS THEN null;
END $$;

ALTER TABLE zz_orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES zz_customers(id) ON DELETE SET NULL;
ALTER TABLE zz_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);
ALTER TABLE zz_orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON zz_orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON zz_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON zz_orders(order_number);

-- 3. Actualizar función almacenada process_checkout
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

COMMIT;
