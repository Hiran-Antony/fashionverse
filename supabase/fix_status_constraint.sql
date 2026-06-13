-- ================================================================
-- FashionVerse — Fix Order Status Constraint
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

-- Drop the existing check constraint on the orders table
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add it back with ALL the new statuses allowed
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending', 
  'confirmed', 
  'packed', 
  'ready_to_ship', 
  'shipped', 
  'out_for_delivery', 
  'delivered', 
  'cancelled'
));
