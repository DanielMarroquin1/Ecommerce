-- ============================================================================
-- RESPALDO DE BASE DE DATOS QA — zzaly E-Commerce
-- Fecha de Creación: 2026-10-28T04:26:11.031Z
-- Host: aws-1-us-west-2.pooler.supabase.com
-- Base de Datos: postgres (Ambiente QA)
-- Responsable: Daniel Marroquín (Backend Lead)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Tabla: zz_categories (6 registros)
-- ----------------------------------------------------------------------------
INSERT INTO zz_categories (id, name, slug, created_at, updated_at) VALUES (1, 'Vestidos', 'vestidos', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_categories (id, name, slug, created_at, updated_at) VALUES (2, 'Blusas', 'blusas', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_categories (id, name, slug, created_at, updated_at) VALUES (3, 'Pantalones', 'pantalones', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_categories (id, name, slug, created_at, updated_at) VALUES (4, 'Faldas', 'faldas', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_categories (id, name, slug, created_at, updated_at) VALUES (5, 'Abrigos', 'abrigos', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_categories (id, name, slug, created_at, updated_at) VALUES (6, 'Accesorios', 'accesorios', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Tabla: zz_products (11 registros)
-- ----------------------------------------------------------------------------
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (1, 'Vestido Floral Lía', 'vestido-floral-lia', 'Vestido floral elegante con corte estilizado y caída fresca.', '350.00', 1, TRUE, TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (2, 'Blusa Seda Ana', 'blusa-seda-ana', 'Blusa de seda natural de alta calidad y tacto suave.', '175.00', 2, TRUE, TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (3, 'Pantalón Casual Vera', 'pantalon-casual-vera', 'Pantalón casual de corte recto para uso diario con acabados de primera.', '150.00', 3, TRUE, TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (4, 'Vestido Midi Elegante', 'vestido-midi-elegante', 'Un elegante vestido midi con caída fluida, perfecto para cualquier ocasión.', '89.99', 1, TRUE, TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (5, 'Blusa de Seda Natural', 'blusa-seda-natural', 'Blusa confeccionada en seda natural con botones de nácar.', '69.99', 2, TRUE, TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (6, 'Pantalón Wide Leg', 'pantalon-wide-leg', 'Pantalón de pierna ancha con tiro alto confeccionado en tela premium.', '79.99', 3, TRUE, TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (7, 'Falda Plisada Midi', 'falda-plisada-midi', 'Falda plisada de largo midi con cintura elástica.', '59.99', 4, TRUE, TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (8, 'Abrigo Camel Oversize', 'abrigo-camel-oversize', 'Abrigo oversize en tono camel con solapas amplias y lana mixta.', '189.99', 5, TRUE, TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (9, 'Bolso Tote de Cuero', 'bolso-tote-cuero', 'Bolso tote amplio en cuero genuino con asas reforzadas.', '149.99', 6, FALSE, TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (10, 'Blusa Retirada QA', 'blusa-retirada-qa', 'Blusa inactiva de control para validar 404 en detalle y exclusión en catálogo.', '99.99', 2, FALSE, FALSE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_products (id, name, slug, description, price, category_id, is_featured, is_active, created_at, updated_at) VALUES (11, 'Vestido Descatalogado QA', 'vestido-descatalogado-qa', 'Producto de prueba inactivo para validación de filtros y 404.', '99.99', 1, FALSE, FALSE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Tabla: zz_product_variants (18 registros)
-- ----------------------------------------------------------------------------
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (1, 1, 'L', 'Negro', '#111111', 0, 'VFL-L-NEG-OUT', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (2, 1, 'M', 'Negro', '#111111', 10, 'VFL-M-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (3, 1, 'S', 'Negro', '#111111', 8, 'VFL-S-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (4, 2, 'S', 'Negro', '#111111', 5, 'BSA-S-NEG-5', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (5, 2, 'M', 'Negro', '#111111', 12, 'BSA-M-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (6, 3, 'M', 'Negro', '#111111', 15, 'PCV-M-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (7, 3, 'L', 'Negro', '#111111', 10, 'PCV-L-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (8, 4, 'S', 'Negro', '#111111', 20, 'VME-S-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (9, 4, 'M', 'Negro', '#111111', 15, 'VME-M-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (10, 4, 'L', 'Negro', '#111111', 10, 'VME-L-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (11, 4, 'XL', 'Negro', '#111111', 0, 'VME-XL-NEG-OUT', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (12, 4, 'S', 'Beige', '#EBDAC9', 12, 'VME-S-BEI', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (13, 4, 'M', 'Beige', '#EBDAC9', 8, 'VME-M-BEI', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (14, 5, 'S', 'Negro', '#111111', 25, 'BSN-S-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (15, 5, 'M', 'Negro', '#111111', 18, 'BSN-M-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (16, 5, 'L', 'Negro', '#111111', 0, 'BSN-L-NEG-OUT', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (17, 10, 'M', 'Negro', '#111111', 5, 'BRQ-M-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_variants (id, product_id, size, color, color_hex, stock, sku, created_at, updated_at) VALUES (18, 11, 'M', 'Negro', '#111111', 5, 'VDQ-M-NEG', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Tabla: zz_product_images (9 registros)
-- ----------------------------------------------------------------------------
INSERT INTO zz_product_images (id, product_id, url, alt_text, sort_order, created_at) VALUES (1, 1, '/images/product_dress.png', 'Vestido Floral Lía - Vista Principal', 1, '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_images (id, product_id, url, alt_text, sort_order, created_at) VALUES (2, 2, '/images/product_blouse.png', 'Blusa Seda Ana - Vista Principal', 1, '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_images (id, product_id, url, alt_text, sort_order, created_at) VALUES (3, 3, '/images/product_blouse.png', 'Pantalón Casual Vera - Vista Principal', 1, '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_images (id, product_id, url, alt_text, sort_order, created_at) VALUES (4, 4, '/images/product_dress.png', 'Vestido Midi Elegante - Vista Principal', 1, '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_images (id, product_id, url, alt_text, sort_order, created_at) VALUES (5, 5, '/images/product_blouse.png', 'Blusa de Seda Natural - Vista Principal', 1, '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_images (id, product_id, url, alt_text, sort_order, created_at) VALUES (6, 6, '/images/product_blouse.png', 'Pantalón Wide Leg - Vista Principal', 1, '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_images (id, product_id, url, alt_text, sort_order, created_at) VALUES (7, 7, '/images/product_blouse.png', 'Falda Plisada Midi - Vista Principal', 1, '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_images (id, product_id, url, alt_text, sort_order, created_at) VALUES (8, 8, '/images/product_blouse.png', 'Abrigo Camel Oversize - Vista Principal', 1, '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_product_images (id, product_id, url, alt_text, sort_order, created_at) VALUES (9, 9, '/images/product_blouse.png', 'Bolso Tote de Cuero - Vista Principal', 1, '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Tabla: zz_promo_codes (5 registros)
-- ----------------------------------------------------------------------------
INSERT INTO zz_promo_codes (id, code, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at, updated_at) VALUES (1, 'ZZALY10', 'percentage', '10.00', '0.00', 1000, 0, '2026-10-27T04:24:39.781Z', '2027-01-26T04:24:39.781Z', TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_promo_codes (id, code, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at, updated_at) VALUES (2, 'VERANO25', 'percentage', '25.00', '0.00', 1000, 0, '2026-08-29T04:24:39.781Z', '2026-10-23T04:24:39.781Z', TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_promo_codes (id, code, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at, updated_at) VALUES (3, 'FUTURO15', 'percentage', '15.00', '0.00', 1000, 0, '2026-11-27T04:24:39.781Z', '2026-12-27T04:24:39.781Z', TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_promo_codes (id, code, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at, updated_at) VALUES (4, 'INACTIVO5', 'percentage', '5.00', '0.00', 1000, 0, '2026-09-28T04:24:39.781Z', '2026-10-27T04:24:39.781Z', FALSE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_promo_codes (id, code, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at, updated_at) VALUES (5, 'QA100', 'percentage', '100.00', '0.00', 500, 0, '2026-10-27T04:24:39.781Z', '2027-01-26T04:24:39.781Z', TRUE, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Tabla: zz_admins (1 registros)
-- ----------------------------------------------------------------------------
INSERT INTO zz_admins (id, email, password_hash, name, created_at) VALUES (1, 'admin.qa@zzaly.com', '$2b$10$P8By4pd8ipfnJlISGJkGwOk8YYqQxxInNWE5m4fYeGSLP5bq8a6/u', 'Administrador QA', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Tabla: zz_users (3 registros)
-- ----------------------------------------------------------------------------
INSERT INTO zz_users (id, email, password_hash, name, role, created_at, updated_at) VALUES (1, 'admin.qa@zzaly.com', '$2b$10$P8By4pd8ipfnJlISGJkGwOk8YYqQxxInNWE5m4fYeGSLP5bq8a6/u', 'Administrador QA', 'admin', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_users (id, email, password_hash, name, role, created_at, updated_at) VALUES (2, 'qa.cliente01@zzaly.test', '$2b$10$NOXxXl51HEgq/FLWGqVjJ.LBQXOsER6qyh9mS.630ZmBJ7Y6oOFSe', 'QA Cliente 01', 'customer', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_users (id, email, password_hash, name, role, created_at, updated_at) VALUES (3, 'cliente.qa@zzaly.com', '$2b$10$NOXxXl51HEgq/FLWGqVjJ.LBQXOsER6qyh9mS.630ZmBJ7Y6oOFSe', 'Cliente QA', 'customer', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Tabla: zz_customers (2 registros)
-- ----------------------------------------------------------------------------
INSERT INTO zz_customers (id, name, email, password_hash, phone, role, created_at, updated_at) VALUES (1, 'QA Cliente 01', 'qa.cliente01@zzaly.test', '$2b$10$NOXxXl51HEgq/FLWGqVjJ.LBQXOsER6qyh9mS.630ZmBJ7Y6oOFSe', '55512345', 'customer', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_customers (id, name, email, password_hash, phone, role, created_at, updated_at) VALUES (2, 'Cliente QA', 'cliente.qa@zzaly.com', '$2b$10$NOXxXl51HEgq/FLWGqVjJ.LBQXOsER6qyh9mS.630ZmBJ7Y6oOFSe', '55512345', 'customer', '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Tabla: zz_orders (3 registros)
-- ----------------------------------------------------------------------------
INSERT INTO zz_orders (id, user_id, status, subtotal, discount_amount, total, promo_code_id, shipping_address, contact_email, contact_phone, notes, customer_id, order_number, idempotency_key, created_at, updated_at) VALUES ('c1111111-1111-4111-8111-111111111111', NULL, 'delivered', '350.00', '0.00', '350.00', NULL, '{"address":"Avenida Reforma 10-00 Zona 9, Ciudad de Guatemala","customerName":"QA Cliente 01"}'::jsonb, 'qa.cliente01@zzaly.test', '55512345', NULL, 1, 'ORD-QA-1001', NULL, '2026-10-24T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_orders (id, user_id, status, subtotal, discount_amount, total, promo_code_id, shipping_address, contact_email, contact_phone, notes, customer_id, order_number, idempotency_key, created_at, updated_at) VALUES ('c2222222-2222-4222-8222-222222222222', NULL, 'paid', '515.00', '0.00', '515.00', NULL, '{"address":"Diagonal 6 12-42 Zona 10, Ciudad de Guatemala","customerName":"QA Cliente 01"}'::jsonb, 'qa.cliente01@zzaly.test', '55512345', NULL, 1, 'ORD-QA-1002', NULL, '2026-10-26T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_orders (id, user_id, status, subtotal, discount_amount, total, promo_code_id, shipping_address, contact_email, contact_phone, notes, customer_id, order_number, idempotency_key, created_at, updated_at) VALUES ('c3333333-3333-4333-8333-333333333333', NULL, 'pending', '150.00', '0.00', '150.00', NULL, '{"address":"Carretera a El Salvador Km 14.5, Santa Catarina Pinula","customerName":"QA Cliente 01"}'::jsonb, 'qa.cliente01@zzaly.test', '55512345', NULL, 1, 'ORD-QA-1003', NULL, '2026-10-28T04:24:39.781Z', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Tabla: zz_order_items (4 registros)
-- ----------------------------------------------------------------------------
INSERT INTO zz_order_items (id, order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal, created_at) VALUES (1, 'c1111111-1111-4111-8111-111111111111', 2, 'Vestido Floral Lía', 'M', 'Negro', 1, '350.00', '350.00', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_order_items (id, order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal, created_at) VALUES (2, 'c2222222-2222-4222-8222-222222222222', 4, 'Blusa Seda Ana', 'S', 'Negro', 2, '175.00', '350.00', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_order_items (id, order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal, created_at) VALUES (3, 'c2222222-2222-4222-8222-222222222222', 2, 'Vestido Floral Lía (Especial QA)', 'M', 'Negro', 1, '165.00', '165.00', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;
INSERT INTO zz_order_items (id, order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal, created_at) VALUES (4, 'c3333333-3333-4333-8333-333333333333', 6, 'Pantalón Casual Vera', 'M', 'Negro', 1, '150.00', '150.00', '2026-10-28T04:24:39.781Z') ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Tabla: zz_payments (0 registros)
-- ----------------------------------------------------------------------------

COMMIT;
