# OAuth Setup Guide (Facebook & GitHub Login)

## Features Added
✅ Facebook login button
✅ GitHub login button  
✅ Beautiful UI with icons
✅ "Or continue with email" divider

## Setup Required

To enable Facebook and GitHub login, you need to configure them in Supabase:

### 1. Go to Supabase Dashboard
1. Open your project at https://supabase.com/dashboard
2. Go to **Authentication** → **Providers**

### 2. Enable Facebook Login

1. Click on **Facebook** in the providers list
2. Toggle **Enable Sign in with Facebook** to ON
3. You'll need to create a Facebook App:
   - Go to https://developers.facebook.com/apps
   - Create a new app
   - Add Facebook Login product
   - Get your **App ID** and **App Secret**
4. Enter the credentials in Supabase
5. Add the callback URL from Supabase to your Facebook App settings

### 3. Enable GitHub Login

1. Click on **GitHub** in the providers list
2. Toggle **Enable Sign in with GitHub** to ON
3. You'll need to create a GitHub OAuth App:
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Get your **Client ID** and **Client Secret**
4. Enter the credentials in Supabase
5. Add the callback URL from Supabase to your GitHub App settings

## How It Works

When users click the Facebook or GitHub button:
1. They're redirected to Facebook/GitHub to authorize
2. After authorization, they're redirected back to your app
3. Supabase creates a user account automatically
4. User profile is created in your `users` table
5. User is logged in and can start chatting

## Testing Without OAuth Setup

The buttons are already in your app! But they won't work until you:
1. Configure the providers in Supabase
2. Set up Facebook/GitHub apps
3. Add the credentials

For now, users can still use email/password login.

## Benefits

- **Faster signup** - No need to remember passwords
- **More secure** - OAuth providers handle security
- **Better UX** - One-click login
- **Social integration** - Can access user's profile info

## UI Features

- Clean button design with provider icons
- Hover effects
- Dark mode support
- "Or continue with email" divider
- Consistent with your maroon/gold theme

Enjoy your new social login options! 🎉
