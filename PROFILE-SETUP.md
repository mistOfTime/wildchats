# Profile Feature Setup Guide

## Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Add bio and avatar_url columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS policies to allow users to update their bio and avatar
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

## Features Added

### 1. Profile Viewing
- Click on any user's avatar to view their profile
- See username, email, bio, online status, and last seen
- View your own profile by clicking your avatar in the sidebar

### 2. Profile Editing
- Click "Edit Profile" when viewing your own profile
- Update your username
- Add a bio (up to 200 characters)
- Set an avatar URL

### 3. Profile Customization
- **Username**: Change your display name
- **Bio**: Tell others about yourself
- **Avatar**: Add a profile picture URL (e.g., from Gravatar, Imgur, etc.)

## How to Use

### View a Profile
1. Click on any user's avatar in the user list
2. Or click on the avatar in the chat header
3. Profile modal will open showing their info

### Edit Your Profile
1. Click your own avatar in the sidebar (top left)
2. Click "Edit Profile" button
3. Update your information:
   - Change username
   - Write a bio
   - Add avatar URL
4. Click "Save Changes"

### Avatar URLs
You can use any image URL for your avatar:
- Gravatar: https://www.gravatar.com/avatar/[hash]
- Imgur: https://i.imgur.com/[id].jpg
- Any direct image link

Example URLs:
- `https://i.imgur.com/abc123.jpg`
- `https://avatars.githubusercontent.com/u/12345`
- `https://www.gravatar.com/avatar/abc123`

## UI Features

### Profile View Modal
- Beautiful gradient header
- Large avatar display
- Online/offline status indicator
- Last seen timestamp
- Bio section
- "Send Message" button (for other users)
- "Edit Profile" button (for your own profile)

### Profile Edit Modal
- Live avatar preview
- Username input
- Bio textarea with character counter (200 max)
- Avatar URL input
- Save/Cancel buttons
- Error handling

## Tips

1. **Avatar Images**: Use square images (1:1 ratio) for best results
2. **Bio**: Keep it short and interesting (200 characters max)
3. **Username**: Choose something memorable
4. **Profile Updates**: Changes are saved immediately and visible to all users

## Interactions

- **Click avatar in user list**: View profile
- **Click avatar in chat header**: View profile
- **Click your avatar**: View your own profile
- **From your profile**: Click "Edit Profile" to customize
- **From other profiles**: Click "Send Message" to start chatting

Enjoy your new profile features! 🎉
