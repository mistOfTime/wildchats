-- Step 1: Drop ALL policies first (they depend on columns)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;

DROP POLICY IF EXISTS "Typing indicators are viewable by participants" ON typing_indicators;
DROP POLICY IF EXISTS "Users can view typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can insert typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can update typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can manage their typing indicators" ON typing_indicators;

-- Step 2: Drop all dependent constraints and indexes
DROP INDEX IF EXISTS idx_messages_sender;
DROP INDEX IF EXISTS idx_messages_receiver;
DROP INDEX IF EXISTS idx_messages_created_at;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE typing_indicators DROP CONSTRAINT IF EXISTS typing_indicators_user_id_fkey;
ALTER TABLE typing_indicators DROP CONSTRAINT IF EXISTS typing_indicators_chat_with_id_fkey;

-- Step 3: Drop the primary key constraint on users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique;

-- Step 4: Modify the users table
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 5: Add back primary key and unique constraint
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Step 6: Recreate foreign key constraints
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

-- Step 7: Recreate indexes
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Step 8: Recreate RLS policies for users
CREATE POLICY "Users are viewable by authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id OR auth.role() = 'authenticated');

-- Step 9: Recreate messages policies
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Step 10: Recreate typing indicators policies
CREATE POLICY "Users can view typing indicators" ON typing_indicators
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = chat_with_id);

CREATE POLICY "Users can manage their typing indicators" ON typing_indicators
  FOR ALL USING (auth.uid() = user_id);
