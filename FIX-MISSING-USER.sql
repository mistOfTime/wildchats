-- Check if user exists in users table
SELECT id, username, email, online, created_at 
FROM users 
WHERE id = '066931cc-bf20-434f-86a8-6a2030e82747';

-- If the user doesn't exist, insert them manually
-- Replace 'Uriel' with the desired username
INSERT INTO users (id, username, email, online, last_seen)
VALUES (
  '066931cc-bf20-434f-86a8-6a2030e82747',
  'Uriel',
  'urielfykeux@gmail.com',
  false,
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  username = EXCLUDED.username,
  email = EXCLUDED.email;

-- Verify the user now exists
SELECT id, username, email, online, created_at 
FROM users 
WHERE id = '066931cc-bf20-434f-86a8-6a2030e82747';
