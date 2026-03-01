-- STEP 1: Disable RLS temporarily and drop ALL policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators DISABLE ROW LEVEL SECURITY;

-- Drop all policies on users table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;
END $$;

-- Drop all policies on messages table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON messages';
    END LOOP;
END $$;

-- Drop all policies on typing_indicators table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'typing_indicators') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON typing_indicators';
    END LOOP;
END $$;

-- STEP 2: Drop constraints and indexes
DROP INDEX IF EXISTS idx_messages_sender;
DROP INDEX IF EXISTS idx_messages_receiver;
DROP INDEX IF EXISTS idx_messages_created_at;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE typing_indicators DROP CONSTRAINT IF EXISTS typing_indicators_user_id_fkey;
ALTER TABLE typing_indicators DROP CONSTRAINT IF EXISTS typing_indicators_chat_with_id_fkey;

-- STEP 3: Drop primary key and unique constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique;

-- STEP 4: Alter column type
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- STEP 5: Recreate primary key and unique constraint
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- STEP 6: Recreate foreign key constraints
ALTER TABLE messages 
  ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages 
  ADD CONSTRAINT messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE typing_indicators 
  ADD CONSTRAINT typing_indicators_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE typing_indicators 
  ADD CONSTRAINT typing_indicators_chat_with_id_fkey 
  FOREIGN KEY (chat_with_id) REFERENCES users(id) ON DELETE CASCADE;

-- STEP 7: Recreate indexes
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- STEP 8: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- STEP 9: Create new policies
CREATE POLICY "Users are viewable by authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id OR auth.role() = 'authenticated');

CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view typing indicators" ON typing_indicators
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = chat_with_id);

CREATE POLICY "Users can manage their typing indicators" ON typing_indicators
  FOR ALL USING (auth.uid() = user_id);
