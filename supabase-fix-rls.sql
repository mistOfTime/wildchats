-- Update the insert policy to allow authenticated users to create their profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = id AND 
    auth.role() = 'authenticated'
  );

-- Also allow upsert (update or insert)
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (
    auth.uid() = id OR 
    auth.role() = 'authenticated'
  );
