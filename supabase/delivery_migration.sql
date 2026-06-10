-- ================================================================
-- FashionVerse — Delivery Management System Migration
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ================================================================

-- ─── STEP 1: Update profiles table with role column ───────────
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer'
CHECK (role IN (
  'customer',
  'admin',
  'delivery_pending',
  'delivery_approved',
  'delivery_suspended'
));

-- ─── STEP 2: Update orders table with delivery columns ─────────
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_pin    TEXT,
ADD COLUMN IF NOT EXISTS driver_id       UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS pin_verified    BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pin_attempts    INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS claimed_at      TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at    TIMESTAMP WITH TIME ZONE;

-- ─── STEP 3: Auto-generate 4-digit PIN on new orders ──────────
CREATE OR REPLACE FUNCTION generate_delivery_pin()
RETURNS TRIGGER AS $$
BEGIN
  NEW.delivery_pin := LPAD(
    FLOOR(RANDOM() * 9000 + 1000)::TEXT,
    4, '0'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_delivery_pin ON orders;
CREATE TRIGGER set_delivery_pin
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_delivery_pin();

-- ─── STEP 4: Create delivery_applications table ────────────────
CREATE TABLE IF NOT EXISTS delivery_applications (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  phone          TEXT NOT NULL,
  vehicle_type   TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  license_number TEXT NOT NULL,
  city           TEXT NOT NULL,
  experience     TEXT,
  status         TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at    TIMESTAMP WITH TIME ZONE,
  reviewed_by    UUID REFERENCES profiles(id)
);

-- ─── STEP 5: RLS Policies for orders ──────────────────────────
-- Note: Run only if you don't already have conflicting policies.
-- Customers can see their own orders (including their PIN)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'customer_own_orders'
  ) THEN
    CREATE POLICY "customer_own_orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Approved drivers can view unassigned or their own orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'driver_view_orders'
  ) THEN
    CREATE POLICY "driver_view_orders"
    ON orders FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'delivery_approved'
      )
    );
  END IF;
END $$;

-- Drivers can update only their own assigned orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'driver_update_orders'
  ) THEN
    CREATE POLICY "driver_update_orders"
    ON orders FOR UPDATE
    USING (driver_id = auth.uid());
  END IF;
END $$;

-- Admin can do everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'admin_all_orders'
  ) THEN
    CREATE POLICY "admin_all_orders"
    ON orders FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- ─── STEP 6: RLS Policies for delivery_applications ───────────
ALTER TABLE delivery_applications ENABLE ROW LEVEL SECURITY;

-- Drivers can insert their own application
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'delivery_applications' AND policyname = 'driver_insert_application'
  ) THEN
    CREATE POLICY "driver_insert_application"
    ON delivery_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Drivers can view their own application
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'delivery_applications' AND policyname = 'driver_view_own_application'
  ) THEN
    CREATE POLICY "driver_view_own_application"
    ON delivery_applications FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Admin can view and update all applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'delivery_applications' AND policyname = 'admin_all_applications'
  ) THEN
    CREATE POLICY "admin_all_applications"
    ON delivery_applications FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- ─── DONE ──────────────────────────────────────────────────────
-- Your database is now ready for the Delivery Management System.
