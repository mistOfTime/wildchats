-- Delete user: luslus nimo (bloodycape881@gmail.com)
-- This will delete the user and all related data

-- First, delete all messages sent by this user
DELETE FROM messages WHERE sender_id IN (
  SELECT id FROM users WHERE email = 'bloodycape881@gmail.com'
);

-- Delete all messages received by this user
DELETE FROM messages WHERE receiver_id IN (
  SELECT id FROM users WHERE email = 'bloodycape881@gmail.com'
);

-- Delete typing indicators for this user
DELETE FROM typing_indicators WHERE user_id IN (
  SELECT id FROM users WHERE email = 'bloodycape881@gmail.com'
);

-- Delete typing indicators where this user is the chat partner
DELETE FROM typing_indicators WHERE chat_with_id IN (
  SELECT id FROM users WHERE email = 'bloodycape881@gmail.com'
);

-- Delete the user from the users table
DELETE FROM users WHERE email = 'bloodycape881@gmail.com';

-- Delete from auth.users (Supabase authentication)
DELETE FROM auth.users WHERE email = 'bloodycape881@gmail.com';
