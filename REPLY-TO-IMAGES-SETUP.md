# Reply to Images Feature Setup

## Overview
Users can now reply to photo messages, and the reply preview will show a thumbnail of the image.

## Database Changes Required

Run this SQL in your Supabase SQL Editor:

```sql
-- Add reply_to_image_url column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_image_url TEXT;
```

Or use the provided file: `ADD-REPLY-IMAGE-COLUMN.sql`

## Features Added

1. **Reply to Image Messages**: Users can swipe or click reply on image messages
2. **Image Thumbnail in Reply Preview**: Shows a small thumbnail (8x8px in messages, 6x6px in input) when replying to an image
3. **Reply with Image**: Users can send an image as a reply to another message (text or image)
4. **Consistent UI**: Reply previews show "📷 Image" text with thumbnail for image replies

## Files Modified

- `chat-app/components/ChatWindow.tsx` - Added image reply support
- `chat-app/lib/supabase.ts` - Added `reply_to_image_url` to Message type
- `chat-app/ADD-REPLY-IMAGE-COLUMN.sql` - Database migration script

## How It Works

1. When replying to an image message, the system stores:
   - `reply_to_id`: ID of the original message
   - `reply_to_text`: "📷 Image"
   - `reply_to_sender`: ID of the original sender
   - `reply_to_image_url`: URL of the original image

2. Reply preview displays:
   - Small thumbnail of the image
   - "📷 Image" text
   - Sender name

3. Works for both:
   - Replying to an image with text
   - Replying to an image with another image
   - Replying to text with an image

## Testing

1. Run the SQL migration in Supabase
2. Restart your dev server
3. Send an image message
4. Swipe or click reply on the image
5. Send a text or image reply
6. Verify the thumbnail appears in the reply preview
