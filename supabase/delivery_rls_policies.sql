-- ================================================================
-- FashionVerse — RLS Policy for Delivery Drivers
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

-- Allow approved delivery drivers to update the orders they are claiming or delivering
CREATE POLICY "Delivery drivers can update orders" ON orders
FOR UPDATE
USING (
  -- They can update if it's currently unassigned (claiming) OR they are the assigned driver
  (driver_id IS NULL OR driver_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND role = 'delivery_approved'
  )
);

-- Ensure delivery drivers can view all orders that are packed or assigned to them
CREATE POLICY "Delivery drivers can view relevant orders" ON orders
FOR SELECT
USING (
  status = 'packed' 
  OR driver_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND role = 'admin'
  )
);
