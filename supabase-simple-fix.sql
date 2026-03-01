-- Just update the RLS policies (skip publication for now)

-- Make sure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Drop and recreate users policies
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users are viewable by authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;

CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Typing indicators policies
DROP POLICY IF EXISTS "Typing indicators are viewable by participants" ON typing_indicators;
DROP POLICY IF EXISTS "Users can view typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can insert typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can update typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can manage their typing indicators" ON typing_indicators;

CREATE POLICY "Users can view typing indicators" ON typing_indicators
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = chat_with_id);

CREATE POLICY "Users can manage their typing indicators" ON typing_indicators
  FOR ALL USING (auth.uid() = user_id);
