-- ================================================================
-- FashionVerse — Delivery System: Add missing order columns
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_pin     TEXT,
  ADD COLUMN IF NOT EXISTS pin_attempts     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_verified     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_id        UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS claimed_at       TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivered_at     TIMESTAMP WITH TIME ZONE;

-- Backfill: generate a 4-digit PIN for any existing orders that don't have one yet
UPDATE orders
SET delivery_pin = LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0')
WHERE delivery_pin IS NULL AND status NOT IN ('cancelled', 'delivered');
