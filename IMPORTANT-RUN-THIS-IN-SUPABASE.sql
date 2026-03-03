-- ⚠️ IMPORTANT: Run this in Supabase SQL Editor to fix username update issue ⚠️
-- This fixes the Row Level Security (RLS) policy that prevents username updates

-- Step 1: Drop the old policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Step 2: Create new policy that allows users to update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 3: Verify the policy was created (should return 1 row)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND policyname = 'Users can update own profile';

-- If you see the policy listed above, the fix is complete!
-- Now try changing your username in the app - it should work!
