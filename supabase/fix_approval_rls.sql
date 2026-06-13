-- ================================================================
-- FashionVerse — Fix Delivery Approval System
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

-- ─── STEP 1: Allow admins to update profile roles ──────────────
-- Without this, the admin's approve/reject buttons silently fail!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'admin_update_profiles'
  ) THEN
    CREATE POLICY "admin_update_profiles"
    ON profiles FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- ─── STEP 2: Allow admins to read all profiles ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'admin_read_all_profiles'
  ) THEN
    CREATE POLICY "admin_read_all_profiles"
    ON profiles FOR SELECT
    USING (
      auth.uid() = id OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- ─── STEP 3: Create a secure RPC to approve a driver ──────────
-- This runs with SECURITY DEFINER = bypasses RLS entirely
-- Only callable when the caller is confirmed as admin
CREATE OR REPLACE FUNCTION approve_driver(target_user_id UUID, application_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Verify the caller is an admin
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can approve drivers.';
  END IF;

  -- Update the driver's profile role
  UPDATE profiles SET role = 'delivery_approved' WHERE id = target_user_id;

  -- Update the application status
  UPDATE delivery_applications
  SET status = 'approved', reviewed_at = NOW(), reviewed_by = auth.uid()
  WHERE id = application_id;
END;
$$;

-- ─── STEP 4: Create a secure RPC to reject a driver ───────────
CREATE OR REPLACE FUNCTION reject_driver(target_user_id UUID, application_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can reject drivers.';
  END IF;

  UPDATE profiles SET role = 'customer' WHERE id = target_user_id;

  UPDATE delivery_applications
  SET status = 'rejected', reviewed_at = NOW(), reviewed_by = auth.uid()
  WHERE id = application_id;
END;
$$;

-- ─── STEP 5: Create a secure RPC to suspend a driver ──────────
CREATE OR REPLACE FUNCTION suspend_driver(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can suspend drivers.';
  END IF;

  UPDATE profiles SET role = 'delivery_suspended' WHERE id = target_user_id;
END;
$$;

-- ─── STEP 6: Create a secure RPC to restore a driver ──────────
CREATE OR REPLACE FUNCTION restore_driver(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can restore drivers.';
  END IF;

  UPDATE profiles SET role = 'delivery_approved' WHERE id = target_user_id;
END;
$$;

-- ─── DONE ──────────────────────────────────────────────────────
-- Now run this SQL, then refresh your Admin Dashboard.
-- The Approve / Reject / Suspend buttons will now work correctly!
