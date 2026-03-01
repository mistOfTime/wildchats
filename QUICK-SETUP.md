# Quick Setup for Avatar Upload

## Step 1: Create Storage Bucket in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Storage" in the left sidebar
4. Click "Create a new bucket"
5. Name: `avatars`
6. **Toggle "Public bucket" to ON** ✅
7. Click "Create bucket"

## Step 2: Test the Feature

1. Go to http://localhost:3000
2. Login with your account
3. Click your avatar (top left corner)
4. Click "Edit Profile"
5. Click the upload area
6. Select an image from your device
7. Wait for upload (you'll see "Uploading...")
8. Click "Save Changes"
9. Your avatar now appears everywhere! 🎉

## That's it!

No SQL needed - the bucket creation is all you need!

The app will:
- ✅ Upload images directly from your device
- ✅ Store them in Supabase Storage
- ✅ Display them everywhere (user list, chat, profiles)
- ✅ Handle all the security automatically

## Troubleshooting

**"Failed to upload image"**
- Make sure the bucket is named exactly `avatars`
- Make sure "Public bucket" is enabled
- Try refreshing the page

**Image not showing**
- Check if upload completed successfully
- Try clicking "Save Changes" again
- Clear browser cache and refresh
