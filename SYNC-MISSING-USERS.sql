-- Sync all auth users that are missing from the users table
INSERT INTO public.users (id, username, email, online, last_seen, created_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as username,
  au.email,
  false as online,
  NOW() as last_seen,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
