-- ============================================================================
-- MIGRACIÓN 02: Soporte para estado 'paid' en ENUM order_status
-- ============================================================================

DO $$ BEGIN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid' AFTER 'pending';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN OTHERS THEN null;
END $$;
