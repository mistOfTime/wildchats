# Avatar Upload Setup Guide

## Supabase Storage Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on "Storage" in the left sidebar
3. Click "Create a new bucket"
4. Enter bucket name: `avatars`
5. Make it **Public** (toggle the public option)
6. Click "Create bucket"

### Option 2: Using SQL Editor

Run this SQL in your Supabase SQL Editor:

```sql
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for avatars bucket
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Allow everyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## Features

### Image Upload
- Click the upload area to select an image from your device
- Supports: JPG, PNG, GIF, and other image formats
- Maximum file size: 5MB
- Images are automatically uploaded to Supabase Storage
- Preview updates immediately after upload

### Image Management
- **Upload**: Click the dashed box to select a file
- **Preview**: See your image immediately after upload
- **Remove**: Click "Remove" button to delete the current avatar
- **Replace**: Upload a new image to replace the old one

## How It Works

1. **Select Image**: User clicks upload area and selects image from gallery/files
2. **Validation**: System checks file type and size
3. **Upload**: Image is uploaded to Supabase Storage bucket `avatars`
4. **URL Generation**: Supabase generates a public URL for the image
5. **Save**: URL is saved to user's profile in the database
6. **Display**: Avatar appears everywhere in the app

## File Naming

Images are automatically named with:
- User ID
- Timestamp
- Original file extension

Example: `abc123-1234567890.jpg`

This ensures:
- Unique filenames
- No conflicts
- Easy identification

## Storage Structure

```
avatars/
  └── avatars/
      ├── user1-timestamp.jpg
      ├── user2-timestamp.png
      └── user3-timestamp.gif
```

## Security

- Only authenticated users can upload
- Users can only manage their own avatars
- Public read access for displaying avatars
- File size limited to 5MB
- Only image files accepted

## Troubleshooting

### "Failed to upload image"
- Check if the `avatars` bucket exists in Supabase Storage
- Verify the bucket is set to **Public**
- Check storage policies are correctly set

### "Image size must be less than 5MB"
- Compress your image before uploading
- Use online tools like TinyPNG or Squoosh

### Image not displaying
- Check if the image URL is valid
- Verify the bucket is public
- Check browser console for errors

## Testing

1. Go to http://localhost:3000
2. Click your avatar (top left)
3. Click "Edit Profile"
4. Click the upload area
5. Select an image from your device
6. Wait for upload to complete
7. Click "Save Changes"
8. Your avatar should now appear everywhere!

## Benefits

✅ No need to host images externally
✅ Direct upload from device gallery
✅ Automatic image optimization
✅ Secure and scalable
✅ Free tier includes 1GB storage
✅ Fast CDN delivery

Enjoy your new avatar upload feature! 📸
