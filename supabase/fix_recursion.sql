-- ================================================================
-- FashionVerse — Fix Infinite Recursion Bug
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Drop the policies that caused infinite recursion
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;

-- 2. Create a secure function that bypasses RLS to check for admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 3. Re-create the read policy using the secure function (No Recursion!)
CREATE POLICY "admin_read_all_profiles"
ON profiles FOR SELECT
USING (
  auth.uid() = id OR is_admin()
);

-- 4. Re-create the update policy using the secure function
CREATE POLICY "admin_update_profiles"
ON profiles FOR UPDATE
USING (
  auth.uid() = id OR is_admin()
);

-- Note: We also allow users to update their own profile (auth.uid() = id) 
-- so they can change their name or avatar.
