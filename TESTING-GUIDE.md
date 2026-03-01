# Chat App Testing Guide

## Fixed Issues ✅

1. **Loading Screen Issue**: Added automatic localStorage cleanup on auth errors
2. **Invalid Refresh Token**: App now detects and clears bad session data
3. **Forgot Password Flow**: Complete verification code system working
4. **Session Management**: Better error handling and state management

## How to Test

### 1. Clear Browser Data (If Stuck on Loading)
If you see the loading screen:
- Click the "Clear session and reload" button that now appears
- Or manually: Open DevTools (F12) → Application → Storage → Clear site data

### 2. Test Sign Up
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter:
   - Full Name: Test User
   - Email: test@example.com
   - Password: password123
4. Click "Sign Up"
5. Should redirect to chat immediately (email confirmation disabled)

### 3. Test Login
1. Go to http://localhost:3000
2. Enter your email and password
3. Click "Login"
4. Should see the chat interface

### 4. Test Forgot Password Flow
1. Go to http://localhost:3000
2. Click "Forgot Password?"
3. Enter your email
4. Click "Send Verification Code"
5. **IMPORTANT**: An alert will show the 6-digit code (in production, this would be sent via email)
6. Copy the code from the alert
7. Paste the code in the verification field
8. Click "Verify Code"
9. Enter new password (twice)
10. Click "Reset Password"
11. Should see success message and redirect to login
12. Login with your new password

### 5. Test Chat Features
Once logged in:
- Send messages to other users
- See online/offline status
- See typing indicators
- Search for users
- Toggle dark/light theme
- Check last seen timestamps

## Environment Setup

Make sure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://ynedprjzsrjgqxxmyqtb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Setup

Run this SQL in Supabase SQL Editor:
```sql
-- Run supabase-final.sql to set up RLS policies
```

## Supabase Settings

1. Go to Authentication → Settings
2. Disable "Enable email confirmations" (for development)
3. Save changes

## Common Issues

### Stuck on Loading Screen
- Click "Clear session and reload" button
- Or clear browser localStorage manually

### "Invalid login credentials"
- Make sure you're using the correct email/password
- Try the forgot password flow to reset

### Verification Code Not Working
- Check the alert popup for the code
- Code expires in 10 minutes
- Make sure you're using the most recent code

### Can't Access Chat
- Make sure you're logged in
- Check browser console for errors
- Try clearing localStorage and logging in again

## Development Server

Start the dev server:
```bash
cd chat-app
npm run dev
```

Access at:
- http://localhost:3000
- http://192.168.101.16:3000

## Next Steps

1. Test complete forgot password flow
2. Create multiple users and test chat
3. Test on different browsers
4. Test dark/light theme toggle
5. Verify all real-time features work

## Production Considerations

Before deploying:
1. Replace alert() with actual email service (SendGrid, AWS SES, etc.)
2. Enable email confirmations in Supabase
3. Add rate limiting for password reset requests
4. Add CAPTCHA to prevent abuse
5. Set up proper error logging
6. Add email templates for verification codes
