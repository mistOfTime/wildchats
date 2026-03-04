-- ============================================
-- AUTO-SYNC ALL AUTH USERS TO USERS TABLE
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- Step 1: Sync all existing auth users to users table
INSERT INTO users (id, username, email, online, last_seen)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as username,
  au.email,
  false as online,
  NOW() as last_seen
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create a function to auto-sync new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, online, last_seen)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, users.username);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 4: Create trigger to auto-sync on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify all users are synced
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM users) as total_chat_users
FROM auth.users;

-- Step 6: Show any missing users (should be empty after running this)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as username
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = au.id
);

-- ============================================
-- DONE! Now all users will automatically appear in chat list
-- ============================================
