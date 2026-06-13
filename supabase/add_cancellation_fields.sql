-- ================================================================
-- FashionVerse — Add Cancellation Reason Fields to Orders
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_category TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
