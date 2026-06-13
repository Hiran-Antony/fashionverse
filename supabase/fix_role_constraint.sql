-- ================================================================
-- FashionVerse — Fix Profile Role Constraint
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Drop any existing constraint on the role column.
-- Supabase usually auto-names it 'profiles_role_check'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. If it was named something else, let's also remove any constraint attached to the role column dynamically
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass
      AND pg_get_constraintdef(oid) LIKE '%role%';
      
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END IF;
END $$;

-- 3. Add the fully updated constraint that allows all the new delivery roles
-- (We also include 'user' just in case some old accounts have that instead of 'customer')
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'customer',
  'user',
  'admin',
  'delivery_pending',
  'delivery_approved',
  'delivery_suspended'
));
