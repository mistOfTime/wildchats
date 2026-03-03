-- Fix username update issue by ensuring proper RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile';
