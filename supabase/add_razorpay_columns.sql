-- ================================================================
-- FashionVerse — Razorpay Integration: Add payment tracking columns
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id     TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_signature    TEXT;
